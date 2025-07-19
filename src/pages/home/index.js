import { useState, useContext, useEffect } from 'react'
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { useNavigation, useIsFocused, useTheme } from '@react-navigation/native'

import CarrosselParcelas from '../../componentes/CarrosselParcelas'
import AntDesign from '@expo/vector-icons/AntDesign';
import { AppContext } from "../../context/appContext";

import { db } from '../../firebaseConnection'
import { getDocs, collection, query, orderBy, limit } from "firebase/firestore"
import Texto from '../../componentes/Texto';

export default function Home() {

  const { resumoFinanceiro, saldoAtual, BuscarSaldo, formatoMoeda, obterNomeMes } = useContext(AppContext)

  const navigation = useNavigation()
  const focus = useIsFocused()

  const [load, setLoad] = useState(false)
  const [dadosFinancas, setRegistros] = useState([])
  const [dadosParcelas, setDadosParcelas] = useState([])
  const [futurosTotal, setFuturosTotal] = useState(0)

  useEffect(() => {
    Promise.all([BuscarRegistrosFinanceiros()])

  }, [focus])


  function obterSaldoMesAnterior(dados) {

    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth() + 1; // getMonth() retorna 0-11, então adicionamos 1

    // Calcular o mês anterior
    let mesAnterior = mesAtual - 1;
    let anoAnterior = anoAtual;

    // Se o mês atual for janeiro, precisamos ajustar para dezembro do ano anterior
    if (mesAnterior < 1) {
      mesAnterior = 12;
      anoAnterior -= 1;
    }

    // Encontrar o saldo do mês anterior
    const mesAnteriorDados = dados.find(d => d.ano === anoAnterior && d.mes === mesAnterior);

    // Retornar o saldo ou uma mensagem se não encontrado
    return mesAnteriorDados ? mesAnteriorDados.saldo : null;
  }



  async function BuscarRegistrosFinanceiros() {

    setLoad(true)

    const registrosCollection = collection(db, "registros");
    const registrosQuery = query(registrosCollection, orderBy("reg", "desc"), limit(500))

    try {
      const querySnapshot = await getDocs(registrosQuery);
      const registros = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setRegistros(registros);
      await BuscarFuturos()
      await BuscarSaldo()

    } catch (e) {
      console.log("Erro ao buscar documentos: ", e);
    } finally {
      setLoad(false)
    }
  }

  async function BuscarFuturos() {
    const parcelasCollection = collection(db, "futuro");
    const parcelasQuery = query(parcelasCollection, orderBy("reg", "desc"));
    try {
      const querySnapshot = await getDocs(parcelasQuery);
      const allDocuments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      // Calcular a soma de todos os campos 'valor'
      const futurosTotal = allDocuments.reduce((total, doc) => {
        return total + (doc.valor || 0); // Adiciona o valor, garantindo que seja 0 se não existir
      }, 0);
      // Armazenar os dados e o total no estado
      setDadosParcelas(allDocuments);
      setFuturosTotal(futurosTotal); // Armazena o total no estado
    } catch (e) {
      console.log("Erro ao buscar documentos: ", e);
    }
  }


  const options = {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };


  const sortedRegistros = dadosFinancas
    ? dadosFinancas.sort((a, b) => {
      const dateA = new Date(a.dataReg);
      const dateB = new Date(b.dataReg);
      return dateB - dateA;
    })
    : [];


  return (
    <View style={{ flex: 1 }}>

      <FlatList
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<ActivityIndicator color={'#659f99ff'} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <View style={{ backgroundColor: '#fff', marginBottom: 14, alignItems: 'center', height: 70, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomStartRadius: 24, borderBottomEndRadius: 24, marginHorizontal: 14 }}>
              {load ?
                <View style={{ alignItems: "center", justifyContent: 'center', flex: 1 }}>
                  <ActivityIndicator color={'#333'} />
                </View>
                :
                <>
                  <View style={{ flex: 1, alignItems: "center" }}>

                    <Text style={{ fontSize: 10, color: '#333' }}>SALDO {obterNomeMes(new Date().getMonth()-1).toUpperCase()}</Text>
                    <Text style={{ color: '#333', fontSize: 16, fontWeight: 600 }}>{formatoMoeda.format(obterSaldoMesAnterior(resumoFinanceiro))}</Text>
                  </View>

                  <View style={{ alignItems: 'center', flex: 1 }}>

                    <Text style={{ fontSize: 10, color: '#333' }}>SALDO {obterNomeMes(new Date().getMonth()).toUpperCase()}</Text>

                    <Text style={{ color: '#333', fontSize: 16, fontWeight: 600 }}>
                      {formatoMoeda.format(saldoAtual)}
                    </Text>
                  </View>


                  <View style={{ flex: 1, alignItems: "center" }}>

                    <Text style={{ fontSize: 10, color: '#333' }}>FUTUROS</Text>
                    <Text style={{ color: '#333', fontSize: 16, fontWeight: 600 }}>{formatoMoeda.format(futurosTotal)}</Text>
                  </View>
                </>
              }
            </View>
            <CarrosselParcelas dadosParcelas={dadosParcelas} />
            <Texto texto={'Últimos Registros'} estilo={{ marginLeft: 35, marginVertical: 14 }} wheight={500} />
          </View>
        }
        data={sortedRegistros.slice(0, 300)} // Filtra para exibir apenas os 5 primeiros itens
        renderItem={({ item, index }) => {

          return (
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => navigation.navigate('DetalheRegistro', item)}
              style={[{ justifyContent: 'center', backgroundColor: '#fff', height: 70, paddingHorizontal: 14, marginBottom: 3, borderRadius: 14, marginHorizontal: 14 }]}
            >
              <View style={{}}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>

                  <View style={{ flexDirection: 'row', backgroundColor: item.movimentacao === 'saida' ? '#F56465' : '#659f99ff', alignSelf: 'flex-start', borderRadius: 10, alignItems: 'center' }}>

                    <Texto texto={`${new Intl.DateTimeFormat('pt-BR', options).format(item.dataDoc)}`} size={10} estilo={{ marginLeft: -1, color: '#fff', backgroundColor: '#fff', borderRadius: 10, color: '#000', paddingHorizontal: 6, paddingVertical: 2 }} />
                    <Texto texto={`${item?.tipo?.toUpperCase()}`} size={9} estilo={{ color: '#fff', paddingHorizontal: 6 }} />
                  </View>
                  {!!item.imageUrl ? <AntDesign name='paperclip'/> : ''}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                  <View style={{ flex: 1, maxWidth: '70%' }}>
                    <Texto linhas={2} texto={item.detalhamento} size={13} estilo={{ flexWrap: 'wrap', marginLeft: 6 }} />
                  </View>
                  <Texto texto={formatoMoeda.format(item.valor)} wheight={400} size={12} estilo={{ color: '#222' }} />
                </View>
              </View>
            </TouchableOpacity>

          );
        }}
      />

    </View>
  )
}