import { useTheme } from '@react-navigation/native';
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

export default function CustomAlert({ visible, title, message, okButtonText = 'OK', payButtonText = 'Pagar Agora', onOkPress, onPayPress, onClose }) {


  const { colors } = useTheme()

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onOkPress} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.buttonText}>{okButtonText}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onPayPress} style={[styles.button, {backgroundColor:colors.receita}]}>
              <Text style={styles.buttonText}>{payButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },

  buttonText: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
  },
});