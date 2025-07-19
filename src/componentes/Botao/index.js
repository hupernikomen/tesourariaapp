import { Pressable, View, Text, ActivityIndicator } from 'react-native';

export default function Botao({ acao, texto, corTexto = '#fff', corBotao = '#659f99ff', altura = 50, reload }) {

  return (
    <Pressable style={{
      backgroundColor: corBotao,
      height: altura,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      marginTop: 14

    }} onPress={acao}>
      {reload ?
        <ActivityIndicator color={'#fff'}/>
        :
        <Text style={{ color: corTexto }}>{texto}</Text>
      }
    </Pressable>
  );
}