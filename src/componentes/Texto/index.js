import { useTheme } from '@react-navigation/native';
import { Text } from 'react-native';

export default function Texto({ texto, wheight, size, linhas = 0, estilo }) {
  const { font, cores } = useTheme();

  return (
    <Text
      numberOfLines={linhas}
      style={[{ color: cores.preto, fontSize: size, fontFamily: font[wheight] || 'Roboto-Regular' }, estilo]}
    >
      {texto}
    </Text>
  );
}