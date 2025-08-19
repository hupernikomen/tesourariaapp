import { View } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';

export default function Icone({ nome, size = 24, color = 'black', ...props }) {
  // Lista de ícones disponíveis (opcional, para verificação manual, se necessário)
  const ioniconsIcons = Ionicons.getRawGlyphMap(); // Obtém o mapa de ícones do Ionicons
  const antDesignIcons = AntDesign.getRawGlyphMap(); // Obtém o mapa de ícones do AntDesign

  // Verifica se o ícone existe em AntDesign ou Ionicons
  const isIoniconsIcon = nome && ioniconsIcons[nome];
  const isAntDesignIcon = nome && antDesignIcons[nome];

  return (
    <View style={{ marginLeft: -3, alignSelf: 'center' }}>
      {isIoniconsIcon ? (
        <Ionicons name={nome} size={size} color={color} {...props} />
      ) : isAntDesignIcon ? (
        <AntDesign name={nome} size={size} color={color} {...props} />
      ) : (
        // Fallback: renderiza um ícone padrão se o nome não for encontrado
        <Ionicons name="help-circle-outline" size={size} color={color} {...props} />
      )}
    </View>
  );
}