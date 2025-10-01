import { useState, useContext, useEffect } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Image, Animated, Text } from 'react-native';
import Texto from '../Texto';
import { AppContext } from '../../context/appContext';
import { useNavigation, useTheme } from '@react-navigation/native';
import Icone from '../Icone';
import Avisos from '../Avisos'
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../firebaseConnection';

export default function Item({ item }) {
  const { formatoMoeda, swipedItemId, setSwipedItemId, ExcluiRegistro, setAviso, aviso, avisos } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [isSwiped, setIsSwiped] = useState(false);
  const translateX = useState(new Animated.Value(0))[0];
  const { cores } = useTheme();
  const navigation = useNavigation()

  useEffect(() => {
    setIsSwiped(false);
    setSwipedItemId(null);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (swipedItemId !== item.id) {
      setIsSwiped(false);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [swipedItemId]);



  async function buscarPrimeiraParcela(docId) {
    try {
      const docRef = doc(db, 'futuro', docId);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();

      return data.parcelas[0].parcela;

    } catch (error) {
      console.log('Erro ao buscar primeira parcela:', error.message);
    }
  }


  async function verificarRegistroPorId(id) {
    try {
      // Referência à coleção 'registros'
      const registrosRef = collection(db, 'registros');

      // Cria uma consulta para buscar documentos onde o campo 'id' é igual ao valor fornecido
      const q = query(registrosRef, where("id", "==", id));

      // Executa a consulta
      const querySnapshot = await getDocs(q);

      // Retorna true se pelo menos um documento for encontrado, false caso contrário
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erro ao verificar campo id na coleção registros:', error.message);
      return false; // Retorna false em caso de erro
    }
  }




  const toqueItem = async () => {

    if (item.pago && !!item.imageUrl && !isSwiped) {
      setImagemSelecionada(item.imageUrl);
      setModalVisible(true);

    } else if (!item.pago && !isSwiped) {

      if (item.parcela > await buscarPrimeiraParcela(item?.id)) {
        setAviso({ titulo: 'Aviso', mensagem: 'Existe uma parcela pendente anterior a essa para este pagamento.' })
        return

      }

      navigation.navigate('Pagamento', item)
    }

    setIsSwiped(false);
    setSwipedItemId(null);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const dataAtual = new Date();
  const anoAtual = dataAtual.getFullYear();
  const mesAtual = dataAtual.getMonth();
  const primeiroDiaMesAtual = new Date(anoAtual, mesAtual, 1).getTime();
  const ultimoDiaMesAnterior = primeiroDiaMesAtual - 1;

  const dataItem = new Date(item.reg);
  const dataLimite = new Date(ultimoDiaMesAnterior);
  const dataItemFormatada = new Date(dataItem.getFullYear(), dataItem.getMonth(), dataItem.getDate()).getTime();
  const dataLimiteFormatada = new Date(dataLimite.getFullYear(), dataLimite.getMonth(), dataLimite.getDate()).getTime();

  const twentyFourHoursInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const timeDifference = dataAtual.getTime() - dataItem.getTime();



  const handleLongPress = async () => {


    if (timeDifference > twentyFourHoursInMs || item.parcelaQuit || item.parcela > 1) {
      setAviso({ titulo: 'Aviso', mensagem: 'Não é possivel editar ou excluir esse item.' })
      return
    }

    // Existing condition for unpaid items or paid items within 24 hours
    if (dataItemFormatada < dataLimiteFormatada) {
      return;
    }

    if (!isSwiped) {
      setSwipedItemId(item.id);
      setIsSwiped(true);
      Animated.timing(translateX, {
        toValue: -70,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const options = {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };



  return (
    <>

      <Avisos visible={avisos} setAviso={setAviso} message={aviso.mensagem} title={aviso.titulo} />

      <View style={styles.container}>
        <Animated.View style={[styles.animatedContainer, { transform: [{ translateX }] }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={toqueItem}
            onLongPress={handleLongPress}
            style={[styles.itemContainer, { backgroundColor: cores.botao }]}
          >

            <View style={styles.itemContent}>
              <View
                style={[
                  styles.dateTypeContainer,
                  { backgroundColor: item.movimentacao === 'despesa' ? cores.despesa : cores.receita },
                ]}
              >
                <Texto
                  texto={`${new Intl.DateTimeFormat('pt-BR', options).format(item.dataDoc)}`}
                  size={12}
                  estilo={[styles.dateText, { backgroundColor: cores.botao }]}
                />
                <Texto
                  texto={`${item?.tipo.replace('_', ' ').toUpperCase()} ${item.parcela ? `${item?.parcela}/${item.recorrencia}` : ''}`}
                  size={9}
                  estilo={styles.typeText}
                />
              </View>

              <Texto
                texto={`${item.movimentacao === 'despesa' ? '-' : '+'} ${formatoMoeda.format(item.valor)}`}
                size={12}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>

              <View style={{ width: '70%' }}>

                <Texto
                  linhas={2}
                  wheight={'padrao'}
                  texto={item.parcelaQuit ? item.parcelaQuit + ' - ' + item.detalhamento : item.detalhamento}
                  estilo={[styles.detailText]}
                />

                {/* {!!item.ministerio ? <Texto wheight={'fina'}size={13} texto={item.ministerio?.label?.replace('Min. ', '')} /> : null} */}
              </View>

              <View style={{ alignSelf: 'flex-end', flexDirection: 'row', gap: 14 }}>

                {!!item.imageUrl && (
                  <Icone size={14} nome="paperclip" color='#000' />
                )}

                {timeDifference < twentyFourHoursInMs && !item.parcelaQuit || item?.parcela === 1 ? (
                  <Icone size={14} nome="lock-open-outline" color='#000' />
                ) : (
                  <Icone size={14} nome="lock-closed-outline" color='#000' />
                )}

              </View>
            </View>
          </TouchableOpacity>


        </Animated.View>

        {isSwiped && (
          <View style={styles.swipeActions}>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: cores.preto }]}
              onPress={() => ExcluiRegistro(item)}
            >
              <Icone nome="trash-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {imagemSelecionada && (
              <Image
                source={{ uri: imagemSelecionada }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}

          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  animatedContainer: {
    flex: 1,
  },
  itemContainer: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
    padding: 21,
    borderRadius: 7,
    marginHorizontal: 14,
  },

  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTypeContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    alignItems: 'center',
  },
  dateText: {
    marginLeft: -4,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  typeText: {
    color: '#fff',
    paddingHorizontal: 6,
  },
  detailText: {
    marginRight: 21,
    marginTop: 7,
  },
  ministryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swipeActions: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  actionButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    overflow: 'hidden',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    height: '70%',
    overflow: 'hidden',
    position: 'relative',
    padding: 2,
    elevation: 14,
    borderRadius: 14,
  },
  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },

});