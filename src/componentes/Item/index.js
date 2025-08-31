import { useState, useContext, useEffect } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Image, Animated } from 'react-native';
import Texto from '../Texto';
import { AppContext } from '../../context/appContext';
import { useNavigation, useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icone from '../Icone';

export default function Item({ item }) {
  const { formatoMoeda, swipedItemId, setSwipedItemId, RegistrarPagamentoParcela, ExcluiRegistro } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [isSwiped, setIsSwiped] = useState(false);
  const translateX = useState(new Animated.Value(0))[0];
  const { colors } = useTheme();
  const [show, setShow] = useState(false);
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

  const toqueItem = () => {

    if (item.pago && !!item.imageUrl && !isSwiped) {
      setImagemSelecionada(item.imageUrl);
      setModalVisible(true);

    } else if (!item.pago && !isSwiped) {
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

  const handleLongPress = () => {
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth();
    const primeiroDiaMesAtual = new Date(anoAtual, mesAtual, 1).getTime();
    const ultimoDiaMesAnterior = primeiroDiaMesAtual - 1;

    const dataItem = new Date(item.dataDoc);
    const dataLimite = new Date(ultimoDiaMesAnterior);
    const dataItemFormatada = new Date(dataItem.getFullYear(), dataItem.getMonth(), dataItem.getDate()).getTime();
    const dataLimiteFormatada = new Date(dataLimite.getFullYear(), dataLimite.getMonth(), dataLimite.getDate()).getTime();

    // Check if item is paid and within 24 hours
    if (item.pago) {
      const twentyFourHoursInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const timeDifference = dataAtual.getTime() - dataItem.getTime();
      if (timeDifference > twentyFourHoursInMs) {
        return; // Block long press if item is paid and older than 24 hours
      }
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

  const onChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShow(false);
      setSwipedItemId(null);
      return;
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
      <View style={styles.container}>
        <Animated.View style={[styles.animatedContainer, { transform: [{ translateX }] }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={toqueItem}
            onLongPress={handleLongPress}
            style={[styles.itemContainer, { backgroundColor: colors.botao }]}
          >
            {!!item.imageUrl && (
              <View style={[styles.imageIndicator, { backgroundColor: colors.alerta }]}>
                <View style={styles.imageIconContainer}>
                  <Icone size={16} nome="attach" color='#fff' />
                </View>
              </View>
            )}
            <View style={styles.itemContent}>
              <View
                style={[
                  styles.dateTypeContainer,
                  { backgroundColor: item.movimentacao === 'despesa' ? colors.despesa : colors.receita },
                ]}
              >
                <Texto
                  texto={`${new Intl.DateTimeFormat('pt-BR', options).format(item.dataDoc)}`}
                  size={12}
                  estilo={[styles.dateText, { backgroundColor: colors.botao }]}
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

            <Texto
              linhas={2}
              wheight={'padrao'}
              texto={item.parcelaQuit ? item.parcelaQuit + ' - ' + item.detalhamento : item.detalhamento}
              size={14}
              estilo={styles.detailText}
            />

            {item.ministerio ? (
              <View style={styles.ministryContainer}>
                <Texto texto={item.ministerio?.label?.replace('Min. ', '')} size={13} wheight={'fina'} />
              </View>
            ) : null}
          </TouchableOpacity>
        </Animated.View>

        {isSwiped && (
          <View style={styles.swipeActions}>
            {/* {!item.pago ? (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.receita }]}
                onPress={() => setShow(true)}
              >
                <Icone nome="checkmark-done" size={24} color="#fff" />
              </TouchableOpacity>
            ) : null} */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.despesa }]}
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
  imageIndicator: {
    position: 'absolute',
    width: 50,
    aspectRatio: 1,
    zIndex: 99,
    right: -25,
    top: -25,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 14,
  },
  imageIconContainer: {
    transform: [{ rotate: '-45deg' }],
    padding: 2,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTypeContainer: {
    flexDirection: 'row',
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
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