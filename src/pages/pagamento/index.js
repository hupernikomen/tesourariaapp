import { useContext, useState } from 'react';
import { View, Text } from 'react-native';
import { AppContext } from '../../context/appContext';
import { useRoute, useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import Botao from '../../componentes/Botao'
import Load from '../../componentes/load';

export default function Pagamento() {
  const { colors } = useTheme()
  const route = useRoute()
  const { RegistrarPagamentoParcela, formatoMoeda, load } = useContext(AppContext)
  const [currentDate, setCurrentData] = useState(new Date())

  const [show, setShow] = useState(false)

  const onChange = (event, selectedDate) => {

    setShow(false);
    setCurrentData(selectedDate)

  };

  const registrarPagamento = () => {
    if (currentDate instanceof Date && !isNaN(currentDate)) {
      RegistrarPagamentoParcela(currentDate, route.params);

    } else {
      console.log('Data inválida selecionada:', currentDate);
    }
    
  }

  
  const options = {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };

  if (load) return <Load/>

    const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysBeforeFirst = new Date(firstDayOfMonth);
    sevenDaysBeforeFirst.setDate(firstDayOfMonth.getDate() - 1);
    const today = new Date(now);
    return { minimumDate: sevenDaysBeforeFirst, maximumDate: today };
  };

  const { minimumDate, maximumDate } = getCurrentMonthRange();


  return (
    <View style={{ padding: 14, flex: 1, justifyContent: 'center' }}>
      {show && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="calendar"
          onChange={onChange}
          maximumDate={maximumDate}
        />
      )}


      <Text style={{marginBottom:14, textAlign:"center", fontSize:16}}>Confirme Pagamento</Text>

      <View style={{ alignItems: 'center', marginBottom: 42 }}>

        <Text style={{ textTransform: 'uppercase', fontFamily: 'Roboto-Light', fontSize: 13, color: '#000', textAlign:'center' }}>ITEM: <Text style={{fontFamily:'Roboto-Medium'}}>{route.params?.detalhamento}</Text></Text>
        <Text style={{ textTransform: 'uppercase', fontFamily: 'Roboto-Light', fontSize: 13, color: '#000' }}>PARCELA: <Text style={{fontFamily:'Roboto-Medium'}}>{route.params?.parcela}/{route.params?.recorrencia}</Text></Text>
        <Text style={{ textTransform: 'uppercase', fontFamily: 'Roboto-Light', fontSize: 13, color: '#000' }}>VENCIMENTO: <Text style={{fontFamily:'Roboto-Medium'}}>{new Intl.DateTimeFormat('pt-BR', options).format(route.params?.dataDoc)}</Text></Text>
        <Text style={{ textTransform: 'uppercase', fontFamily: 'Roboto-Light', fontSize: 13, color: '#000' }}>VALOR DA PARCELA: <Text style={{fontFamily:'Roboto-Medium'}}>R$ {formatoMoeda.format(route.params?.valor)}</Text></Text>
      </View>


      <Botao acao={() => setShow(true)} texto={`Data do Pagamento: ${currentDate.toLocaleDateString('pt-BR')}`} corBotao={colors.contra_theme} corTexto={colors.contra_theme} />
      <Botao acao={registrarPagamento} texto={`Confirmar Pagamento`} />
    </View>
  );
}