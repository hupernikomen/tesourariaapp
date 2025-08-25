import { useState, useContext, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../firebaseConnection';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Picker } from '@react-native-picker/picker';
import { useIsFocused, useNavigation, useTheme } from '@react-navigation/native';
import { AppContext } from '../../context/appContext';
import Input from '../../componentes/Input';
import Botao from '../../componentes/Botao';
import { Camera } from 'expo-camera';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomPickerModal from '../../componentes/picker';

export default function AddRegistros() {
  const [reload, setReload] = useState(false);
  const { ResumoFinanceiro, BuscarRegistrosFinanceiros } = useContext(AppContext);
  const focus = useIsFocused();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [dataDoc, setDataDoc] = useState(new Date());
  const [detalhamento, setDetalhamento] = useState('');
  const [valor, setValor] = useState('');
  const [selecionaMinisterio, setSelecionaMinisterio] = useState('');
  const [selectedImage, setSelectedImage] = useState(undefined);
  const [imageUri, setImageUri] = useState('');
  const [recorrencia, setRecorrencia] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [ministerios, setMinisterios] = useState([]);
  const [show, setShow] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tipos, setTipos] = useState([]);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
      await BuscarMinisterios();
      await BuscarTipos();
    })();
  }, [focus]);

  async function BuscarTipos() {
    const nome = collection(db, "tipos");
    try {
      const snapshot = await getDocs(nome);
      const tiposArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTipos(tiposArray);
      return tiposArray;
    } catch (error) {
      console.log("Erro ao buscar tipos em AddRegistros", error);
    }
  }
  async function BuscarMinisterios() {
    const nome = collection(db, "ministerios");
    try {
      const snapshot = await getDocs(nome);
      const tiposArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMinisterios(tiposArray);
      return tiposArray;
    } catch (error) {
      console.log("Erro ao buscar tipos em AddRegistros", error);
    }
  }

  // async function BuscarMinisterios() {
  //   const nome = collection(db, "ministerios");
  //   try {
  //     const snapshot = await getDocs(nome);

  //     if (snapshot.empty) {
  //       console.log("Nenhum documento encontrado na coleção ministerios");
  //       setMinisterios([]);
  //       return [];
  //     }
  //     const doc = snapshot.docs;
  //     console.log(doc.data(), 'data');

  //     const nomes = doc.data().nomes || [];
  //     const nomesOrdenados = [...nomes].sort((a, b) => {
  //       const nomeA = String(a).trim().replace(/^(Min\.)/i, '').trim();
  //       const nomeB = String(b).trim().replace(/^(Min\.)/i, '').trim();
  //       return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
  //     });
  //     setMinisterios(nomesOrdenados);
  //     return nomesOrdenados;
  //   } catch (error) {
  //     console.error("Erro ao buscar ministérios em BuscarMinisterios:", error);
  //     setMinisterios([]);
  //     return [];
  //   }
  // }

  async function Registrar() {
    const isValidString = (str) => {
      if (typeof str !== 'string' || str.trim() === '') return false;
      const validPattern = /^[A-Za-zÀ-ÿ0-9\s.,;!?()-]+$/;
      return validPattern.test(str) && str.trim().length >= 5;
    };

    if (!selectedCategory || !valor || !isValidString(detalhamento) || reload) {
      console.log(
        !selectedCategory ? 'Categoria não selecionada' :
          !valor ? 'Valor não informado' :
            !isValidString(detalhamento) ? 'Detalhamento inválido' :
              'Em recarga'
      );
      return;
    }

    setReload(true);

    try {
      if (!recorrencia) {
        const imageUrl = selectedImage ? await uploadImage(selectedImage) : '';
        await addDoc(collection(db, 'registros'), {
          reg: Date.now(),
          dataDoc: dataDoc.getTime(),
          tipo: selectedCategory.label,
          valor: parseFloat(valor),
          movimentacao: selectedCategory.type,
          ministerio: selectedCategory.type === 'despesa' ? selecionaMinisterio : '',
          imageUrl,
          detalhamento,
          pago: true,
        });
        await ResumoFinanceiro();
      } else {
        const parcelas = [];
        const initialTimestamp = dataDoc.getTime();
        const imageUrl = selectedImage ? await uploadImage(selectedImage) : '';

        for (let i = 0; i < parseInt(recorrencia); i++) {
          const nextPaymentDate = new Date(initialTimestamp);
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + i);
          parcelas.push({
            dataDoc: nextPaymentDate.getTime(),
            valor: parseFloat(valor) / parseInt(recorrencia),
            parcela: i + 1,
            pago: false,
          });
        }

        await addDoc(collection(db, 'futuro'), {
          reg: Date.now(),
          tipo: selectedCategory.label,
          recorrencia: parseInt(recorrencia),
          movimentacao: selectedCategory.type,
          ministerio: selectedCategory.type === 'despesa' ? selecionaMinisterio : '',
          imageUrl,
          detalhamento,
          valorTotal: parseFloat(valor),
          parcelas,
        });

        await ResumoFinanceiro();
      }
    } catch (e) {
      console.log('Erro ao adicionar documento:', e);
    } finally {
      setReload(false);
      setSelectedCategory(null);
      setDataDoc(new Date());
      setValor('');
      setRecorrencia('');
      setDetalhamento('');
      setSelecionaMinisterio('');
      setImageUri('');
      setSelectedImage(undefined);
      await BuscarRegistrosFinanceiros();
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
    return downloadURL;
  }

  const takePhotoAsync = async () => {
    setReload(true);
    if (hasCameraPermission === false) {
      alert('Você não concedeu permissão para usar a câmera!');
      setReload(false);
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      setReload(false);
    }
  };

  const getCurrentMonthRange = () => {
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 1);
    return { minimumDate: threeDaysAgo };
  };

  const { minimumDate } = getCurrentMonthRange();

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || dataDoc;
    setShow(false);
    setDataDoc(currentDate);
  };



  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, marginHorizontal: 14, marginVertical: 10 }}
    >
      {show && (
        <DateTimePicker
          value={dataDoc}
          mode="date"
          display="calendar"
          onChange={onChange}
          minimumDate={minimumDate}
        />
      )}

      <Input
        title={'Data'}
        editable={false}
        value={dataDoc.toLocaleDateString('pt-BR')}
        onpress={() => setShow(true)}
        iconName={'calendar-clear-outline'}
      />

      <CustomPickerModal
        titulo={'Tipo de Registro'}
        itens={tipos}
        selectedValue={selectedCategory}
        setSelectedValue={setSelectedCategory}
      />

        <CustomPickerModal
        titulo={'Ministério'}
        itens={ministerios}
        selectedValue={selecionaMinisterio}
        setSelectedValue={setSelecionaMinisterio}
      />



      <Input
        title={'Imagem da Nota'}
        value={imageUri ? 'Imagem Carregada' : ''}
        editable={false}
        iconName={imageUri ? 'checkmark-done' : 'attach'}
        onpress={takePhotoAsync}
      />

      <Input
        title={selectedCategory?.parcela ? 'Total a pagar' : 'Valor'}
        value={valor}
        setValue={setValor}
        type="numeric"
      />

      {selectedCategory?.parcela && (
        <Input
          title={'Nº de Prestações'}
          value={recorrencia}
          setValue={setRecorrencia}
          type="numeric"
          maxlength={2}
        />
      )}

      <Input
        title={'Detalhamento'}
        value={detalhamento}
        setValue={setDetalhamento}
      />

      <Botao
        acao={Registrar}
        texto={recorrencia ? 'Registro Futuro' : 'Confirmar Registro'}
        reload={reload}
        icone={'save-outline'}
        corBotao={colors.receita}
      />
    </ScrollView>
  );
}