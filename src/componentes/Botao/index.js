import { Pressable, View, Text, ActivityIndicator } from 'react-native';
import Icone from '../Icone';

export default function Botao({ icone, acao, texto, corTexto = '#fff', corBotao = '#659f99ff', altura = 55, reload }) {
  return (
    <Pressable style={{
      backgroundColor: corBotao,
      height: altura,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      marginTop: 7,

    }} onPress={acao}>
      {reload ?
        <ActivityIndicator color={'#fff'} />
        :
        <View style={{ flexDirection: 'row', alignItems: "center", gap: 14 }}>
          {!!icone ? <Icone size={20} color={'#fff'} nome={icone} /> : null}
          <Text style={{ color: corTexto }}>{texto}</Text>
        </View>
      }
    </Pressable>
  );
}