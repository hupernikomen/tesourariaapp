import { Pressable, View, Text, ActivityIndicator } from 'react-native';
import Icone from '../Icone';
import { useTheme } from '@react-navigation/native';

export default function Botao({ icone, acao, texto,  corBotao, altura = 55, reload }) {
  
  const {colors} = useTheme()
  
  return (
    <Pressable style={{
      backgroundColor: corBotao || colors.receita,
      height: altura,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 7,
      marginTop: 21,

    }} onPress={acao}>
      {reload ?
        <ActivityIndicator color={colors.botao} />
        :
        <View style={{ flexDirection: 'row', alignItems: "center", gap: 14 }}>
          {!!icone ? <Icone size={20} color={colors.botao} nome={icone} /> : null}
          <Text style={{ color: colors.botao }}>{texto}</Text>
        </View>
      }
    </Pressable>
  );
}