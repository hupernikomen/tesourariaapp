import { createContext, useEffect, useState } from "react";
import { db } from '../firebaseConnection';
import { updateDoc, doc, collection, getDocs, query, limit, orderBy, getDoc } from "firebase/firestore";

export const AppContext = createContext({})

export function AppProvider({ children }) {
  const [resumoFinanceiro, setResumoFinanceiro] = useState([]);
  const [saldoAtual, setSaldoAtual] = useState(0);
  const [dadosFinancas, setDadosFinanceiros] = useState([]);
  const [futurosTotal, setFuturosTotal] = useState(0);
  const [dadosParcelas, setDadosParcelas] = useState([]);
  const [loadSaldo, setLoadSaldo] = useState(true);
  const [swipedItemId, setSwipedItemId] = useState(null);

  useEffect(() => {
    BuscarRegistrosFinanceiros();
  }, []);

  async function BuscarFuturos() {
    const parcelasCollection = collection(db, 'futuro');
    const parcelasQuery = query(parcelasCollection, orderBy('reg', 'desc'));
    try {
      const querySnapshot = await getDocs(parcelasQuery);
      const allDocuments = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // Calcula o total do registro somando os valores das parcelas
        const totalRegistro = data.parcelas
          ? data.parcelas.reduce((sum, parcela) => sum + (parcela.valor || 0), 0)
          : 0;
        return {
          id: doc.id,
          ...data,
          totalRegistro, // Adiciona o total do registro ao objeto
        };
      });

      // Calcula o total geral somando os totais de cada registro
      const futurosTotal = allDocuments.reduce((total, doc) => {
        return total + (doc.totalRegistro || 0);
      }, 0);

      // Armazena os dados e o total no estado
      setDadosParcelas(allDocuments);
      setFuturosTotal(futurosTotal);
    } catch (e) {
      console.log('Erro ao buscar documentos: ', e);
    }
  }

  async function BuscarRegistrosFinanceiros() {
    const registrosCollection = collection(db, "registros");
    const registrosQuery = query(registrosCollection, orderBy("reg", "desc"), limit(500));

    setLoadSaldo(true);
    try {
      const querySnapshot = await getDocs(registrosQuery);
      const registros = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setDadosFinanceiros(registros);
      await BuscarSaldo();
      await BuscarFuturos();
    } catch (e) {
      console.log("Erro ao buscar documentos: ", e);
    } finally {
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
    const saldo = doc(db, "saldoAtual", "1");
    try {
      getDoc(saldo).then((resposta) => {
        setSaldoAtual(resposta.data()?.saldo);
      });

      await ResumoFinanceiro();
    } catch (error) {
      console.log("Erro ao buscar Saldo em Home", error);
    }
  }

  async function ResumoFinanceiro() {
    // Define o saldo inicial fixo de 5.000
    const SALDO_INICIAL = 5000;

    // Referência à coleção "registros" no Firestore
    const ref = collection(db, "registros");

    // Cria uma consulta para obter os registros, ordenados pela data (dataDoc) em ordem decrescente
    const refs = query(ref, orderBy("dataDoc", "desc"));

    // Objeto para armazenar os resultados agrupados por ano e mês
    const resultadosMap = {};

    // Executa a consulta e obtém os documentos
    const querySnapshot = await getDocs(refs);

    // Verifica se a consulta retornou documentos
    if (querySnapshot.empty) {
      console.log("Nenhum registro encontrado. Retornando valores zerados com saldo inicial.");
      await AtualizaSaldoAtual(SALDO_INICIAL); // Atualiza o saldo atual com o saldo inicial
      setResumoFinanceiro([{
        tipos: {}, // Retorna objeto vazio para tipos
        movements: [] // Array vazio para movimentos
      }]);
      return; // Sai da função se não houver registros
    }

    // Itera sobre cada documento retornado
    querySnapshot.forEach((doc) => {
      const data = doc.data(); // Obtém os dados do documento

      const dataTimestamp = data.dataDoc; // Obtém a data do registro
      const valor = data.valor || 0; // Obtém o valor do registro, default 0
      const movimentacao = data.movimentacao; // Obtém o tipo de movimentação ('receita' ou 'despesa')
      const detalhamento = data.detalhamento || '';
      const dataDoc = data.dataDoc;
      const tipo = data.tipo || 'Sem Tipo'; // Obtém o tipo da movimentação
      const ministerio = data.ministerio ? data.ministerio.trim() : 'Sem Ministério'; // Obtém o ministério associado ao registro, normalizado


      // Converte o timestamp para Date
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
    let saldoAnterior = SALDO_INICIAL; // Inicializa saldoAnterior com o saldo inicial de 5.000

    // Itera sobre os anos e meses para calcular o saldo
    for (const ano in resultadosMap) {
      for (const mes in resultadosMap[ano]) {
        const mesData = resultadosMap[ano][mes]; // Obtém os dados do mês
        const saldo = mesData.receita - mesData.despesa + saldoAnterior; // Calcula o saldo com saldoAnterior

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

        saldoAnterior = saldo; // Atualiza o saldo anterior para o próximo mês
      }
    }

    // Atualiza o saldo final
    const saldoFinal = resumo.length > 0
      ? resumo[resumo.length - 1].saldo // Obtém o saldo do último mês
      : SALDO_INICIAL; // Usa o saldo inicial se não houver registros
    await AtualizaSaldoAtual(saldoFinal); // Atualiza o saldo atual no sistema

    setResumoFinanceiro(resumo); // Atualiza o estado com os resultados calculados
  }

  async function AtualizaSaldoAtual(res) {
    const docRef = doc(db, "saldoAtual", "1");

    try {
      await updateDoc(docRef, {
        saldo: res
      });
    } catch (e) {
      console.error("Erro ao atualizar documento1: ", e);
    }
  }

  const formatoMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'decimal', // Muda o estilo para decimal
    minimumFractionDigits: 2, // Define o número mínimo de casas decimais
    maximumFractionDigits: 2, // Define o número máximo de casas decimais
  });

  return (
    <AppContext.Provider value={{
      BuscarRegistrosFinanceiros,
      dadosFinancas,
      formatoMoeda,
      AtualizaSaldoAtual,
      ResumoFinanceiro,
      resumoFinanceiro,
      BuscarSaldo,
      saldoAtual,
      obterNomeMes,
      futurosTotal,
      dadosParcelas,
      loadSaldo,
      swipedItemId, setSwipedItemId
    }}>
      {children}
    </AppContext.Provider>
  );
}
