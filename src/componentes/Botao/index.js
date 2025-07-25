import { Pressable, View, Text, ActivityIndicator } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign'

export default function Botao({ icone, acao, texto, corTexto = '#fff', corBotao = '#659f99ff', altura = 50, reload }) {

  return (
    <Pressable style={{
      backgroundColor: corBotao,
      height: altura,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      marginTop: 14,
      marginHorizontal: 5

    }} onPress={acao}>
      {reload ?
        <ActivityIndicator color={'#fff'} />
        :
        <View style={{ flexDirection: 'row', alignItems: "center", gap: 14 }}>
          {!!icone ? <AntDesign size={22} color={'#fff'} name={icone} /> : null}
          <Text style={{ color: corTexto }}>{texto}</Text>
        </View>
      }
    </Pressable>
  );
}