import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

export default function Avisos({ setAvisos, visible, title, message, okButtonText = 'OK', payButtonText = 'Pagar Agora', onOkPress, onPayPress, onClose }) {


  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity onPress={() => setAvisos(false)} style={styles.modalOverlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {/* <TouchableOpacity onPress={onOkPress} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.buttonText}>{okButtonText}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onPayPress} style={[styles.button, {backgroundColor:colors.receita}]}>
              <Text style={styles.buttonText}>{payButtonText}</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Roboto-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  message: {
    fontFamily: 'Roboto-Light',
    textAlign: 'center',
    marginBottom: 20,
  },

});