import { View } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';

export default function Icone({ estilo,nome, size = 24, color = 'black', ...props }) {
  const ioniconsIcons = Ionicons.getRawGlyphMap();
  const antDesignIcons = AntDesign.getRawGlyphMap(); 

  const isIoniconsIcon = nome && ioniconsIcons[nome];
  const isAntDesignIcon = nome && antDesignIcons[nome];

  return (
    <View style={[{ marginLeft: -3, alignSelf: 'center' }, estilo]}>
      {isIoniconsIcon ? (
        <Ionicons name={nome} size={size} color={color} {...props} />
      ) : isAntDesignIcon ? (
        <AntDesign name={nome} size={size} color={color} {...props} />
      ) : (
        <Ionicons name="help-circle-outline" size={size} color={color} {...props} />
      )}
    </View>
  );
}