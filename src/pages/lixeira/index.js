import { View, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { AppContext } from '../../context/appContext';
import { useContext, useEffect, useState } from 'react';
import { db } from '../../firebaseConnection';
import { doc, setDoc, deleteDoc, collection, query, getDocs } from "firebase/firestore";
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { useTheme } from '@react-navigation/native';
import Icone from '../../componentes/Icone';
import Load from '../../componentes/load';

export default function Lixeira() {
  const { colors } = useTheme();
  const { HistoricoMovimentos, BuscarLixeira, lixo, formatoMoeda, load, setLoad } = useContext(AppContext);


  const DIASEXCLUSAO = 1


  useEffect(() => {
    setLoad(true)
    Promise.all([ExcluirItensAntigos(), BuscarLixeira()]).finally(() => setLoad(false))
  }, []);


  async function ExcluirItensAntigos() {
    try {
      const storage = getStorage();
      const lixeiraRef = collection(db, 'lixeira');
      const q = query(lixeiraRef);
      const querySnapshot = await getDocs(q);
      const agora = new Date();
      const seteDiasEmMs = DIASEXCLUSAO * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

      const promessasExclusao = [];

      querySnapshot.forEach((docSnapshot) => {
        const item = docSnapshot.data();
        const dataExclusao = item.dataexclusao ? new Date(item.dataexclusao) : null;

        if (dataExclusao && !isNaN(dataExclusao.getTime())) {
          const diferencaTempo = agora - dataExclusao;

          if (diferencaTempo >= seteDiasEmMs) {
            const lixeiraDoc = doc(db, 'lixeira', docSnapshot.id);
            const imageUrl = item.imageUrl;

            const promessa = (async () => {
              if (imageUrl) {
                try {
                  const imageRef = ref(storage, imageUrl);
                  await deleteObject(imageRef);
                  console.log(`Imagem excluída para o item ${docSnapshot.id}`);
                } catch (imageError) {
                  console.log('Erro ao excluir imagem: ', imageError);

                }
              }
              await deleteDoc(lixeiraDoc);
            })();
            promessasExclusao.push(promessa);
          }
        }
      });

      await Promise.all([promessasExclusao, BuscarLixeira()]);

    } catch (error) {
      console.error('Erro ao excluir itens antigos da lixeira:', error.message, error.stack);
    }
  }


  async function RestaurarRegistro(item) {
    const lixeiraDoc = doc(db, 'lixeira', item.id);
    const destinoDoc = doc(db, item.colecao, item.id);

    setLoad(true)

    try {
      if (!item.colecao || !['futuro', 'registros'].includes(item.colecao)) {
        throw new Error('Campo colecao inválido ou ausente');
      }

      const itemRestaurado = { ...item };
      delete itemRestaurado.colecao;
      delete itemRestaurado.dataexclusao;

      // await setDoc(destinoDoc, itemRestaurado);
      // console.log(`Item restaurado para a coleção ${item.colecao} com sucesso`);

      // await deleteDoc(lixeiraDoc);
      // console.log('Item removido da lixeira com sucesso');

      await Promise.all([setDoc(destinoDoc, itemRestaurado), deleteDoc(lixeiraDoc), HistoricoMovimentos(), BuscarLixeira()]).finally(() => {
        setLoad(false)
        // setLoad(prev => ({ ...prev, [item.id]: false })); // Reseta o estado de restauração do item
      })

    } catch (e) {
      console.log('Erro ao restaurar o registro:', e.message, e.stack);

    }
  }

  if (load) return <Load />

  const RenderItem = ({ item }) => {

    return (
      <View style={{ flexDirection: 'row', marginHorizontal: 14, alignItems: "center", gap: 14, height: 60 }}>
        <View style={{ padding: 14, backgroundColor: colors.botao, flex: 1, borderRadius: 7 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, textTransform: 'uppercase' }}>{item.tipo}</Text>

            <Text style={{ fontSize: 12 }}>{item.movimentacao === 'despesa' ? '-' : '+'} {formatoMoeda.format(item?.valor)}</Text>
          </View>
          <Text style={{ fontFamily: 'Roboto-Light', fontSize: 13 }}>{item.detalhamento}</Text>
        </View>
        <TouchableOpacity onPress={() => RestaurarRegistro(item)}
          style={{ padding: 7, backgroundColor: colors.receita, width: 50, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 7 }}>

          <Icone nome={'repeat'} color={colors.botao} />
        </TouchableOpacity>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={{ paddingVertical: 14 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={<View style={styles.itemSeparator} />}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>Lixeira vazia.</Text>
          </View>
        }
        ListFooterComponent={
          lixo?.length > 0 ? <View style={{ marginTop: 14 }}>
            <Text style={styles.emptyListText}>Os itens desta lista serão excluídos automaticamente após {DIASEXCLUSAO} dias</Text>
          </View> : null
        }
        data={lixo}
        renderItem={({ item }) => <RenderItem item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemSeparator: {
    marginVertical: 3.5,
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontFamily: 'Roboto-Light',
    marginVertical: 13,
    paddingHorizontal: 41,
    textAlign: "center"
  },
  footer: {
    height: 21,
  },
});