import { useState, useContext, useEffect } from 'react'
import { View, TouchableOpacity, Modal, StyleSheet, Image, Dimensions } from 'react-native';
import Texto from '../Texto';
import AntDesign from '@expo/vector-icons/AntDesign';
import { AppContext } from '../../context/appContext';
import { useIsFocused } from '@react-navigation/native';
import { db } from '../../firebaseConnection'
import { doc, deleteDoc } from "firebase/firestore"
import { getStorage, ref, deleteObject } from "firebase/storage";


export default function Item({ item, vencido }) {

  const {width} = Dimensions.get('window')


  const { formatoMoeda, BuscarRegistrosFinanceiros } = useContext(AppContext)
  const [idSelecionado, setIdSelecionado] = useState(null)

  const focus = useIsFocused()

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const dataVencimento = new Date(item.dataDoc);
  const isVencido = dataVencimento < new Date();
  let expand = idSelecionado === item.id


  useEffect(() => {
    setIdSelecionado(null)
  }, [focus])

  const handlePress = () => {
    setIdSelecionado(item.id);
    if (item.imageUrl) {
      setSelectedImage(item.imageUrl);
      setModalVisible(true);
    }
  };

  const options = {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };


  

  async function ExcluiRegistro(item) {

    const docRegistrosFinanceiros = doc(db, item.recorrencia ? "futuro" : "registros", item.id);
    const imageUrl = item.imageUrl;
    const storage = getStorage();

    try {
      // Tentativa de excluir a imagem (se existir URL)
      if (imageUrl) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
          console.log("Imagem excluída com sucesso");
        } catch (imageError) {
          // Ignora especificamente erros de "imagem não encontrada"
          if (imageError.code === 'storage/object-not-found') {
            console.log("Imagem já não existe no Storage, continuando...");
          } else {
            throw imageError; // Re-lança outros erros
          }
        }
      }

      // Exclusão do documento (ocorre independentemente da imagem)
      await deleteDoc(docRegistrosFinanceiros);
      console.log("Registro do Firestore excluído");

      // Atualizações pós-exclusão
      // await ResumoFinanceiro();


    } catch (e) {
      console.error("Erro crítico ao excluir:", e);
      alert("Ocorreu um erro durante a exclusão");
    } finally {
      await BuscarRegistrosFinanceiros()
    }
  }

  return (

    <>


      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onLongPress={() => ExcluiRegistro(item)}
        style={[{ justifyContent: 'center', backgroundColor: '#fff', padding: 21, borderRadius: 21, marginHorizontal: 14}]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>

          <View style={{ flexDirection: 'row', backgroundColor: item.movimentacao === 'despesa' ? vencido?'#E39B0E':'#F56465': '#659f99ff', alignSelf: 'flex-start', borderRadius: 10, alignItems: 'center' }}>

            <Texto texto={`${new Intl.DateTimeFormat('pt-BR', options).format(item.dataDoc)}`} size={11} estilo={{ fontFamily: 'Roboto-Regular', marginLeft: -4, color: '#fff', backgroundColor: '#fff', borderRadius: 10, color: '#000', paddingHorizontal: 6, paddingVertical: 1 }} />
            <Texto texto={`${vencido? 'VENCIDO':item?.tipo.replace('_', ' ')?.toUpperCase()} ${item.parcela ? `${item?.parcela}/${item.recorrencia}` : ''}`} size={9} estilo={{ color: '#fff', paddingHorizontal: 6, fontFamily: 'Roboto-Regular' }} />
          </View>
          {!!item.imageUrl ? <AntDesign name='paperclip' /> : ''}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 7 }}>
          <View style={{ flex: 1, maxWidth: '70%' }}>
            <Texto linhas={expand ? 0 : 1} texto={item.detalhamento} size={14} estilo={{ flexWrap: 'wrap', fontFamily: 'Roboto-Regular' }} />
          </View>
          <Texto texto={formatoMoeda.format(item.valor)} size={12} estilo={{ color: '#000', fontFamily: 'Roboto-Light' }} />
        </View>

        <View>

          {item.ministerio && !vencido ? <Texto texto={item.ministerio} size={12} wheight={300} estilo={{color:'#777'}} /> : null}

        </View>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
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
  itemContainer: {
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 21,
    borderRadius: 21,
    marginHorizontal: 14,
    marginVertical: 7,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: 10,
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'Roboto-Regular',
    marginLeft: -1,
    color: '#000',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeText: {
    color: '#fff',
    paddingHorizontal: 6,
    fontFamily: 'Roboto-Regular',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 7,
  },
  descriptionContainer: {
    flex: 1,
    maxWidth: '70%',
  },
  descriptionText: {
    flexWrap: 'wrap',
    fontFamily: 'Roboto-Regular',
  },
  valueText: {
    color: '#000',
    fontFamily: 'Roboto-Light',
  },
  ministerioText: {
    fontFamily: 'Roboto-Regular',
    color: '#333',
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
    elevation: 15
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