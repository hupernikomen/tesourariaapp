import { useState, useContext, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Image, Dimensions, Animated } from 'react-native';
import Texto from '../Texto';
import { AppContext } from '../../context/appContext';
import { db } from '../../firebaseConnection';
import { doc, deleteDoc, updateDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { useIsFocused, useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icone from '../Icone';

export default function Item({ item, vencido }) {
  const { formatoMoeda, BuscarRegistrosFinanceiros, swipedItemId, setSwipedItemId } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [isSwiped, setIsSwiped] = useState(false);
  const translateX = useState(new Animated.Value(0))[0]; // Animação para deslocamento
  const focus = useIsFocused()
  const { colors } = useTheme()

  const [show, setShow] = useState(false)

  

  useEffect(() => {
    setIsSwiped(false)
    setSwipedItemId(null);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focus])

  useEffect(() => {
    // Reseta o deslocamento se este item não for o item atualmente deslocado
    if (swipedItemId !== item.id) {
      setIsSwiped(false);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [swipedItemId]);

  const toqueItem = () => {
    if (isSwiped) {
      // Se está deslocado, retorna à posição original
      setIsSwiped(false);
      setSwipedItemId(null);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (item.imageUrl) {
      // Abre o modal de imagem se não está deslocado e tem imageUrl
      setImagemSelecionada(item.imageUrl);
      setModalVisible(true);
    }
  };

  const handleLongPress = () => {
    if (!isSwiped && !item.pago) {
      // Ativa o deslocamento e notifica outros itens
      setSwipedItemId(item.id);
      setIsSwiped(true);
      Animated.timing(translateX, {
        toValue: -120, // Desloca 120 pixels para acomodar dois botões
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };


  async function RegistrarPagamentoParcela(dataDoc) {

    if (item.pago) {
      return;
    }

    try {
      const docRef = doc(db, 'futuro', item.id);
      const docSnapshot = await getDoc(docRef);
      const docData = docSnapshot.data();
      const parcelas = docData.parcelas || [];

      if (!docSnapshot.exists()) {
        throw new Error('Documento não encontrado');
      }

      await addDoc(collection(db, 'registros'), {
        reg: item.dataDoc,
        dataDoc: new Date(dataDoc).getTime(),
        tipo: item.tipo,
        valor: item.valor,
        movimentacao: item.movimentacao,
        ministerio: item.ministerio || '',
        imageUrl: item.imageUrl || '',
        detalhamento: item.detalhamento,
        pago: true,
        parcelaQuit: String(item.parcela + '/' + item.recorrencia)
      });

      const novasParcelas = parcelas.filter((p) => p.parcela !== item.parcela);

      if (novasParcelas.length > 0) {
        await updateDoc(docRef, {
          parcelas: novasParcelas,
        });
      } else {
        await deleteDoc(docRef);
      }

      await BuscarRegistrosFinanceiros();
    } catch (e) {
      console.error('Erro ao registrar pagamento da parcela:', e);
      throw e;
    } finally {
      setIsSwiped(false);
      setSwipedItemId(null);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }

  async function ExcluiRegistro() {
    const docRegistrosFinanceiros = doc(db, item.recorrencia ? 'futuro' : 'registros', item.id);
    const imageUrl = item.imageUrl;
    const storage = getStorage();

    try {
      if (imageUrl) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
          console.log('Imagem excluída com sucesso');
        } catch (imageError) {
          if (imageError.code === 'storage/object-not-found') {
            console.log('Imagem já não existe no Storage, continuando...');
          } else {
            throw imageError;
          }
        }
      }

      await deleteDoc(docRegistrosFinanceiros);
      console.log('Registro do Firestore excluído');
    } catch (e) {
      console.error('Erro crítico ao excluir:', e);
      alert('Ocorreu um erro durante a exclusão');
    } finally {
      await BuscarRegistrosFinanceiros();
      setIsSwiped(false);
      setSwipedItemId(null); // Reseta o item deslocado globalmente
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }


  const options = {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };

  const onChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShow(false);
      setSwipedItemId(null);
      return; // Interrompe a função imediatamente
    }

    const currentDate = selectedDate;
    setShow(false);
    if (currentDate instanceof Date && !isNaN(currentDate)) {
      RegistrarPagamentoParcela(currentDate);
    } else {
      console.log('Data inválida selecionada:', currentDate);
    }
  };

  const isVencido = new Date(item.dataDoc) < new Date();
  

  return (
    <>
      {show && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="calendar"
          onChange={onChange}
        />
      )}
      <View style={{ position: 'relative', }}>
        <Animated.View style={{ transform: [{ translateX }],  }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={toqueItem}
            onLongPress={handleLongPress}
            style={[
              {
               
                flex: 1,
                justifyContent: 'center',
                backgroundColor: colors.botao,
                padding: 21,
                borderRadius: 7,
                marginHorizontal: 14,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: item.movimentacao === 'despesa' ? colors.despesa : colors.receita,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                <Texto
                  texto={`${new Intl.DateTimeFormat('pt-BR', options).format(item.dataDoc)}`}
                  size={12}
                  estilo={{
                    fontFamily: 'Roboto-Regular',
                    marginLeft: -4,
                    color: '#fff',
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    color: '#000',
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                  }}
                />
                <Texto
                  texto={`${item?.tipo.replace('_', ' ').toUpperCase()} ${item.parcela ? `${item?.parcela}/${item.recorrencia}` : ''}`}
                  size={9}
                  estilo={{ color: '#fff', paddingHorizontal: 6, fontFamily: 'Roboto-Regular' }}
                />
              </View>
              <Texto
                texto={`${item.movimentacao === 'despesa' ? '-' : '+'} ${formatoMoeda.format(item.valor)}`}
                size={12}
                estilo={{ color: '#000', fontFamily: 'Roboto-Regular' }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-start', marginTop: 14 }}>
              <Icone nome={'chevron-forward'} size={10}/>
              <Texto
                linhas={2}
                texto={item.parcelaQuit ? item.parcelaQuit + ' - ' + item.detalhamento : item.detalhamento}
                size={14}
                estilo={{ fontFamily: 'Roboto-Regular' }}
              />
            </View>

            {item.ministerio || !!item.imageUrl ? <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft:10 }}>
                <Texto texto={item.ministerio?.label?.replace('Min. ', '')} size={13} wheight={300} estilo={{ color: '#777' }} />
              {!!item.imageUrl ? <Icone size={16} nome="attach" /> : ''}
            </View>:null}
          </TouchableOpacity>
        </Animated.View>

        {isSwiped && (
          <View
            style={{
              position: 'absolute',
              right: 14,
              top: 0,
              bottom: 0,
              flexDirection: 'row',
            }}
          >
            <TouchableOpacity
              style={{
                width: 60,
                backgroundColor: colors.receita,
                justifyContent: 'center',
                alignItems: 'center',
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
              onPress={() => setShow(true)}
            >
              <Icone nome="checkmark-done" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 60,
                backgroundColor: colors.despesa,
                justifyContent: 'center',
                alignItems: 'center',
                borderTopRightRadius: 21,
                borderBottomRightRadius: 21,
              }}
              onPress={ExcluiRegistro}
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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {imagemSelecionada && (
              <Image
                source={{ uri: imagemSelecionada }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Icone name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    height: '70%',
    overflow: 'hidden',
    position: 'relative',
    padding: 7,
    elevation: 15,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#333',
    borderRadius: 20,
    padding: 5,
  },
});