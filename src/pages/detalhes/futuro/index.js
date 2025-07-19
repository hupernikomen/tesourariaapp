import React, { useEffect, useState, useContext } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native'

import { AppContext } from '../../../context/appContext'

import { db } from '../../../firebaseConnection'
import { doc, updateDoc, deleteDoc, addDoc, collection } from "firebase/firestore"

import { useNavigation, useRoute } from '@react-navigation/native'

import { Image } from 'expo-image';
import Input from '../../../componentes/Input'

export default function DetalheFuturo() {
  const { SomarReceitasEDespesasPorAno, formatoMoeda } = useContext(AppContext);
  const [confirma, setConfirma] = useState(false);
  const [confirmaPagamento, setConfirmaPagamento] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  const [tipo, setTipo] = useState('');
  const [ministerio, setMinisterio] = useState('');
  const [detalhamento, setDetalhamento] = useState('');
  const [dataPagamento, setDataPagamento] = useState(formatarData(new Date())); // Formata a data inicial
  const [valor, setValor] = useState('');


  useEffect(() => {
    setTipo(route.params?.tipo);
    setMinisterio(route.params?.ministerio);
    setDetalhamento(route.params?.detalhamento);
    setValor(parseFloat(route.params?.valor).toFixed(2));
  }, []);
  useEffect(() => {
    navigation.setOptions({
      title: route.params?.tipo.charAt(0).toUpperCase() + route.params?.tipo.slice(1)
    });
  }, [route, navigation]);





  function formatarData(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Meses começam do zero
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
  function converterParaTimestamp(dataString) {
    const [dia, mes, ano] = dataString.split('/');
    const data = new Date(`${ano}-${mes}-${dia}T00:00:00Z`); // Formato ISO 8601
    return data.getTime();
  }


  async function PagamentoDeFuturo() {
    const timestamp = converterParaTimestamp(dataPagamento); // Converte a data para timestamp
    try {
      await addDoc(collection(db, "registros"), {
        reg: route.params?.reg,
        dataDoc: timestamp, // Envia o timestamp
        movimentacao: route.params?.movimentacao,
        tipo: route.params?.tipo,
        ministerio: route.params?.ministerio,
        detalhamento: route.params?.detalhamento,
        valor: route.params?.valor,
        section: route.params?.section,
      });
      await ExcluirFuturoColecao(route.params?.id); // Chama a função para atualizar o registro, se necessário
    } catch (e) {
      console.log("Erro ao adicionar documento: ", e);
    }
  }


  async function ExcluirFuturoColecao(id) {
    const docRef = doc(db, "futuro", id);

    try {
      await deleteDoc(docRef);
      await SomarReceitasEDespesasPorAno()
    } catch (e) {
      console.log("Erro ao atualizar documento: ", e);
    } finally {
      navigation.goBack(); // Navega de volta após a atualização
    }
  }



  async function AtualizaFuturo() {
    const registroId = route.params?.id;
    const docRef = doc(db, "registros", registroId);
    const futuroDocRef = doc(db, "futuro", registroId);

    if (!valor) return;

    try {


      await updateDoc(futuroDocRef, {
        tipo,
        ministerio,
        detalhamento,
        valor: parseFloat(valor)
      });

      await SomarReceitasEDespesasPorAno();

    } catch (e) {
      console.log("Erro ao atualizar documento: ", e);

    } finally {
      navigation.goBack();
    }
  }





  async function ExcluirFuturoColecao() {
    const docRef = doc(db, "futuro", route.params?.id);

    try {
      await deleteDoc(docRef);
      await SomarReceitasEDespesasPorAno()
    } catch (e) {
      console.log("Erro ao atualizar documento: ", e);
    } finally {
      navigation.goBack(); // Navega de volta após a atualização
    }
  }


  const options = {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };


  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingHorizontal: 14, paddingTop: 12 }}>

      <Text style={{ fontWeight: 300, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginBottom: 24 }}>Apenas esta parcela sera editada. Para alterar todas, é necessário ajustar manualmente cada registro.</Text>


      <View style={{ backgroundColor: '#fff', flexDirection: 'row', justifyContent: "space-between", marginVertical: 4, padding: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: 300 }}>Data do Vencimento</Text>
        <Text style={{ fontSize: 12 }}>{new Intl.DateTimeFormat('pt-BR', options).format(route.params?.dataDoc)}</Text>
      </View>


      <View style={{ backgroundColor: '#fff', flexDirection: 'row', justifyContent: "space-between", marginVertical: 4, padding: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: 300 }}>Valor a Pagar</Text>
        <TextInput style={{ fontSize: 12 }} value={formatoMoeda.format(valor)} onChangeText={setValor} />
      </View>

      {route.params?.ministerio ?
        <View style={{ backgroundColor: '#fff', flexDirection: 'row', justifyContent: "space-between", marginVertical: 4, padding: 14 }}>
          <Text style={{ fontSize: 12, fontWeight: 300 }}>Ministério Solicitante</Text>
          <Text style={{ fontSize: 12, textAlign: 'right' }}>{route.params?.ministerio}</Text>
        </View>
        : null
      }

      <View style={{ backgroundColor: '#fff', justifyContent: "space-between", marginVertical: 4, padding: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: 300 }}>Detalhamento</Text>
        <Text style={{ fontSize: 12, textAlign: 'right' }}>{route.params?.detalhamento}</Text>
      </View>


      {route.params?.imageUrl ? <Image
        style={{ width: 50, height: 50 }}
        source={route.params?.imageUrl}
        contentFit="cover"
        transition={1000} /> : null}


      <View style={{ marginTop: 20, gap: 14 }}>

        <TouchableOpacity onPress={() => setConfirmaPagamento(true)} style={{ alignItems: "center", justifyContent: 'center', marginTop: 6, backgroundColor: '#659f99ff', height: 50, borderRadius: 6, elevation: 5 }}>
          <Text style={{ color: '#fff' }}>Pagar</Text>
        </TouchableOpacity>

        {confirmaPagamento ? (
          <View style={{ backgroundColor: '#fff', alignItems: 'center', flexDirection: 'row', justifyContent: "space-between", paddingHorizontal: 14 }}>
            <Input
              title={'Data do Pagamento'}
              value={dataPagamento}
              setValue={setDataPagamento}
            />
            <TouchableOpacity onPress={PagamentoDeFuturo} style={{ paddingHorizontal: 14, alignItems: "center", justifyContent: 'center', backgroundColor: '#659f99ff', height: 50, borderRadius: 6, elevation: 5 }}>
              <Text style={{ color: '#fff' }}>Confirma Data</Text>
            </TouchableOpacity>
          </View>
        ) : null}


        <TouchableOpacity onPress={AtualizaFuturo} style={{ alignItems: "center", justifyContent: 'center', marginTop: 6, backgroundColor: '#659f99ff', height: 50, borderRadius: 6, elevation: 5 }}>
          <Text style={{ color: '#fff' }}>Atualizar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setConfirma(true)} style={{ alignItems: "center", justifyContent: 'center', marginTop: 6, backgroundColor: '#659f99ff', height: 50, borderRadius: 6, elevation: 5 }}>
          <Text style={{ color: '#fff' }}>Excluir</Text>
        </TouchableOpacity>

        {confirma ?
          <TouchableOpacity onPress={ExcluirFuturoColecao} style={{ alignItems: "center", justifyContent: 'center', marginTop: 6, backgroundColor: '#333', height: 50, borderRadius: 6, elevation: 5 }}>
            <Text style={{ color: '#fff' }}>Confirmar Exclusão</Text>
          </TouchableOpacity>
          : null
        }

      </View>

    </ScrollView>
  )
}
