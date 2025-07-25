import { useRoute } from '@react-navigation/native';
import { View, Image, Dimensions } from 'react-native';


export default function ImgDoc() {


    const width = Dimensions.get('window').width;
  
  
  const route = useRoute()
  console.log(route.params.imageUrl);

return(

  <View style={{flex:1, alignItems:"center", justifyContent:'center'}}>
        

            <Image
              style={{
                width: width -14,
                aspectRatio: '9/16',
                borderRadius: 6,
              }}
              source={{uri: route.params?.imageUrl}}
              contentFit="cover"
              transition={1000}
              />
        </View>
)

}