import { useContext, useEffect } from 'react'
import { View, FlatList } from 'react-native'
import { useIsFocused } from '@react-navigation/native'

import { AppContext } from "../../context/appContext";

import Item from '../../componentes/Item';

export default function Futuro() {

  const { BuscarRegistrosFinanceiros, dadosParcelas } = useContext(AppContext)

  const focus = useIsFocused()

  useEffect(() => {
    Promise.all([BuscarRegistrosFinanceiros()])
  }, [focus])


  const sortedRegistros = dadosParcelas
    ? dadosParcelas.sort((b, a) => {
      const dateA = new Date(a.dataDoc);
      const dateB = new Date(b.dataDoc);
      return dateB - dateA;
    })
    : [];


  return (
    <View style={{ flex: 1 }}>

      <FlatList
        contentContainerStyle={{ paddingVertical: 7 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={<View style={{ marginVertical: 4 }} />}
        ListFooterComponent={<View style={{ marginVertical: 4 }} />}
        data={sortedRegistros} 
        renderItem={({ item, index }) => <Item item={item} />}
      />

    </View>
  )
}
