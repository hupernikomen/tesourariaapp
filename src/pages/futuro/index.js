import { useContext } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { AppContext } from '../../context/appContext';
import Item from '../../componentes/Item';
import Load from '../../componentes/load';

export default function Futuro() {
  const { dadosParcelas, load } = useContext(AppContext);

  const sortedParcelas = dadosParcelas
    ? dadosParcelas
      .flatMap((doc) =>
        doc.parcelas.map((parcela) => ({
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
        }))
      )
      .sort((a, b) => new Date(a.dataDoc) - new Date(b.dataDoc))
    : [];

    if (load) return <Load/>

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={<View style={styles.itemSeparator} />}
        ListFooterComponent={<View style={styles.footer} />}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>Nenhum registro até o momento.</Text>
          </View>
        }
        
        data={sortedParcelas}
        renderItem={({ item }) => <Item item={item} />}
        keyExtractor={(item, index) => `${item.id}-${item.parcela}-${index}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 14,
  },
  itemSeparator: {
    marginVertical: 3.5,
  },
  footer: {
    marginVertical: 4,
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontFamily: 'Roboto-Light',
    marginVertical:14
  },
});