import { useState, useContext, useEffect } from 'react'
import { View, FlatList } from 'react-native'
import { useNavigation, useIsFocused } from '@react-navigation/native'

import CarrosselParcelas from '../../componentes/CarrosselParcelas'
import { AppContext } from "../../context/appContext";

import { db } from '../../firebaseConnection'
import { getDocs, collection, query, orderBy, limit, doc, deleteDoc } from "firebase/firestore"
import { getStorage, ref, deleteObject } from "firebase/storage";
import Texto from '../../componentes/Texto';
import Bxsaldo from '../../componentes/bxsaldo';
import Item from '../../componentes/Item';

export default function Home() {

  const { saldoAtual, BuscarRegistrosFinanceiros, dadosFinancas, futurosTotal,dadosParcelas } = useContext(AppContext)

  const focus = useIsFocused()



  useEffect(() => {
    Promise.all([BuscarRegistrosFinanceiros()])


  }, [focus])





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
        ItemSeparatorComponent={<View style={{ marginVertical: 4 }} />}
        ListFooterComponent={<View style={{ marginVertical: 4 }} />}
        ListHeaderComponent={
          <View style={{ gap: 7 }}>
            <Bxsaldo dados={{ futurosTotal, saldoAtual }} />
            <CarrosselParcelas dadosParcelas={dadosParcelas} />
            <Texto texto={'ÚLTIMOS REGISTROS'} estilo={{ marginLeft: 35, marginVertical: 14 }} size={12} />
          </View>
        }
        data={sortedRegistros.slice(0, 300)} // Filtra para exibir apenas os 5 primeiros itens
        renderItem={({ item, index }) => <Item item={item} />}
      />

    </View>
  )
}
