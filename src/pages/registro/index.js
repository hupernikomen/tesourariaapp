import { useState, useContext, useEffect } from 'react';
import { View, ScrollView, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../firebaseConnection';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Importação corrigida
import { Picker } from '@react-native-picker/picker';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { AppContext } from '../../context/appContext';
import Input from '../../componentes/Input';
import Botao from '../../componentes/Botao';
import { Camera } from 'expo-camera';
import DateTimePicker from '@react-native-community/datetimepicker';
import Texto from '../../componentes/Texto';


export default function AddRegistros() {
  const [reload, setReload] = useState(false);
  const { ResumoFinanceiro } = useContext(AppContext);
  const focus = useIsFocused();
  const navigation = useNavigation();

  const [dataDoc, setDataDoc] = useState(new Date());
  const [detalhamento, setDetalhamento] = useState('');
  const [valor, setValor] = useState(0);
  const [selecionaMinisterio, setSelecionaMinisterio] = useState('');
  const [selectedImage, setSelectedImage] = useState(undefined);
  const [imageUri, setImageUri] = useState('');
  const [recorrencia, setRecorrencia] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState(null);

  const [ministerios, setMinisterios] = useState([])
  const [show, setShow] = useState(false)


  const [selectedOption, setSelectedOption] = useState('');
  const [transactionType, setTransactionType] = useState(null);
  const [transactionParcela, setTransactionParcela] = useState(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
    })();
    BuscarMinisterios()
  }, []);

  useEffect(() => {
    setSelectedOption('');
    setDataDoc(new Date());
    setValor('');
    setRecorrencia('')
    setDetalhamento('');
    setSelecionaMinisterio('');
    setTransactionParcela(null)
    setImageUri(null)
    setSelectedImage(undefined); // Limpa a imagem selecionada ao focar
  }, [focus]);


  const pickerOptions = [
    { label: 'Dízimos', type: 'receita', parcela: false },
    { label: 'Ofertas', type: 'receita', parcela: false },
    { label: 'Ofertas Alçadas', type: 'receita', parcela: false },
    { label: 'Contas Recorrentes', type: 'despesa', parcela: false },
    { label: 'Compras à Vista', type: 'despesa', parcela: false },
    { label: 'Compras Parceladas', type: 'despesa', parcela: true },
    { label: 'Empréstimos', type: 'despesa', parcela: true },
    { label: 'Prebendas', type: 'despesa', parcela: false },
  ];


  const handleValueChange = (value) => {
    setSelectedOption(value);
    const selectedItem = pickerOptions.find((option) => option.label === value);
    setTransactionType(selectedItem ? selectedItem.type : '');
    setTransactionParcela(selectedItem ? selectedItem.parcela : '');
  };


  async function BuscarMinisterios() {
    const nome = collection(db, "ministerios");
    try {
      const snapshot = await getDocs(nome);
      snapshot.forEach((doc) => {
        setMinisterios(doc.data().nomes); // Assuming setMinisterio can handle multiple names

      });
    } catch (error) {
      console.log("Erro ao buscar Saldo em Home", error);
    }
  }



  async function Registrar() {
    // Validação inicial
    if (selectedOption === 'vazio' || !valor || !detalhamento || reload) {
      console.log('Campos inválidos ou em recarga');
      return;
    }

    setReload(true);

    try {
      if (!recorrencia) {
        // Registro único (sem recorrência)
        const imageUrl = selectedImage ? await uploadImage(selectedImage) : '';
        await addDoc(collection(db, 'registros'), {
          reg: Date.now(),
          dataDoc: dataDoc.getTime(),
          tipo: selectedOption,
          valor: parseFloat(valor),
          movimentacao: transactionType,
          ministerio: transactionType === 'despesa' ? selecionaMinisterio : '',
          imageUrl,
          detalhamento,
          pago: true
        });
        await ResumoFinanceiro();
      } else {
        // Registro de pagamento parcelado (um único documento com array de parcelas)
        const parcelas = [];
        const initialTimestamp = dataDoc.getTime();
        const imageUrl = selectedImage ? await uploadImage(selectedImage) : '';

        // Cria o array de parcelas
        for (let i = 0; i < recorrencia; i++) {
          const nextPaymentDate = new Date(initialTimestamp);
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + i);
          parcelas.push({
            dataDoc: nextPaymentDate.getTime(),
            valor: parseFloat(valor) / recorrencia,
            parcela: i + 1,
            pago: false
          });
        }

        // Adiciona um único documento na coleção 'futuro'
        await addDoc(collection(db, 'futuro'), {
          reg: Date.now(),
          tipo: selectedOption,
          recorrencia,
          movimentacao: transactionType,
          ministerio: transactionType === 'despesa' ? selecionaMinisterio : '',
          imageUrl,
          detalhamento,
          valorTotal: parseFloat(valor),
          parcelas, // Array contendo todas as parcelas
        });

        await ResumoFinanceiro();
      }
    } catch (e) {
      console.log('Erro ao adicionar documento:', e);
    } finally {
      setReload(false);
      navigation.goBack();
    }
  }



  async function uploadImage(uri) {
    const storage = getStorage();
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, `images/${filename}`);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL; // Retorna o URL da imagem
  }


  const takePhotoAsync = async () => {
    setReload(true)


    if (hasCameraPermission === false) {
      alert('Você não concedeu permissão para usar a câmera!');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.mediaTypes,
        aspect: [9, 16],
        quality: 0.7,

      });
      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Ocorreu um erro ao tentar abrir a câmera');
    } finally {
      setReload(false)
    }
  };






  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || dataDoc;
    setShow(false);
    setDataDoc(currentDate);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginHorizontal: 14, marginVertical:3.5 }}>

      {show && (
        <DateTimePicker
          value={dataDoc}
          mode="date"
          display="calendar"
          onChange={onChange}
        />
      )}



      <View style={{ height: 60, marginVertical: 4, borderRadius: 21, backgroundColor: '#fff', paddingHorizontal: 14 }}>

        <Picker
          style={{ left: 4 }}
          selectedValue={selectedOption}
          onValueChange={handleValueChange}
        >
          <Picker.Item style={{ fontSize: 14, color: '#999' }} label={'Tipo de Registro'} />
          {pickerOptions.map((option, index) => (
            <Picker.Item style={{ fontSize: 14 }} key={index} label={option.label} value={option.label} />
          ))}
        </Picker>

      </View>

      {transactionParcela ?
        <View>

          <Input editable={false} value={dataDoc.toLocaleDateString('pt-BR')} setValue={setDataDoc} onpress={() => setShow(true)} iconName={'calendar'} />
          <Texto linhas={0} estilo={{ textAlign: 'center', color: '#333', marginBottom: 21, paddingHorizontal: 21 }} size={12} wheight={300} texto={'Informe a data da primeira prestação do pagamento'} />
        </View>
        : null}


      <Input title={`${transactionParcela ? 'Total a pagar' : 'Valor'}`} value={valor} setValue={setValor} type='numeric' />

      {transactionType === 'despesa' ? (
        <>
          {transactionParcela ? <Input title={'Nº de Prestações'} value={recorrencia} setValue={setRecorrencia} type='numeric' maxlength={2} /> : null}
          <View style={{ height: 60, marginVertical: 4, borderRadius: 21, backgroundColor: '#fff', paddingHorizontal: 14 }}>
            <Picker
              style={{ left: 4 }}
              selectedValue={selecionaMinisterio}
              onValueChange={(itemValue) => setSelecionaMinisterio(itemValue)}
            >
              <Picker.Item style={{ fontSize: 15, color: '#999', }} label={'Ministério'} />
              {ministerios.map((item, index) => (
                <Picker.Item key={index} label={item} value={item} style={{ fontSize: 14 }} />
              ))}
            </Picker>
          </View>
        </>
      ) : null}

      <Input value={!imageUri ? 'Imagem da Nota' : 'Imagem Carregada'} editable={false} iconName={!imageUri ? 'camerao' : 'check'} onpress={() => takePhotoAsync()} />
      <Input title={'Detalhamento'} value={detalhamento} setValue={setDetalhamento} />

      <Botao acao={() => Registrar()} texto={recorrencia ? 'Registro Futuro' : 'Confirmar Registro'} reload={reload} corBotao={transactionType === 'despesa' ? '#F56465' : '#659f99ff'} />
    </ScrollView>
  );
}

// 