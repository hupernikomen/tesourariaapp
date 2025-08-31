import { useContext, useState } from 'react';
import { View, Text } from 'react-native';
import { AppContext } from '../../context/appContext';
import { useNavigation, useRoute, useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import Botao from '../../componentes/Botao'

export default function Pagamento() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const route = useRoute()
  const { RegistrarPagamentoParcela, formatoMoeda } = useContext(AppContext)
  const [currentDate, setCurrentData] = useState(new Date())

  const [show, setShow] = useState(false)

  const onChange = (event, selectedDate) => {

    const currentDate = selectedDate;
    setShow(false);
    setCurrentData(selectedDate)

  };

  const registrarPagamento = () => {
    if (currentDate instanceof Date && !isNaN(currentDate)) {
      RegistrarPagamentoParcela(currentDate, route.params);
      navigation.navigate('Main')

    } else {
      console.log('Data inválida selecionada:', currentDate);
    }
    
  }

  
  const options = {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };


  return (
    <View style={{ padding: 14, flex: 1, justifyContent: 'center' }}>
      {show && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="calendar"
          onChange={onChange}
        />
      )}


      <Text style={{marginBottom:14, textAlign:"center", fontSize:16}}>Confirme Pagamento</Text>

      <View style={{ alignItems: 'center', marginBottom: 42 }}>

        <Text style={{ textTransform: 'uppercase', fontFamily: 'Roboto-Light', fontSize: 13, color: '#000' }}>ITEM: <Text style={{fontFamily:'Roboto-Medium'}}>{route.params?.detalhamento}</Text></Text>
        <Text style={{ textTransform: 'uppercase', fontFamily: 'Roboto-Light', fontSize: 13, color: '#000' }}>PARCELA: <Text style={{fontFamily:'Roboto-Medium'}}>{route.params?.parcela}/{route.params?.recorrencia}</Text></Text>
        <Text style={{ textTransform: 'uppercase', fontFamily: 'Roboto-Light', fontSize: 13, color: '#000' }}>VENCIMENTO: <Text style={{fontFamily:'Roboto-Medium'}}>{new Intl.DateTimeFormat('pt-BR', options).format(route.params?.dataDoc)}</Text></Text>
        <Text style={{ textTransform: 'uppercase', fontFamily: 'Roboto-Light', fontSize: 13, color: '#000' }}>VALOR DA PARCELA: <Text style={{fontFamily:'Roboto-Medium'}}>R$ {formatoMoeda.format(route.params?.valor)}</Text></Text>
      </View>


      <Botao acao={() => setShow(true)} texto={`Data do Pagamento: ${currentDate.toLocaleDateString('pt-BR')}`} corBotao={colors.botao} corTexto={colors.contra_theme} />
      <Botao acao={registrarPagamento} texto={`Registrar Pagamento`} />
    </View>
  );
}