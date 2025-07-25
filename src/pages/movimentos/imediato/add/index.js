import React, { useState, useContext, useEffect } from 'react';
import { View, Text, ScrollView, Button, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../../../firebaseConnection';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Importação corrigida
import { Picker } from '@react-native-picker/picker';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { AppContext } from '../../../../context/appContext';
import Input from '../../../../componentes/Input';
import Botao from '../../../../componentes/Botao';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Camera } from 'expo-camera';

export default function AddRegistros() {
  const [reload, setReload] = useState(false);
  const { ResumoFinanceiro } = useContext(AppContext);
  const focus = useIsFocused();
  const navigation = useNavigation();

  const [movimentacao, setMovimentacao] = useState('');
  const [selecionaTipo, setSelecionaTipo] = useState("");
  const [dataDoc, setDataDoc] = useState(new Intl.DateTimeFormat('pt-BR', options).format(new Date()));
  const [detalhamento, setDetalhamento] = useState('');
  const [valor, setValor] = useState(0);
  const [selecionaMinisterio, setSelecionaMinisterio] = useState('');
  const [selectedImage, setSelectedImage] = useState(undefined);
  const [imageUri, setImageUri] = useState('');

  const [hasCameraPermission, setHasCameraPermission] = useState(null);

  const [ministerios, setMinisterios] = useState([])



  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
    })();
    BuscarMinisterios()
  }, []);

  useEffect(() => {
    setMovimentacao('');
    setSelecionaTipo('');
    setDataDoc(new Intl.DateTimeFormat('pt-BR', options).format(new Date()));
    setValor('');
    setDetalhamento('');
    setSelecionaMinisterio('');
    setImageUri(null)
    setSelectedImage(undefined); // Limpa a imagem selecionada ao focar
  }, [focus]);



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
    if (selecionaTipo === "vazio" || !valor || reload) {
      return;
    }

    if (converteParaTimestamp(dataDoc) > Date.now()) {
      console.log('data invalida');
      return;
    }

    setReload(true);

    try {
      let imageUrl = '';
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      await addDoc(collection(db, "registros"), {
        reg: Date.now(),
        dataDoc: converteParaTimestamp(dataDoc),
        movimentacao,
        tipo: selecionaTipo,
        ministerio: selecionaMinisterio,
        detalhamento: detalhamento,
        valor: parseFloat(valor),
        section: 'a vista',
        imageUrl: imageUrl // Armazena o URL da imagem
      });

      await ResumoFinanceiro();
      navigation.goBack();
    } catch (e) {
      console.error("Erro ao adicionar documento: ", e);
    } finally {
      setReload(false);
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

  function converteParaTimestamp(dataStr) {
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    const data = new Date(ano, mes - 1, dia);
    return data.getTime();
  }



  const takePhotoAsync = async () => {
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
    }
  };

  const options = {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, margin: 14 }}>
      <View style={{ height: 60, marginVertical: 4, borderRadius: 6, backgroundColor: '#fff' }}>
        <Text style={{ position: 'absolute', zIndex: 9, left: 17, fontSize: 12, fontWeight: 300, top: 10 }}>Tipo:</Text>
        <Picker
          style={{ paddingTop: 18 }}
          selectedValue={movimentacao}
          onValueChange={(itemValue) => {
            setMovimentacao(itemValue);
          }}
        >
          <Picker.Item label="" style={{ fontSize: 14, color: '#aaa' }} />
          <Picker.Item label="Entrada" value="entrada" style={{ fontSize: 14 }} />
          <Picker.Item label="Saída" value="saida" style={{ fontSize: 14 }} />
        </Picker>
      </View>

      <View style={{ height: 60, marginVertical: 4, borderRadius: 6, backgroundColor: '#fff' }}>
        <Text style={{ position: 'absolute', zIndex: 9, left: 17, fontSize: 12, fontWeight: 300, top: 10 }}>Categoria:</Text>
        {movimentacao === 'entrada' ? (
          <Picker
            style={{ paddingTop: 18 }}
            selectedValue={selecionaTipo}
            onValueChange={(itemValue) => {
              setSelecionaTipo(itemValue);
            }}
          >
            <Picker.Item label="" style={{ fontSize: 14, color: '#aaa' }} />
            <Picker.Item label="Dízimos" value="dizimo" style={{ fontSize: 14 }} />
            <Picker.Item label="Ofertas" value="oferta" style={{ fontSize: 14 }} />
            <Picker.Item label="Ofertas Alçadas" value="ofertaalcada" style={{ fontSize: 14 }} />
            <Picker.Item label="Arrecadados" value="arrecadado" style={{ fontSize: 14 }} />
            <Picker.Item label="Outros" value="outros" style={{ fontSize: 14 }} />
          </Picker>
        ) : (
          <Picker
            style={{ paddingTop: 18 }}
            selectedValue={selecionaTipo}
            onValueChange={(itemValue) => {
              setSelecionaTipo(itemValue);
            }}
          >
            <Picker.Item label="" style={{ fontSize: 14, color: '#aaa' }} />
            <Picker.Item label="Compras" value="compra" style={{ fontSize: 14 }} />
            <Picker.Item label="Prebendas" value="prebenda" style={{ fontSize: 14 }} />
            <Picker.Item label="Contas" value="conta" style={{ fontSize: 14 }} />
            <Picker.Item label="Ofertas" value="oferta" style={{ fontSize: 14 }} />
            <Picker.Item label="Outros" value="outros" style={{ fontSize: 14 }} />
          </Picker>
        )}
      </View>

      <Input title={'Data Registro'} value={dataDoc} setValue={setDataDoc} />
      <Input title={'Valor Pago'} value={valor} setValue={setValor} type='numeric' />
      <Input title={'Detalhamento'} value={detalhamento} setValue={setDetalhamento} />

      {movimentacao === 'saida' ? (
        <View style={{ height: 60, marginVertical: 4, borderRadius: 6, backgroundColor: "#fff" }}>
          <Text style={{ position: 'absolute', zIndex: 9, left: 14, fontSize: 12, fontWeight: '300', top: 10 }}>Ministério:</Text>
          <Picker
            style={{ paddingTop: 18 }}
            selectedValue={selecionaMinisterio}
            onValueChange={(itemValue) => setSelecionaMinisterio(itemValue)}
          >
            <Picker.Item label='' style={{ fontSize: 14 }} />
            {ministerios.map((item, index) => (
              <Picker.Item key={index} label={item} value={item} style={{ fontSize: 14 }} />
            ))}
          </Picker>
        </View>
      ) : null}

      <View style={{ gap: 24 }}>

        <Botao corBotao='#9E9365' icone={!imageUri ? 'camerao' : 'check'} acao={() => takePhotoAsync()} texto={!imageUri ? 'Imagem do Documento' : 'Imagem Carregada'} />
        <Botao acao={() => Registrar()} texto={'Confirmar Registro'} reload={reload} />
      </View>
    </ScrollView>
  );
}
