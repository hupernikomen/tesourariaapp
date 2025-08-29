import { useTheme } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';

export default function Load() {

  const {colors} = useTheme()

 return (
   <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
    <ActivityIndicator size={80} color={colors.receita}/>
   </View>
  );
}