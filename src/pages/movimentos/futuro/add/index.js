import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { db } from '../../../../firebaseConnection';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Input from '../../../../componentes/Input';
import Botao from '../../../../componentes/Botao';

import DateTimePicker from '@react-native-community/datetimepicker';

export default function Parcelamento() {

  const [reload, setReload] = useState(false)
  const [dataDoc, setDataDoc] = useState(new Date())

  const [frequencia, setFrequencia] = useState('mensal'); // Frequency of payments
  const [detalhamento, setDetalhamento] = useState('');

  const [tipo, setTipo] = useState('');
  const [recorrencia, setRecorrencia] = useState(1);
  const [valor, setValor] = useState('');
  const navigation = useNavigation();
  const [selecionaMinisterio, setSelecionaMinisterio] = useState('');
  const [ministerios, setMinisterios] = useState([])
  const [show, setShow] = useState(false)

  const focus = useIsFocused()


  useEffect(() => {
    BuscarMinisterios()
  }, [])

  useEffect(() => {

    setDataDoc(new Date())
    setTipo('')
    setRecorrencia(1)
    setValor('')
    setDetalhamento('')
    setSelecionaMinisterio('')


  }, [focus])


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
  if (!dataDoc || !valor || reload) {
    console.log("Campos vazios.");
    return; // Exit if dataDoc is empty
  }

  setReload(true);

  try {
    // Convert dataDoc to Date if it's a string (assuming pt-BR format DD/MM/YYYY)
    let initialDate;
    if (typeof dataDoc === 'string') {
      const [day, month, year] = dataDoc.split('/').map(Number);
      initialDate = new Date(year, month - 1, day);
    } else if (dataDoc instanceof Date) {
      initialDate = dataDoc;
    } else {
      console.log("dataDoc não é uma data válida.");
      return;
    }

    // Check if initialDate is valid
    if (isNaN(initialDate.getTime())) {
      console.log("Data inicial inválida.");
      return; // Exit if the date is invalid
    }

    // Get the initial timestamp
    const initialTimestamp = initialDate.getTime();

    for (let i = 0; i < recorrencia; i++) {
      // Calculate the next payment date based on the frequency
      let nextPaymentDate = new Date(initialTimestamp);

      if (frequencia === 'diario') {
        nextPaymentDate.setDate(nextPaymentDate.getDate() + i); // Daily
      } else if (frequencia === 'semanal') {
        nextPaymentDate.setDate(nextPaymentDate.getDate() + i * 7); // Weekly
      } else if (frequencia === 'mensal') {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + i); // Monthly
      }

      // Use getTime() to get the timestamp for the next payment
      const nextPaymentTimestamp = nextPaymentDate.getTime();

      // Add the document for each recurrence
      await addDoc(collection(db, "futuro"), {
        dataDoc: nextPaymentTimestamp, // Store the calculated payment timestamp
        reg: Date.now(),
        detalhamento: detalhamento,
        valor: parseFloat(valor) / recorrencia,
        tipo: tipo,
        movimentacao: 'saida',
        recorrencia,
        ministerio: selecionaMinisterio,
        section: "futuro",
      });
    }
  } catch (e) {
    console.log("Erro ao adicionar documento: ", e);
  } finally {
    navigation.goBack();
    setReload(false);
  }
}

  // Função para converter uma data no formato "DD/MM/AAAA" para um timestamp
  function converteParaTimestamp(dataStr) {
    // Check if the input is a number (timestamp)
    if (typeof dataStr === 'number') {
      return dataStr; // Return the timestamp directly
    }


    // Check if the input is a string
    if (typeof dataStr !== 'string') {
      console.log("dataStr deve ser uma string ou um timestamp.");
      return null; // Return null or handle the error as needed
    }

    // Split the string into day, month, and year
    const [dia, mes, ano] = dataStr.split('/').map(Number);

    // Validate the date components
    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
      console.log("Data inválida. Verifique o formato da data.");
      return null; // Return null if the date is invalid
    }

    // Create a Date object
    const data = new Date(ano, mes - 1, dia); // Lembre-se de que os meses são indexados a partir de 0

    // Check if the date is valid
    if (isNaN(data.getTime())) {
      console.log("Data inválida. Verifique o formato da data.");
      return null; // Return null if the date is invalid
    }

    // Return the timestamp
    return data.getTime();
  }

  const formatoMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'decimal', // Muda o estilo para decimal
    minimumFractionDigits: 2, // Define o número mínimo de casas decimais
    maximumFractionDigits: 2, // Define o número máximo de casas decimais
  });



  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || dataDoc;
    setShow(false);
    setDataDoc(currentDate);
  };


  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, padding: 14 }}>

      {show && (
        <DateTimePicker
          value={dataDoc}
          mode="date"
          display="spinner"
          onChange={onChange}
        />
      )}

      <Input editable={false} title={'Próximo Vencimento'} value={dataDoc.toLocaleDateString('pt-BR')} setValue={setDataDoc} onpress={() => setShow(true)} />


      <View style={{ height: 60, marginVertical: 4, borderRadius: 21, backgroundColor: '#fff', paddingHorizontal: 14 }}>
        <Text style={{ position: 'absolute', zIndex: 9, left: 21, fontSize: 12, fontWeight: 300, top: 10 }}>Tipo:</Text>
        <Picker
          style={{ paddingTop: 18 }}
          selectedValue={tipo}
          onValueChange={(itemValue) => setTipo(itemValue)}>
          <Picker.Item label={''} style={{ fontSize: 14, color: '#bbb' }} />
          <Picker.Item label={'Compras'} value={'compra'} style={{ fontSize: 14 }} />
          <Picker.Item label={'Empréstimo'} value={'emprestimo'} style={{ fontSize: 14 }} />
          <Picker.Item label={'Outros'} value={'outros'} style={{ fontSize: 14 }} />
        </Picker>
      </View>

      <Input title={'Valor a Pagar'} value={valor} setValue={(text) => setValor(parseFloat(text) || 0)} type='numeric' />
      <Input title={'Nº Prestações'} place={String(recorrencia)} value={recorrencia} setValue={setRecorrencia} type='numeric' info={recorrencia ? recorrencia + 'x ' + formatoMoeda.format(valor / recorrencia) : null} />



      <View style={{ height: 60, marginVertical: 4, borderRadius: 21, backgroundColor: '#fff', paddingHorizontal: 14 }}>
        <Text style={{ position: 'absolute', zIndex: 9, left: 21, fontSize: 12, fontWeight: 300, top: 10 }}>Ministério:</Text>
        <Picker
          style={{ paddingTop: 18 }}
          selectedValue={selecionaMinisterio}
          onValueChange={(itemValue) => setSelecionaMinisterio(itemValue)}>
          <Picker.Item label='' style={{ fontSize: 14 }} />
          {ministerios.map((item, index) => (
            <Picker.Item key={index} label={item} value={item} style={{ fontSize: 14 }} />
          ))}
        </Picker>
      </View>

      <Input title={'Detalhamento'} value={detalhamento} setValue={setDetalhamento} multiline />

      <Botao acao={Registrar} texto={'Confirmar'} reload={reload} />

    </ScrollView >
  );
}
