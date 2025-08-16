import { View, Text } from 'react-native';

export default function Texto({ texto, wheight, size, linhas = 0, estilo }) {
  return (
<View>

      <Text numberOfLines={linhas} style={[{
        fontWeight: wheight,
        fontSize: size,
        
      }, estilo]}>{texto}</Text>
      </View>
  );
}