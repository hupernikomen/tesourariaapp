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
    const ref = collection(db, "registros");

    const refs = query(ref, where("idUsuario", "==", usuarioDoAS.usuarioId), orderBy("dataDoc", "desc"));

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
      const ministerio = data.ministerio?.label ? data.ministerio?.label?.trim() : 'Sem Ministério';

      let date;
      try {
        date = dataTimestamp?.toDate ? dataTimestamp.toDate() : new Date(dataTimestamp);
        if (isNaN(date.getTime())) {
          console.warn(`Data inválida para documento ${doc.id}:`, dataTimestamp);
          date = new Date(0); // Data padrão para 1970-01-01
        }
      } catch (error) {
        console.warn(`Erro ao converter dataDoc para documento ${doc.id}:`, error);
        date = new Date(0); // Data padrão para 1970-01-01
      }

      const ano = date.getFullYear(); // Obtém o ano da data
      const mes = date.getMonth(); // Obtém o mês da data (0-11)

      // Agrupa os resultados por ano e mês
      if (!resultadosMap[ano]) resultadosMap[ano] = {}; // Inicializa o ano se não existir
      if (!resultadosMap[ano][mes]) {
        // Inicializa o mês se não existir
        resultadosMap[ano][mes] = {
          nomeMes: obterNomeMes(mes), // Obtém o nome do mês
          receita: 0, // Inicializa a receita
          despesa: 0, // Inicializa a saída
          saldo: 0, // Inicializa o saldo
          tipos: {}, // Inicializa o objeto tipos
          movements: [] // Array para todos os movimentos individuais
        };
      }

      // Atualiza os valores de receita e saída com base no tipo de movimentação
      if (movimentacao === 'receita') {
        resultadosMap[ano][mes].receita += valor; // Adiciona ao total de receitas
      } else if (movimentacao === "despesa") {
        resultadosMap[ano][mes].despesa += valor; // Adiciona ao total de saídas
      }

      // Adiciona o movimento individual ao array movements
      resultadosMap[ano][mes].movements.push({
        detalhamento: detalhamento,
        valor: valor,
        movimentacao: movimentacao,
        tipo: tipo,
        dataDoc: dataDoc, // Usa o valor convertido
        ministerio: ministerio
      });

      // Cria uma chave única combinando tipo e ministerio para evitar sobrescrita
      const chaveUnica = `${tipo}_${ministerio}`;

      // Agrupa por chave única
      if (!resultadosMap[ano][mes].tipos[chaveUnica]) {
        // Inicializa a chave única se não existir
        resultadosMap[ano][mes].tipos[chaveUnica] = {
          total: 0, // Inicializa o total para a combinação
          movimentacao: movimentacao, // Armazena o tipo de movimentação
          ministerio: ministerio, // Armazena o ministério
          detalhamento: detalhamento,
          valor: valor,
          dataDoc: dataDoc, // Usa o mesmo valor convertido
          tipo: tipo, // Armazena o tipo original
          mes: mes // Armazena o mês
        };
      }
      resultadosMap[ano][mes].tipos[chaveUnica].total += valor; // Adiciona o valor ao total da combinação
    });

    // Converte o objeto de resultados em um array para facilitar o uso
    const resumo = [];

    // Itera sobre os anos e meses para calcular o saldo
    for (const ano in resultadosMap) {
      for (const mes in resultadosMap[ano]) {
        const mesData = resultadosMap[ano][mes]; // Obtém os dados do mês
        const saldo = mesData.receita - mesData.despesa; // Calcula o saldo com saldoAnterior

        // Adiciona ao array de resultados se houver receitas ou saídas
        if (mesData.receita > 0 || mesData.despesa > 0) {
          resumo.push({
            ano: parseInt(ano), // Adiciona o ano
            mes: parseInt(mes), // Adiciona o mês
            nomeMes: mesData.nomeMes, // Adiciona o nome do mês
            receita: mesData.receita, // Adiciona o total de receitas
            despesa: mesData.despesa, // Adiciona o total de saídas
            saldo: saldo, // Adiciona o saldo calculado
            tipos: mesData.tipos, // Adiciona o objeto tipos
            movements: mesData.movements // Inclui todos os movimentos individuais
          });
        }

      }
    }

    // Atualiza o saldo final
    const saldoFinal = resumo.length > 0
      && resumo[resumo.length - 1].saldo; // Usa o saldo inicial se não houver registros
    await AtualizaSaldoAtual(saldoFinal); // Atualiza o saldo atual no sistema

    setResumoFinanceiro(resumo); // Atualiza o estado com os resultados calculados
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
      BuscarSaldo
    }}>
      {children}
    </AppContext.Provider>
  );
}
