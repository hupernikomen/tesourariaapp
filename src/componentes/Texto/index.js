import { useTheme } from '@react-navigation/native';
import { Text } from 'react-native';

export default function Texto({ texto, wheight, size, linhas = 0, estilo }) {
  const { font, colors } = useTheme();

  return (
    <Text
      numberOfLines={linhas}
      style={[{ color: colors.contra_theme, fontSize: size, fontFamily: font[wheight] || 'Roboto-Regular' }, estilo]}
    >
      {texto}
    </Text>
  );
}