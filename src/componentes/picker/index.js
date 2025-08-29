import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import Input from '../Input';
import Botao from '../Botao';

const CustomPickerModal = ({ mostrar=true, itens, selectedValue, setSelectedValue, titulo }) => {

  if (!mostrar) {
    return
  }

  const [modalVisible, setModalVisible] = useState(false);

// Ordenar categorias: receitas primeiro, depois despesas, e alfabeticamente por label, ignorando "Min. "
  const sortedCategories = itens.sort((a, b) => {
    // Prioriza receitas antes de despesas
    if (a.type !== b.type) {
      return a.type === 'receita' ? -1 : 1;
    }
    // Remove prefixos "Min. ", "Min. de ", "Min. da " para ordenação alfabética
    const cleanLabelA = a.label.replace(/^(Min\.(\s|da\s|de\s)?)/i, '').trim();
    const cleanLabelB = b.label.replace(/^(Min\.(\s|da\s|de\s)?)/i, '').trim();
    return cleanLabelA.localeCompare(cleanLabelB, 'pt-BR', { sensitivity: 'base' });
  });

  const handleSelectCategory = (category) => {
    setSelectedValue(category); // Passa o objeto completo da categoria
    setModalVisible(false);
  };

  return (
    <View>
      <Input
        title={titulo}
        value={selectedValue ? selectedValue.label : ''}
        editable={false}
        onpress={() => setModalVisible(true)}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {sortedCategories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryButton,
                    selectedValue?.id === category.id
                      ? styles.categoryButtonSelected
                      : styles.categoryButtonDefault,
                  ]}
                  onPress={() => handleSelectCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  {category.exemplos && (
                    <Text style={styles.categoryExamples}>{category.exemplos}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Botao
              texto={'Cancelar'}
              acao={() => setModalVisible(false)}
              icone={'close'}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    justifyContent:'space-between'
  },
  modalTitle: {
    fontSize: 20,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  scrollView: {
    maxHeight: '80%',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderBottomWidth: 0.5,
    borderColor: '#d1d5db',
  },
  categoryButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  categoryButtonDefault: {
    borderColor: '#d1d5db',
  },
  categoryLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  categoryExamples: {
    fontWeight:300,
    fontSize: 13,
    color: '#7d828aff',
    marginTop: 4,
  },
});

export default CustomPickerModal;