import { useContext, useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { AppContext } from '../../context/appContext';
import Item from '../../componentes/Item';

export default function Futuro() {
  const { BuscarRegistrosFinanceiros, dadosParcelas } = useContext(AppContext);
  const focus = useIsFocused();

  useEffect(() => {
    Promise.all([BuscarRegistrosFinanceiros()]);
  }, [focus]);

  // Processa os dados para criar uma lista de parcelas com informações do documento
  const sortedParcelas = dadosParcelas
    ? dadosParcelas
        .flatMap((doc) =>
          doc.parcelas.map((parcela) => ({
            id: doc.id, // ID do documento
            dataDoc: parcela.dataDoc, // Data da parcela
            valor: parcela.valor, // Valor da parcela
            parcela: parcela.parcela, // Número da parcela
            recorrencia: doc.recorrencia, // Total de parcelas
            tipo: doc.tipo, // Tipo (ex.: "Compras Parceladas")
            movimentacao: doc.movimentacao, // Tipo de movimentação (ex.: "despesa")
            ministerio: doc.ministerio, // Ministério (se aplicável)
            imageUrl: doc.imageUrl, // URL da imagem (se aplicável)
            detalhamento: doc.detalhamento, // Detalhamento do documento
          }))
        )
        .sort((a, b) => new Date(a.dataDoc) - new Date(b.dataDoc)) // Ordena por data (ascendente)
    : [];

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={{ paddingVertical: 14 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={<View style={{ marginVertical: 3.5 }} />}
        ListFooterComponent={<View style={{ marginVertical: 4 }} />}
        data={sortedParcelas}
        renderItem={({ item }) => <Item item={item} />}
        keyExtractor={(item, index) => `${item.id}-${item.parcela}-${index}`}
      />
    </View>
  );
}