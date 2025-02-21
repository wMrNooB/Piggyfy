import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, Alert, 
  ScrollView, Keyboard, TouchableWithoutFeedback 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERIODS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Custom', value: 'custom' },
];

const SpendingLimitModal = ({ visible, onClose, onSave }) => {
  const [limitAmount, setLimitAmount] = useState('');
  const [limitDate, setLimitDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const type = 'expense';
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
    loadCategories();
  }, [visible]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const computeStartDate = () => {
    const now = new Date();
    if (period === 'daily') {
      now.setHours(0, 0, 0, 0);
      return now;
    } else if (period === 'weekly') {
      const day = now.getDay();
      const diff = now.getDay() === 0 ? 6 : now.getDay() - 1;
      now.setDate(now.getDate() - diff);
      now.setHours(0, 0, 0, 0);
      return now;
    } else if (period === 'monthly') {
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      return now;
    } else {
      return limitDate;
    }
  };

  const handleSave = () => {
    const amount = parseFloat(limitAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid limit amount.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category.');
      return;
    }
    const startDate = computeStartDate(); 
    const spendingLimit = {
      amount,
      startDate,
      category: selectedCategory,
      period,
      setAt: new Date().toISOString(),
    };
    onSave(spendingLimit);
    setLimitAmount('');
    setLimitDate(new Date());
    setSelectedCategory(null);
    setPeriod('daily');
    onClose();
  };
  

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Spending Limit</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Limit Amount</Text>
              <View style={styles.amountContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={limitAmount}
                  onChangeText={setLimitAmount}
                  placeholderTextColor="#999"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            <Text style={styles.label}>Select Period:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.periodScrollView}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {PERIODS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.periodButton,
                    period === option.value && styles.selectedPeriodButton,
                  ]}
                  onPress={() => setPeriod(option.value)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    period === option.value && styles.selectedPeriodButtonText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {period === 'custom' && (
              <>
                <Text style={styles.label}>Select Date:</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <View style={styles.dateInput}>
                    <Text style={styles.dateText}>
                      {formatDate(limitDate) || 'dd/mm/yyyy'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={limitDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setLimitDate(selectedDate);
                    }}
                  />
                )}
              </>
            )}

            <Text style={styles.label}>Select Category:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScrollView}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory && selectedCategory.id === cat.id && styles.selectedCategoryButton,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory && selectedCategory.id === cat.id && styles.selectedCategoryButtonText,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FE79A1',
    paddingBottom: 8,
  },
  amountInput: {
    fontSize: 32,
    flex: 1,
    color: '#333',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  periodScrollView: {
    marginBottom: 20,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPeriodButton: {
    backgroundColor: '#FE79A1',
  },
  periodButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: 'white',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  categoryScrollView: {
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#FE79A1',
  },
  categoryButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

export default SpendingLimitModal;
