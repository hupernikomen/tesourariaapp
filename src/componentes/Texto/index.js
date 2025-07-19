import { View, Text } from 'react-native';

export default function Texto({ texto, wheight, size, linhas = 1, estilo }) {
  return (

      <Text numberOfLines={linhas} style={[{
        fontWeight: wheight,
        fontSize: size

      }, estilo]}>{texto}</Text>
  );
}