import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trash2 } from 'react-native-feather';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const AddTransactionModal = ({ visible, onClose, type, onAddTransaction }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const loadCategories = async () => {
    try {
      const builtInCategories =
        type === 'expense'
          ? [
              { id: '1', name: 'Food' },
              { id: '2', name: 'Transport' },
              { id: '3', name: 'Shopping' },
              { id: '4', name: 'Bills' },
              { id: '5', name: 'Entertainment' },
            ]
          : [
              { id: '1', name: 'Salary' },
              { id: '2', name: 'Bonus' },
              { id: '3', name: 'Gift' },
              { id: '4', name: 'Other' },
            ];

      const storedCategories = await AsyncStorage.getItem(`userCategories_${type}`);
      const userCategories = storedCategories ? JSON.parse(storedCategories) : [];
      setCategories([...builtInCategories, ...userCategories]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [type]);

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date());
    setNewCategory('');
    setShowNewCategoryInput(false);
  };

  const saveTransaction = async () => {
    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter an amount.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    const finalCategory = newCategory.trim() ? newCategory.trim() : category;
    if (!finalCategory) {
      Alert.alert('Error', 'Please select or enter a category.');
      return;
    }

    const transaction = {
      amount: parsedAmount,
      category: finalCategory,
      description: description.trim(),
      date: date.toISOString(),
      type,
    };

    try {
      await addDoc(collection(db, 'transactions'), transaction);

      if (newCategory.trim()) {
        const trimmedCategory = newCategory.trim();
        const categoryExists = categories.some(
          (cat) => cat.name.toLowerCase() === trimmedCategory.toLowerCase()
        );
        if (!categoryExists) {
          const newCatObj = { id: Date.now().toString(), name: trimmedCategory };
          const storedCategories = await AsyncStorage.getItem(`userCategories_${type}`);
          const userCategories = storedCategories ? JSON.parse(storedCategories) : [];
          const updatedUserCategories = [...userCategories, newCatObj];
          await AsyncStorage.setItem(`userCategories_${type}`, JSON.stringify(updatedUserCategories));
          loadCategories();
        }
      }

      if (onAddTransaction) {
        onAddTransaction(transaction);
      }
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    }
  };

  const clearUserCategories = async () => {
    try {
      await AsyncStorage.removeItem(`userCategories_${type}`);
      loadCategories();
      Alert.alert('Success', 'User added categories cleared.');
    } catch (error) {
      console.error('Error clearing categories:', error);
      Alert.alert('Error', 'Failed to clear categories. Please try again.');
    }
  };

  const categoryData = [
    { id: 'add-button', type: 'add' },
    ...categories,
    { id: 'trash-button', type: 'trash' },
  ];

  const renderCategoryItem = ({ item }) => {
    if (item.type === 'add') {
      return (
        <TouchableOpacity
          style={styles.categoryChip}
          onPress={() => setShowNewCategoryInput(true)}
        >
          <Text style={styles.categoryChipText}> + </Text>
        </TouchableOpacity>
      );
    }
    if (item.type === 'trash') {
      return (
        <TouchableOpacity
          style={styles.categoryChip}
          onPress={() =>
            Alert.alert(
              'Clear Categories',
              'Are you sure you want to clear all user added categories?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', onPress: clearUserCategories },
              ]
            )
          }
        >
          <Trash2 style={styles.categoryChipText} width={16} height={16} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          category === item.name && styles.selectedCategoryChip,
        ]}
        onPress={() => {
          setCategory(item.name);
          setNewCategory('');
          setShowNewCategoryInput(false);
        }}
      >
        <Text
          style={[
            styles.categoryChipText,
            category === item.name && styles.selectedCategoryChipText,
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.modalShadow]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {type === 'expense' ? 'Add Expense' : 'Add Income'}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Set Amount</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#999"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <Text style={styles.sectionTitle}>Category</Text>
            <FlatList
              data={categoryData}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderCategoryItem}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            />

            {showNewCategoryInput && (
              <TextInput
                style={styles.newCategoryInput}
                placeholder="Enter new category"
                placeholderTextColor="#aaa"
                value={newCategory}
                onChangeText={setNewCategory}
                onSubmitEditing={Keyboard.dismiss}
              />
            )}
            <Text style={styles.sectionTitle}>Desciption</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add description (optional)"
              placeholderTextColor="#aaa"
              value={description}
              onChangeText={setDescription}
              multiline
              blurOnSubmit={true}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  onClose();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={saveTransaction}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
  },
  modalShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'center'
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    alignSelf: 'center'
  },
  amountInput: {
    fontSize: 32,
    textAlign: 'center',
    color: '#333',
    borderBottomWidth: 2,
    borderBottomColor: '#FE79A1',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#FE79A1',
  },
  categoryChipText: {
    color: '#666',
    fontSize: 14,
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  newCategoryInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#FE79A1',
  },
  buttonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddTransactionModal;
