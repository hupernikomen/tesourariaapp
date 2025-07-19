import { useNavigation, useTheme } from '@react-navigation/native';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Texto from '../Texto'

const Parcelas = ({ dadosParcelas }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const { width } = Dimensions.get('window')

  const formatoMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'decimal', // Muda o estilo para decimal
    minimumFractionDigits: 2, // Define o número mínimo de casas decimais
    maximumFractionDigits: 2, // Define o número máximo de casas decimais
  });

  const options = {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };

  const sortedDadosParcelas = dadosParcelas
    ? dadosParcelas.sort((a, b) => {
      const dateA = new Date(a.dataDoc);
      const dateB = new Date(b.dataDoc);
      return dateA - dateB;
    })
    : [];

  return (
    <View style={{ marginBottom: 12 }}>
      {dadosParcelas.length > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: "center" }}>
            <Text style={{ fontWeight: 500, fontSize: 14, color: '#000', marginLeft: 35 }}>Despesas Futuras ({dadosParcelas.length})</Text>
          </View>
        </View>
      ) : null}

      <FlatList
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, gap: 7 }}
        snapToInterval={width - 53}
        horizontal
        data={sortedDadosParcelas}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {

          const dataVencimento = new Date(item.dataDoc);
          const isVencido = dataVencimento < new Date();

          return (

            <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => navigation.navigate('DetalheFuturo', item)}
              style={[{ width: width - 60, justifyContent: 'center', backgroundColor: '#fff', height: 70, paddingHorizontal: 14, marginBottom: 2.5, borderRadius: 14 }]}
            >
              <View>
                <View style={{ flexDirection: 'row', backgroundColor: isVencido ? '#FE9900' : '#777', alignSelf: 'flex-start', borderRadius: 10 }}>

                  <Texto texto={`${new Intl.DateTimeFormat('pt-BR', options).format(item.dataDoc)}`} size={10} estilo={{ marginLeft: -1, color: '#fff', backgroundColor: '#fff', borderRadius: 10, color: '#000', paddingHorizontal: 6, paddingVertical: 1 }} />
                  <Texto texto={`${item?.tipo?.toUpperCase()} ${isVencido ? 'VENCIDO' : ''}`} size={9} estilo={{ color: '#fff', paddingHorizontal: 6, paddingVertical: 2 }} />
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
  );
};

export default Parcelas;