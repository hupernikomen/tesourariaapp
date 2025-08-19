import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import Icone from '../Icone';

export default function Input({ list = [], iconName, editable = true, type = 'default', title, value, setValue, multiline = true, maxlength, info, onpress, place }) {


  const stl = StyleSheet.create({
    box: {
      minHeight: 60,
      marginVertical: 3.5,
      borderRadius: 7,
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
      fontSize: 13,
      fontWeight: 300,
      marginLeft: 3,
      marginTop: 5,
      alignSelf: 'flex-start'
    },
    info: {
      color: '#aaa',
      fontSize: 13
    },
    input: {
      color: editable ? '#000' : '#999',
      flex: 1,
    },
    containerInput: {
      flexDirection: 'row',
      marginTop: -7,
      justifyContent: 'space-between',
      alignItems: "center"
    }
  })

  return (
    <View style={stl.box}>
      <View style={stl.boxtop}>
        <Text style={stl.title}>{title}</Text>
      </View>

      <View style={stl.containerInput}>

        <TextInput

          // placeholder={value ? place : title}
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
          <Pressable onPress={onpress} style={{ padding: 7, marginRight: -7 }}>
            <Icone nome={iconName} />
          </Pressable>
          : null}
      </View>
    </View>
  );
}