import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';

export default function Input({ mostrar = true,list = [], iconName, editable = true, type = 'default', title, value, setValue, multiline = true, maxlength, info, onpress, place }) {

  if (!mostrar) {
    return
  }

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
      color: '#000',
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
    <Pressable onPress={onpress} style={stl.box}>
      <View style={stl.boxtop}>
        <Text style={stl.title}>{title}</Text>
      </View>

      <View style={stl.containerInput}>

        <TextInput
          placeholderTextColor={'#999'}
          editable={editable}
          maxLength={maxlength}
          multiline={multiline}
          style={stl.input}
          keyboardType={type}
          value={value}
          onChangeText={(e) => setValue(e)}
        />

      </View>
    </Pressable>
  );
}