import { FlatList, Text, View } from 'react-native';
import Item from '../Item';

const Parcelas = ({ dadosParcelas }) => {
  const hoje = new Date();

  const dadosFiltrados = dadosParcelas
    ? dadosParcelas
      .filter((item) => {
        const dataDoc = new Date(item.dataDoc);
        
        return dataDoc < hoje;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dataDoc);
        const dateB = new Date(b.dataDoc);
        return dateA - dateB;
      })
    : [];

  return (
    <View style={{ marginBottom: 12 }}>
      {dadosFiltrados.length > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#000', marginLeft: 35 }}>
              DESPESAS VENCIDAS
            </Text>
          </View>
        </View>
      ) : null}

      <FlatList
        showsHorizontalScrollIndicator={false}
        horizontal
        data={dadosFiltrados}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Item vencido item={item} />}
      />
    </View>
  );
};

export default Parcelas;