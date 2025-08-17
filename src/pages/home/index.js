import { useContext, useEffect } from 'react'
import { View, FlatList } from 'react-native'
import { useIsFocused } from '@react-navigation/native'

import CarrosselParcelas from '../../componentes/CarrosselParcelas'
import { AppContext } from "../../context/appContext";

import Texto from '../../componentes/Texto';
import Bxsaldo from '../../componentes/bxsaldo';
import Item from '../../componentes/Item';

export default function Home() {

  const { saldoAtual, BuscarRegistrosFinanceiros, dadosFinancas, futurosTotal, dadosParcelas } = useContext(AppContext)

  const focus = useIsFocused()

  useEffect(() => {
    Promise.all([BuscarRegistrosFinanceiros()])
  }, [focus])


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
        ItemSeparatorComponent={<View style={{ marginVertical: 2 }} />}
        ListFooterComponent={<View style={{height:21}}/>}
        ListHeaderComponent={
          <View style={{ gap: 21 }}>
            <Bxsaldo dados={{ futurosTotal, saldoAtual }} />
            <CarrosselParcelas dadosParcelas={dadosParcelas} />
            {sortedRegistros.length > 0 ? <Texto texto={'ÚLTIMOS REGISTROS'} estilo={{ marginLeft: 35, marginVertical: 14 }} size={12} /> : null}
          </View>
        }
        data={sortedRegistros}
        renderItem={({ item, index }) => <Item item={item} />}
      />

    </View>
  )
}
