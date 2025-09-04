import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

export default function Avisos({ setAviso, visible, title, message }) {

  return (
    <Modal
      transparent={true}
      visible={!!visible?.mensagem}
      animationType="fade"
    >
      <TouchableOpacity onPress={() => {
        setAviso({})}} style={styles.modalOverlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(70, 70, 70, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    width: '80%',
    alignItems: 'center',
    elevation: 7
  },
  title: {
    fontFamily: 'Roboto-Bold',
    fontSize: 18,
    marginBottom: 10,
  },
  message: {
    fontFamily: 'Roboto-Light',
    textAlign: 'center',
    marginBottom: 7,
  },

});