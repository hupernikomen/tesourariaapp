import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { AppContext } from '../../../context/appContext';
import { db } from '../../../firebaseConnection';
import { doc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function DetalheRegistro() {
  const width = Dimensions.get('window').width;
  const { SomarReceitasEDespesasPorAno, formatoMoeda } = useContext(AppContext);
  const route = useRoute();
  const navigation = useNavigation();
  const [confirma, setConfirma] = useState(false);
  const [showImage, setShowImage] = useState(false); // Estado para controlar a visibilidade da imagem

  useEffect(() => {
    navigation.setOptions({
      title: route.params?.tipo.charAt(0).toUpperCase() + route.params?.tipo.slice(1),
      headerRight: () => (
          <AntDesign onPress={() => setConfirma(true)}  name='delete' color={'#fff'} size={22} style={{width:50, aspectRatio:1, verticalAlign: 'middle', textAlign:"center" }}/>
      )
    });
  }, [route]);

  async function ExcluiRegistro() {
    const docRegistrosFinanceiros = doc(db, "registros", route.params?.id);
    const imageUrl = route.params?.imageUrl;
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
      await SomarReceitasEDespesasPorAno();
      navigation.goBack();

    } catch (e) {
      console.error("Erro crítico ao excluir:", e);
      alert("Ocorreu um erro durante a exclusão");
    }
  }

  const options = {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, padding: 14 }}>
      <Text style={{ fontWeight: 300, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginBottom: 24 }}>
        Este registro não pode ser editado, caso tenha informações incorretas, exclua e crie um novo registro.
      </Text>

      <View style={{ backgroundColor: '#fff', flexDirection: 'row', justifyContent: "space-between", marginVertical: 4, padding: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: 300 }}>Data do Registro</Text>
        <Text style={{ fontSize: 12 }}>{new Intl.DateTimeFormat('pt-BR', options).format(route.params?.dataDoc)}</Text>
      </View>

      <View style={{ backgroundColor: '#fff', flexDirection: 'row', justifyContent: "space-between", marginVertical: 4, padding: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: 300 }}>Valor Pago</Text>
        <Text style={{ fontSize: 12 }}>{formatoMoeda.format(route.params?.valor)}</Text>
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

            <View style={{ marginVertical: 14, gap: 14 }}>


        {confirma ?
          <TouchableOpacity onPress={ExcluiRegistro} style={{ alignItems: "center", justifyContent: 'center', marginTop: 6, backgroundColor: '#333', height: 50, borderRadius: 6, elevation: 5 }}>
            <Text style={{ color: '#fff' }}>Confirmar Exclusão</Text>
          </TouchableOpacity>
          : null
        }
      </View>

      {route.params?.imageUrl ? (
        <View>
          <TouchableOpacity 
            onPress={() => setShowImage(!showImage)} 
            style={{
              backgroundColor: '#f0f0f0', 
              padding: 10, 
              borderRadius: 6, 
              marginVertical: 8,
              alignItems: 'center'
            }}>
            <Text style={{ fontSize: 14, color: '#333' }}>{showImage ? 'Ocultar Documento' : 'Ver Documento'}</Text>
          </TouchableOpacity>

          {showImage && (
            <Image
              style={{
                width: width - 28,
                aspectRatio: '9/16',
                borderWidth: 0.5,
                borderRadius: 6,
                overflow: 'hidden',
                borderColor: '#333',
                marginVertical: 8,
              }}
              source={route.params?.imageUrl}
              contentFit="cover"
              transition={1000}
            />
          )}
        </View>
      ) : null}


    </ScrollView>
  );
}
