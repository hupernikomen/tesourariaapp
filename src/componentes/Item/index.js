import { useState, useContext, useEffect } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Image, Animated } from 'react-native';
import Texto from '../Texto';
import { AppContext } from '../../context/appContext';
import {  useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icone from '../Icone';

export default function Item({ item, vencido }) {
  const { formatoMoeda, swipedItemId, setSwipedItemId, RegistrarPagamentoParcela, ExcluiRegistro } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [isSwiped, setIsSwiped] = useState(false);
  const translateX = useState(new Animated.Value(0))[0]; // Animação para deslocamento
  const { colors, font } = useTheme()

  const [show, setShow] = useState(false)

  useEffect(() => {
    setIsSwiped(false)
    setSwipedItemId(null);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [])

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
    if (!isSwiped) {
      // Ativa o deslocamento e notifica outros itens
      setSwipedItemId(item.id);
      setIsSwiped(true);
      Animated.timing(translateX, {
        toValue: -141, // Desloca 120 pixels para acomodar dois botões
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

  const onChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShow(false);
      setSwipedItemId(null);
      return; // Interrompe a função imediatamente
    }

    const currentDate = selectedDate;
    setShow(false);
    if (currentDate instanceof Date && !isNaN(currentDate)) {
      RegistrarPagamentoParcela(currentDate, item);
    } else {
      console.log('Data inválida selecionada:', currentDate);
    }
  };


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
      <View style={{ position: 'relative' }}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={toqueItem}
            onLongPress={handleLongPress}
            style={[
              {
                overflow: 'hidden',
                flex: 1,
                justifyContent: 'center',
                backgroundColor: colors.botao,
                padding: 21,
                borderRadius: 7,
                marginHorizontal: 14,
              },
            ]}
          >
            {!!item.imageUrl && (
              <View style={{
                position: 'absolute', width: 50, aspectRatio: 1, backgroundColor: colors.alerta, zIndex: 99, right: -25, top: -25, transform: [
                  { rotate: '45deg' }, // Static 45-degree rotation
                ],
                alignItems: "center",
                justifyContent: "flex-end",
                borderRadius: 14
              }}>

                <View style={{
                  transform: [
                    { rotate: '-45deg' },
                  ],
                  padding: 2
                }}>
                  <Icone size={16} nome="attach" color='#fff' />
                </View>

              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: item.movimentacao === 'despesa' ? colors.despesa : colors.receita,
                  borderTopLeftRadius: 7,
                  borderBottomLeftRadius: 7,
                  alignItems: 'center',
                }}
              >
                <Texto
                  texto={`${new Intl.DateTimeFormat('pt-BR', options).format(item.dataDoc)}`}
                  size={12}
                  estilo={{
                    marginLeft: -4,
                    backgroundColor: colors.botao,
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                  }}
                />
                <Texto
                  texto={`${item?.tipo.replace('_', ' ').toUpperCase()} ${item.parcela ? `${item?.parcela}/${item.recorrencia}` : ''}`}
                  size={9}
                  estilo={{ color: '#fff', paddingHorizontal: 6 }}
                />
              </View>
              <Texto
                texto={`${item.movimentacao === 'despesa' ? '-' : '+'} ${formatoMoeda.format(item.valor)}`}
                size={12}
              />
            </View>

            <Texto
              linhas={2}
              wheight={'padrao'}
              texto={item.parcelaQuit ? item.parcelaQuit + ' - ' + item.detalhamento : item.detalhamento}
              size={14}
              estilo={{ marginRight: 21, marginTop: 7 }}
            />


            {item.ministerio ? <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Texto texto={item.ministerio?.label?.replace('Min. ', '')} size={13} wheight={'fina'} />
            </View> : null}
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
            {!item.pago ? <TouchableOpacity
              style={{
                width: 60,
                backgroundColor: colors.receita,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 7,
              }}
              onPress={() => setShow(true)}
            >
              <Icone nome="checkmark-done" size={24} color="#fff" />
            </TouchableOpacity> : null}
            <TouchableOpacity
              style={{
                width: 60,
                backgroundColor: colors.despesa,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 7,
              }}
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