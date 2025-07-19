import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function Input({ editable = true, type = 'default', title, value, setValue, multiline = true, maxlength, info, onpress, place }) {


  const stl = StyleSheet.create({
    box: {
      minHeight: 60,
      paddingVertical: 8,
      marginVertical: 4,
      borderRadius: 6,
      paddingHorizontal: 12,
      backgroundColor:"#fff"
    },
    boxtop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 6
    },
    title: {
      color: '#000',
      fontSize: 12,
      fontWeight:300
    },
    info: {
      color: '#aaa',
      fontSize: 13
    },
    input: {
      color: '#000',
      marginTop:-10,
      paddingHorizontal:7,
      flex:1
    },
    containerInput: {
      flexDirection: 'row',
      justifyContent: 'space-between'
    }
  })

  return (
    <View style={stl.box}>
      <View style={stl.boxtop}>
        <Text style={stl.title}>{title}</Text>
        <Text style={stl.info}>{info}</Text>
      </View>

      <View style={stl.containerInput}>

        <TextInput
        
        placeholder={place}
          editable={editable}
          maxLength={maxlength}
          multiline={multiline}
          style={stl.input}
          keyboardType={type}
          value={value}
          onChangeText={(e) => setValue(e)}
        />

        {!!onpress ?
          <Pressable onPress={onpress}>
           <AntDesign name='calendar' size={22}/>
          </Pressable>
          : null}
      </View>
    </View>
  );
}