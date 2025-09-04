import { useState, useContext, useEffect } from 'react';
import { ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../firebaseConnection';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigation, useTheme } from '@react-navigation/native';
import { AppContext } from '../../context/appContext';
import Input from '../../componentes/Input';
import Botao from '../../componentes/Botao';
import { Camera } from 'expo-camera';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomPickerModal from '../../componentes/picker';

export default function AddRegistros() {
  const { ResumoFinanceiro, HistoricoMovimentos, usuarioDoAS, load, setLoad, setAviso, setAvisos } = useContext(AppContext);
  const navigation = useNavigation();
  const { cores } = useTheme();

  const [data, setData] = useState(new Date());
  const [detalhamento, setDetalhamento] = useState('');
  const [valor, setValor] = useState('');
  const [selectedImage, setSelectedImage] = useState(undefined);
  const [imagem, setImagem] = useState('');
  const [recorrencia, setRecorrencia] = useState('');
  const [permissaoCamera, setPermissaoCamera] = useState(null);
  const [ministerioSelecionado, setMinisterioSelecionado] = useState('');
  const [ministerios, setMinisterios] = useState([]);
  const [show, setShow] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [montaTela, setMontaTela] = useState([]);


  useEffect(() => {
    (async () => {
      const cameraStt = await Camera.requestCameraPermissionsAsync();
      setPermissaoCamera(cameraStt.status === 'granted');
      await BuscarMinisterios();
      await BuscarTipos();
    })();
  }, []);


  useEffect(() => {

    switch (tipoSelecionado?.label) {
      case 'Dízimos':
      case 'Ofertas':
      case 'Ofertas Alçadas':
        setMontaTela(['Dizimos', 'Valor', 'Detalhamento'])
        break;
      case 'Compras à Vista':
        setMontaTela(['Imagem da Nota', 'Ministerio', 'Valor', 'Detalhamento'])
        break
      case 'Compras Parceladas':
        setMontaTela(['Imagem da Nota', 'Nº de Prestações', 'Ministerio', 'Valor', 'Detalhamento'])
        break;
      case 'Contas Recorrentes':
        setMontaTela(['Imagem da Nota', 'Valor', 'Detalhamento'])
        break
      case 'Empréstimos':
        setMontaTela(['Nº de Prestações', 'Valor', 'Detalhamento'])
        break
      case 'Ofertas Missionárias':
        setMontaTela(['Valor', 'Detalhamento'])
        break
      default:
        break;
    }

  }, [tipoSelecionado])





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


  async function Registrar() {


    const isValidString = (str) => {
      if (typeof str !== 'string' || str.trim() === '') return false;
      const validPattern = /^[A-Za-zÀ-ÿ0-9\s.,;!?()-]+$/;
      return validPattern.test(str) && str.trim().length >= 1;
    };

    if (!tipoSelecionado || !valor || !isValidString(detalhamento) || load) {
      console.log(
        !tipoSelecionado ? 'Categoria não selecionada' :
          !valor ? 'Valor não informado' :
            !isValidString(detalhamento) ? 'Detalhamento inválido' :
              'Em recarga'
      );
      return;
    }

    setLoad(true);


    try {
      if (!recorrencia) {
        const imageUrl = selectedImage ? await uploadImage(selectedImage) : '';
        await addDoc(collection(db, 'registros'), {
          idUsuario: usuarioDoAS.usuarioId,
          reg: Date.now(),
          dataDoc: data.getTime(),
          tipo: tipoSelecionado.label,
          valor: parseFloat(valor),
          movimentacao: tipoSelecionado.type,
          ministerio: tipoSelecionado.type === 'despesa' ? ministerioSelecionado : '',
          imageUrl,
          detalhamento,
          pago: true,
        });

        setAvisos(true)
        setAviso({ titulo: 'Sucesso', mensagem: `Registro do tipo '${tipoSelecionado.label}' realizado` })

      } else {
        const parcelas = [];
        const initialTimestamp = data.getTime();
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
          idUsuario: usuarioDoAS.usuarioId,
          reg: Date.now(),
          tipo: tipoSelecionado.label,
          recorrencia: parseInt(recorrencia),
          movimentacao: tipoSelecionado.type,
          ministerio: tipoSelecionado.type === 'despesa' ? ministerioSelecionado : '',
          imageUrl,
          detalhamento,
          valorTotal: parseFloat(valor),
          parcelas,
        });

      }
    } catch (e) {
      console.log('Erro ao adicionar documento:', e);
    } finally {
      setLoad(false);
      setTipoSelecionado(null);
      setData(new Date());
      setValor('');
      setRecorrencia('');
      setDetalhamento('');
      setMinisterioSelecionado('');
      setImagem('');
      setSelectedImage(undefined);

      await Promise.all([ResumoFinanceiro(), HistoricoMovimentos()]).finally(() => setLoad(false))

      navigation.goBack();

      setMontaTela([])
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
    setLoad(true);
    if (permissaoCamera === false) {
      alert('Você não concedeu permissão para usar a câmera!');
      setLoad(false);
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
        setImagem(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Ocorreu um erro ao tentar abrir a câmera');
    } finally {
      setLoad(false);
    }
  };

  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysBeforeFirst = new Date(firstDayOfMonth);
    sevenDaysBeforeFirst.setDate(firstDayOfMonth.getDate() - 1);
    const today = new Date(now);
    return { minimumDate: sevenDaysBeforeFirst, maximumDate: today };
  };

  const { minimumDate, maximumDate } = getCurrentMonthRange();

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || data;
    setShow(false);
    setData(currentDate);
  };



  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, marginHorizontal: 14, marginVertical: 10 }}
    >
      {show && (
        <DateTimePicker
          value={data}
          mode="date"
          display="calendar"
          onChange={onChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      <Input
        title={'Data *'}
        editable={false}
        value={data.toLocaleDateString('pt-BR')}
        onpress={() => setShow(true)}
        iconName={'calendar-clear-outline'}
      />

      <CustomPickerModal
        titulo={'Tipo de Registro *'}
        itens={tipos}
        selectedValue={tipoSelecionado}
        setSelectedValue={setTipoSelecionado}
      />

      <CustomPickerModal
        mostrar={montaTela.includes('Ministerio')}
        titulo={'Ministério *'}
        itens={ministerios}
        selectedValue={ministerioSelecionado}
        setSelectedValue={setMinisterioSelecionado}
      />

      <Input
        mostrar={montaTela.includes('Imagem da Nota')}
        title={'Imagem da Nota (opcional)'}
        value={imagem ? 'Imagem Carregada' : ''}
        editable={false}
        iconName={imagem ? 'checkmark-done' : 'attach'}
        onpress={takePhotoAsync}
      />

      <Input
        mostrar={montaTela.includes('Total a pagar') || montaTela.includes('Valor')}
        title={tipoSelecionado?.parcela ? 'Total a pagar *' : 'Valor *'}
        value={valor}
        setValue={setValor}
        type="numeric"
      />

      <Input
        mostrar={montaTela.includes('Nº de Prestações')}
        title={'Nº de Prestações *'}
        value={recorrencia}
        setValue={setRecorrencia}
        type="numeric"
        maxlength={2}
      />

      <Input
        mostrar={montaTela.includes('Detalhamento')}
        title={'Detalhamento *'}
        value={detalhamento}
        setValue={setDetalhamento}
      />

      <Botao
        acao={Registrar}
        texto={recorrencia ? 'Registro Futuro' : 'Confirmar Registro'}
        reload={load}
        icone={'save-outline'}
        corBotao={cores.receita}
      />
    </ScrollView>
  );
}