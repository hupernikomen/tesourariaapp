import { createContext, use, useEffect, useState } from "react";
import { db } from '../firebaseConnection';
import { updateDoc, doc, collection, getDocs, query, limit, orderBy, getDoc, addDoc, where, deleteDoc, setDoc, } from "firebase/firestore";
import { getStorage, ref, deleteObject } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const AppContext = createContext({})


export function AppProvider({ children }) {
  const [resumoFinanceiro, setResumoFinanceiro] = useState([]);
  const [saldo, setSaldo] = useState(0);
  const [dadosFinancas, setDadosFinanceiros] = useState([]);
  const [futurosTotal, setFuturosTotal] = useState(0);
  const [dadosParcelas, setDadosParcelas] = useState([]);
  const [loadSaldo, setLoadSaldo] = useState(true);
  const [swipedItemId, setSwipedItemId] = useState(null);
  const [usuarioDoAS, setUsuarioDoAS] = useState('')
  const [notificacao, setNotificacao] = useState('')

  useEffect(() => {
    BuscarUsuarioAsyncStorage()
    HistoricoMovimentos();


  }, []);


  async function BuscarUsuarioAsyncStorage() {
    try {
      const usuarioAsyncStorage = await AsyncStorage.getItem('usuarioAsyncStorage');

      if (usuarioAsyncStorage === null) {
        setUsuarioDoAS(null); // ou outro valor padrão, como {}
        return null; // ou outro valor que indique que não há usuário
      }

      const parseUsuario = JSON.parse(usuarioAsyncStorage);
      setUsuarioDoAS(parseUsuario);
      return parseUsuario; // opcional, dependendo do caso de uso
    } catch (error) {
      console.error('Erro ao buscar usuário do AsyncStorage:', error);
      setUsuario(null); // ou outro valor padrão
      return null; // opcional, para indicar falha
    }

  }




  async function BuscarRegistrosFuturos() {

    try {
      const registros = collection(db, 'futuro');
      const registrosEncontrados = query(
        registros,
        where('idUsuario', '==', usuarioDoAS.usuarioId),
        orderBy('reg', 'desc')
      );
      const snapshot = await getDocs(registrosEncontrados);

      const registrosFuturos = snapshot.docs.map((doc) => {
        const data = doc.data();
        const totalRegistro = Array.isArray(data.parcelas)
          ? data.parcelas.reduce((sum, parcela) => sum + (parcela.valor || 0), 0)
          : 0;
        return {
          id: doc.id,
          ...data,
          totalRegistro,
        };
      });

      const futurosTotal = registrosFuturos.reduce((total, doc) => {
        return total + (doc.totalRegistro || 0);
      }, 0);

      setDadosParcelas(registrosFuturos);
      setFuturosTotal(futurosTotal);
    } catch (e) {
      console.log('Erro ao buscar documentos: ', e);
    }
  }

  function calcularMediaGastos(ministerio, transacoes) {

    if (!transacoes || !Array.isArray(transacoes)) {
      console.warn('transacoes inválido:', transacoes);
      return { mediaSemanal: 0, mediaMensal: 0 };
    }

    const despesas = transacoes.filter(
      (transacao) =>
        transacao.movimentacao === 'despesa' &&
        transacao.ministerio?.label?.toLowerCase() === ministerio.toLowerCase()
    );

    if (despesas.length === 0) {
      return { mediaSemanal: 0, mediaMensal: 0 };
    }

    const totalGastos = despesas.reduce((sum, transacao) => sum + transacao.valor, 0);

    const timestamps = transacoes
      .filter((t) => Number.isFinite(t.dataDoc))
      .map((t) => t.dataDoc);
    if (timestamps.length === 0) {
      return { mediaSemanal: 0, mediaMensal: 0 };
    }

    const dataMin = Math.min(...timestamps);
    const dataMax = Math.max(...timestamps);

    const dataMinDate = new Date(dataMin);
    const diaDaSemanaMin = dataMinDate.getDay();
    const diasAteDomingo = diaDaSemanaMin;
    const inicioSemana = new Date(dataMinDate);
    inicioSemana.setDate(dataMinDate.getDate() - diasAteDomingo);

    const dataMaxDate = new Date(dataMax);
    const diaDaSemanaMax = dataMaxDate.getDay();
    const diasAteSabado = 6 - diaDaSemanaMax;
    const fimSemana = new Date(dataMaxDate);
    fimSemana.setDate(dataMaxDate.getDate() + diasAteSabado);

    const intervaloDias = (fimSemana - inicioSemana) / (1000 * 60 * 60 * 24);

    const semanas = Math.ceil(intervaloDias / 7);
    const meses = intervaloDias / 30;

    const mediaSemanal = semanas > 0 ? totalGastos / semanas : totalGastos;
    const mediaMensal = meses > 0 ? totalGastos / meses : totalGastos;

    const resultado = {
      mediaSemanal: parseFloat(mediaSemanal.toFixed(2)),
      mediaMensal: parseFloat(mediaMensal.toFixed(2)),
    };

    return resultado;
  }

  async function HistoricoMovimentos() {

    setLoadSaldo(true);
    try {

      const registrosCollection = collection(db, "registros");
      const registrosQuery = query(
        registrosCollection,
        where("idUsuario", "==", usuarioDoAS.usuarioId), // Filtra por idUsuario
        orderBy("reg", "desc"),
        limit(500)
      );

      const querySnapshot = await getDocs(registrosQuery);
      const registros = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setDadosFinanceiros(registros);

    } catch (e) {
      console.log("Erro ao buscar documentos ou AsyncStorage: ", e);
    } finally {
      await BuscarSaldo();
      await BuscarRegistrosFuturos();
      setLoadSaldo(false);
    }
  }

  const obterNomeMes = (mes) => {
    const nomesMeses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return nomesMeses[mes];
  };

  async function BuscarSaldo() {

    try {
      const saldoDocRef = doc(db, "saldo", usuarioDoAS.usuarioId);
      const saldoDoc = await getDoc(saldoDocRef);


      if (saldoDoc.exists()) {
        const atual = saldoDoc.data().atual;
        setSaldo(atual);
        await ResumoFinanceiro();
        return atual; // Retorna o valor do campo 'atual'
      } else {
        setSaldo(null); // Define como null se o documento não existir
        await ResumoFinanceiro();
        return null;
      }
    } catch (error) {
      console.log("Erro ao buscar Saldo em Home:", error);
      setSaldo(0); // Define como null em caso de erro
      return null;
    }
  }

  async function ResumoFinanceiro() {
    try {
      if (!usuarioDoAS?.usuarioId) {
        console.warn('ID do usuário não fornecido');
        setResumoFinanceiro([]);
        await AtualizaSaldoAtual(0);
        return [];
      }

      const ref = collection(db, 'registros');
      const refs = query(ref, where('idUsuario', '==', usuarioDoAS.usuarioId), orderBy('dataDoc', 'asc'));
      const resultadosMap = {};
      const querySnapshot = await getDocs(refs);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dataTimestamp = data.dataDoc;
        const valor = data.valor || 0;
        const movimentacao = data.movimentacao;
        const detalhamento = data.detalhamento || '';
        const dataDoc = data.dataDoc;
        const tipo = data.tipo || 'Sem Tipo';
        const ministerio = data.ministerio?.label ? data.ministerio.label.trim() : 'Sem Ministério';

        let date;
        try {
          date = dataTimestamp?.toDate ? dataTimestamp.toDate() : new Date(dataTimestamp);
          if (isNaN(date.getTime())) {
            console.warn(`Data inválida para documento ${doc.id}:`, dataTimestamp);
            date = new Date(0);
          }
        } catch (error) {
          console.warn(`Erro ao converter dataDoc para documento ${doc.id}:`, error);
          date = new Date(0);
        }

        const ano = date.getFullYear();
        const mes = date.getMonth();

        if (!resultadosMap[ano]) resultadosMap[ano] = {};
        if (!resultadosMap[ano][mes]) {
          resultadosMap[ano][mes] = {
            nomeMes: obterNomeMes(mes),
            receita: 0,
            despesa: 0,
            movimentos: [],
            tipos: {},
          };
        }

        if (movimentacao === 'receita') {
          resultadosMap[ano][mes].receita += valor;
        } else if (movimentacao === 'despesa') {
          resultadosMap[ano][mes].despesa += valor;
        }

        resultadosMap[ano][mes].movimentos.push({
          detalhamento,
          valor,
          movimentacao,
          tipo,
          dataDoc,
          ministerio,
        });

        const chaveUnica = `${tipo}_${ministerio}`;
        if (!resultadosMap[ano][mes].tipos[chaveUnica]) {
          resultadosMap[ano][mes].tipos[chaveUnica] = {
            total: 0,
            movimentacao,
            ministerio,
            detalhamento,
            valor,
            dataDoc,
            tipo,
            mes,
          };
        }
        resultadosMap[ano][mes].tipos[chaveUnica].total += valor;
      });

      const resumo = [];
      let saldoAcumulado = 0;

      const anos = Object.keys(resultadosMap).map(Number).sort((a, b) => a - b);
      for (const ano of anos) {
        const meses = Object.keys(resultadosMap[ano]).map(Number).sort((a, b) => a - b);
        for (const mes of meses) {
          const mesData = resultadosMap[ano][mes];
          const saldoMes = mesData.receita - mesData.despesa;
          saldoAcumulado += saldoMes;

          if (mesData.receita > 0 || mesData.despesa > 0) {
            resumo.push({
              ano,
              mes: mes + 1, // Ajusta para 1-12
              nomeMes: mesData.nomeMes,
              receita: mesData.receita,
              despesa: mesData.despesa,
              saldo: saldoAcumulado,
              tipos: mesData.tipos,
              movimentos: mesData.movimentos,
            });
          }
        }
      }

      const saldoFinal = resumo.length > 0 ? resumo[resumo.length - 1].saldo : 0;
      await AtualizaSaldoAtual(saldoFinal);
      setResumoFinanceiro(resumo);

      return resumo;
    } catch (error) {
      console.error('Erro ao calcular resumo financeiro:', error);
      setResumoFinanceiro([]);
      await AtualizaSaldoAtual(0);
      return [];
    }
  }



  async function AtualizaSaldoAtual(res) {
    const saldoDoc = doc(db, "saldo", usuarioDoAS.usuarioId);

    try {
      await setDoc(saldoDoc, {
        atual: res,
      });
    } catch (e) {
      console.error("Erro ao criar/atualizar documento na coleção 'saldo': ", e);
    }
  }

  async function ExcluiRegistro(item) {
    const docRegistrosFinanceiros = doc(db, item.recorrencia ? 'futuro' : 'registros', item.id);
    const imageUrl = item.imageUrl;
    const storage = getStorage();


    try {
      if (imageUrl) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
          console.log('Imagem excluída com sucesso');
        } catch (imageError) {
          if (imageError.code === 'storage/object-not-found') {
            console.log('Imagem já não existe no Storage, continuando...');
          } else {
            throw imageError;
          }
        }
      }

      await deleteDoc(docRegistrosFinanceiros);
      setNotificacao('REGISTRO EXCLUIDO')

    } catch (e) {
      alert('Ocorreu um erro durante a exclusão');

    } finally {
      await ResumoFinanceiro();
      await HistoricoMovimentos();
      setIsSwiped(false);
      setSwipedItemId(null); // Reseta o item deslocado globalmente
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }

  async function RegistrarPagamentoParcela(dataDoc, item) {

    if (item.pago) {
      return;
    }

    try {
      const docRef = doc(db, 'futuro', item.id);
      const docSnapshot = await getDoc(docRef);
      const docData = docSnapshot.data();
      const parcelas = docData.parcelas || [];

      if (!docSnapshot.exists()) {
        throw new Error('Documento não encontrado');
      }

      await addDoc(collection(db, 'registros'), {
        idUsuario: usuarioDoAS.usuarioId,
        reg: item.dataDoc,
        dataDoc: new Date(dataDoc).getTime(),
        tipo: item.tipo,
        valor: item.valor,
        movimentacao: item.movimentacao,
        ministerio: item.ministerio || '',
        imageUrl: item.imageUrl || '',
        detalhamento: item.detalhamento,
        pago: true,
        parcelaQuit: String(item.parcela + '/' + item.recorrencia)
      });

      const novasParcelas = parcelas.filter((p) => p.parcela !== item.parcela);

      if (novasParcelas.length > 0) {
        await updateDoc(docRef, {
          parcelas: novasParcelas,
        });
      } else {
        await deleteDoc(docRef);
      }

      setNotificacao('PAGAMENTO REGISTRADO')

    } catch (e) {
      console.error('Erro ao registrar pagamento da parcela:', e);
      throw e;
    } finally {

      await BuscarRegistrosFuturos()
      await ResumoFinanceiro();
      await HistoricoMovimentos();
      setIsSwiped(false);
      setSwipedItemId(null);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

    }
  }



  const formatoMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'decimal', // Muda o estilo para decimal
    minimumFractionDigits: 2, // Define o número mínimo de casas decimais
    maximumFractionDigits: 2, // Define o número máximo de casas decimais
  });

  return (
    <AppContext.Provider value={{
      HistoricoMovimentos,
      dadosFinancas,
      formatoMoeda,
      AtualizaSaldoAtual,
      ResumoFinanceiro,
      resumoFinanceiro,
      BuscarSaldo,
      saldo,
      obterNomeMes,
      futurosTotal,
      dadosParcelas,
      loadSaldo,
      swipedItemId, setSwipedItemId,
      setUsuarioDoAS,
      usuarioDoAS,
      ExcluiRegistro,
      RegistrarPagamentoParcela,
      BuscarRegistrosFuturos,
      BuscarSaldo,
      calcularMediaGastos,
      notificacao, setNotificacao
    }}>
      {children}
    </AppContext.Provider>
  );
}
