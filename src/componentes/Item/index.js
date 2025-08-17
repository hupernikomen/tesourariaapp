import { useState, useContext, useEffect } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Image, Dimensions, Animated } from 'react-native';
import Texto from '../Texto';
import AntDesign from '@expo/vector-icons/AntDesign';
import { AppContext } from '../../context/appContext';
import { db } from '../../firebaseConnection';
import { doc, deleteDoc, updateDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { useIsFocused } from '@react-navigation/native';

export default function Item({ item, vencido }) {
  const { formatoMoeda, BuscarRegistrosFinanceiros, swipedItemId, setSwipedItemId } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [isSwiped, setIsSwiped] = useState(false);
  const translateX = useState(new Animated.Value(0))[0]; // Animação para deslocamento
  const focus = useIsFocused()

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

  async function RegistrarPagamentoParcela(item) {
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
        dataDoc: Date.now(),
        tipo: item.tipo,
        valor: item.valor,
        movimentacao: item.movimentacao,
        ministerio: item.ministerio || '',
        imageUrl: item.imageUrl || '',
        detalhamento: item.detalhamento,
        pago: true,
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

  return (
    <>
      <View style={{ position: 'relative' }}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={toqueItem}
            onLongPress={handleLongPress}
            style={[
              {
                flex: 1,
                justifyContent: 'center',
                backgroundColor: '#fff',
                paddingHorizontal: 21,
                paddingVertical:14,
                borderRadius: 21,
                marginHorizontal: 14,
                borderTopRightRadius: isSwiped ? 0 : 21,
                borderBottomRightRadius: isSwiped ? 0 : 21,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems:'center' }}>
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: item.movimentacao === 'despesa' ? (vencido ? '#E39B0E' : '#F56465') : '#659f99',
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                <Texto
                  texto={`${new Intl.DateTimeFormat('pt-BR', options).format(item.dataDoc)}`}
                  size={11}
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
                texto={`R$ ${formatoMoeda.format(item.valor)}`}
                size={13}
                estilo={{ color: '#000', fontFamily: 'Roboto-Regular' }}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 7 }}>
              <Texto
                linhas={2}
                texto={item.detalhamento}
                size={14}
                estilo={{ fontFamily: 'Roboto-Regular' }}
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {item.ministerio ? (
                <Texto texto={item.ministerio} size={12} wheight={300} estilo={{ color: '#777' }} />
              ) : null}
              {!!item.imageUrl ? <AntDesign name="paperclip" /> : ''}
            </View>
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
                backgroundColor: '#4CAF50',
                justifyContent: 'center',
                alignItems: 'center',
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
              onPress={() => RegistrarPagamentoParcela(item)}
            >
              <AntDesign name="check" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 60,
                backgroundColor: '#F44336',
                justifyContent: 'center',
                alignItems: 'center',
                borderTopRightRadius: 21,
                borderBottomRightRadius: 21,
              }}
              onPress={ExcluiRegistro}
            >
              <AntDesign name="delete" size={24} color="#fff" />
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
              <AntDesign name="close" size={24} color="#fff" />
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