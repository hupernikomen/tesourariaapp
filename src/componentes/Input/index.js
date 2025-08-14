import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function Input({ list = [], iconName, editable = true, type = 'default', title, value, setValue, multiline = true, maxlength, info, onpress, place }) {


  const stl = StyleSheet.create({
    box: {
      minHeight: 60,
      paddingVertical: 8,
      marginVertical: 3.5,
      borderRadius: 21,
      paddingHorizontal: 21,
      backgroundColor: "#fff"
    },
    boxtop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      color: '#999',
      fontSize: 12,
      fontWeight: 300,
      marginLeft: 3,
      marginTop: -5
    },
    info: {
      color: '#aaa',
      fontSize: 13
    },
    input: {
      color: editable ? '#000' : '#999',
      marginTop: -10,
      flex: 1
    },
    containerInput: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    }
  })

  return (
    <View style={stl.box}>
      <View style={stl.boxtop}>
        <Text style={stl.title}>{value ? title : ''}</Text>
        {info ? <Text style={stl.info}>{info}</Text> : null}
      </View>

      <View style={stl.containerInput}>

        <TextInput

          placeholder={value ? place : title}
          placeholderTextColor={'#999'}
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
            <AntDesign name={iconName} size={20} />
          </Pressable>
          : null}
      </View>
    </View>
  );
}