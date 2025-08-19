import { useContext, useEffect } from 'react'
import { View, FlatList } from 'react-native'
import { useIsFocused, useNavigation } from '@react-navigation/native'

import { AppContext } from "../../context/appContext";

import Texto from '../../componentes/Texto';
import Bxsaldo from '../../componentes/bxsaldo';
import Item from '../../componentes/Item';
import Icone from '../../componentes/Icone';

export default function Home() {

  const { saldoAtual, BuscarRegistrosFinanceiros, dadosFinancas, futurosTotal, dadosParcelas } = useContext(AppContext)

  const focus = useIsFocused()
  const navigation = useNavigation()

  useEffect(() => {
    Promise.all([BuscarRegistrosFinanceiros()])


  }, [])


  const sortedRegistros = dadosFinancas
    ? dadosFinancas.sort((a, b) => {
      const dateA = new Date(a.dataDoc);
      const dateB = new Date(b.dataDoc);
      return dateB - dateA;
    })
    : [];


  return (
    <View style={{ flex: 1 }}>

      <FlatList
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={<View style={{ marginVertical: 3.5 }} />}
        ListFooterComponent={<View style={{ height: 21 }} />}
        ListHeaderComponent={
          <View style={{ gap: 21 }}>
            <Bxsaldo dados={{ futurosTotal, saldoAtual, dadosParcelas }} />
            {sortedRegistros.length > 0 ? <View style={{ flexDirection: 'row', marginLeft: 35, gap: 14, alignItems:'center', marginVertical:14 }}>
              <Icone nome={'return-up-forward'} size={22}/>
              <Texto texto={'ÚLTIMOS REGISTROS'} size={12} />
            </View> : null}
          </View>
        }
        data={sortedRegistros}
        renderItem={({ item }) => <Item item={item} />}
      />

    </View>
  )
}
