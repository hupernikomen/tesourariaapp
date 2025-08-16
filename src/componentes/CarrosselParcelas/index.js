import { FlatList, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import Texto from '../Texto';
import { useContext } from 'react';
import { AppContext } from '../../context/appContext';
import { useNavigation } from '@react-navigation/native';

const Parcelas = ({ dadosParcelas }) => {

  const { formatoMoeda } = useContext(AppContext)
  const navigation = useNavigation()

  const hoje = new Date();
  const { width } = Dimensions.get('window')
  const options = {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };


  // Processa os dados para criar uma lista de parcelas vencidas
  const dadosFiltrados = dadosParcelas
    ? dadosParcelas
      .flatMap((doc) =>
        doc.parcelas
          .filter((parcela) => {
            const dataDoc = new Date(parcela.dataDoc);
            return dataDoc < hoje; // Filtra apenas parcelas vencidas
          })
          .map((parcela) => ({
            id: doc.id,
            dataDoc: parcela.dataDoc,
            valor: parcela.valor,
            parcela: parcela.parcela,
            recorrencia: doc.recorrencia,
            tipo: doc.tipo,
            movimentacao: doc.movimentacao,
            ministerio: doc.ministerio,
            imageUrl: doc.imageUrl,
            detalhamento: doc.detalhamento,
            totalRegistro: doc.totalRegistro,
          }))
      )
      .sort((a, b) => new Date(a.dataDoc) - new Date(b.dataDoc)) // Ordena por dataDoc (ascendente)
    : [];


  const RenderItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => navigation.navigate('Futuro')}
        style={[{ width: width - 70, justifyContent: 'space-between', backgroundColor: '#fff', padding: 21, borderRadius: 21, marginHorizontal: 14 }]}
      >

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems:'center' }}>

          <View style={{ flexDirection: 'row', backgroundColor: '#E39B0E', borderRadius: 10, alignItems: 'center' }}>

            <Texto texto={`${new Intl.DateTimeFormat('pt-BR', options).format(item.dataDoc)}`} size={11} estilo={{ fontFamily: 'Roboto-Regular', marginLeft: -4, color: '#fff', backgroundColor: '#fff', borderRadius: 10, color: '#000', paddingHorizontal: 6, paddingVertical: 1 }} />
            <Texto texto={`${'VENCIDO'} ${item.parcela ? `${item?.parcela}/${item.recorrencia}` : ''}`} size={9} estilo={{ color: '#fff', paddingHorizontal: 6, fontFamily: 'Roboto-Regular' }} />
          </View>
          <Texto texto={`R$ ${formatoMoeda.format(item.valor)}`} size={13} estilo={{ color: '#000', fontFamily: 'Roboto-Regular' }} />
        </View>


        <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'space-between', marginTop: 7 }}>
          <Texto linhas={2} texto={item.detalhamento} size={14} estilo={{ fontFamily: 'Roboto-Regular' }} />
          {!!item.imageUrl ? <AntDesign name='paperclip' /> : ''}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View>
      {dadosFiltrados.length > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#000', marginLeft: 35 }}>
              VENCIMENTOS
            </Text>
          </View>
        </View>
      ) : null}

      <FlatList
        showsHorizontalScrollIndicator={false}
        horizontal
        snapToInterval={width - 70}
        data={dadosFiltrados}
        keyExtractor={(item, index) => `${item.id}-${item.parcela}-${index}`}
        renderItem={({ item }) => <RenderItem item={item} />}
      />
    </View>
  );
};

export default Parcelas;