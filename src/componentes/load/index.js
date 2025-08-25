import { useTheme } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';

export default function Load() {

  const {colors} = useTheme()

 return (
   <View>
    <ActivityIndicator size={60} color={colors.receita}/>
   </View>
  );
}