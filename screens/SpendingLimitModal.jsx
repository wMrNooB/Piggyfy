import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const PERIODS = [
  { label: 'Custom', value: 'custom' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const SpendingLimitModal = ({ visible, onClose, onSave }) => {
  const [limitAmount, setLimitAmount] = useState('');
  const [period, setPeriod] = useState('custom');
  const [customDate, setCustomDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSave = () => {
    const amount = parseFloat(limitAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid limit amount.');
      return;
    }
    const startDate = period === 'custom' ? customDate : new Date();
    const spendingLimit = { amount, period, startDate };
    onSave(spendingLimit);
    setLimitAmount('');
    setPeriod('weekly');
    setCustomDate(new Date());
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
              {PERIODS.map((periodOption) => (
                <TouchableOpacity
                  key={periodOption.value}
                  style={[
                    styles.periodButton,
                    period === periodOption.value && styles.selectedPeriodButton,
                  ]}
                  onPress={() => setPeriod(periodOption.value)}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      period === periodOption.value && styles.selectedPeriodButtonText,
                    ]}
                  >
                    {periodOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {period === 'custom' && (
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <View style={styles.customDateInput}>
                  <Text style={styles.customDateText}>
                    {formatDate(customDate) || 'dd/mm/yyyy'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={customDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setCustomDate(selectedDate);
                }}
              />
            )}
            
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
    alignSelf:'center'
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FE79A1',
    paddingBottom: 8,
  },
  currencyText: {
    fontSize: 32,
    color: '#333',
    marginRight: 4,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedPeriodButton: {
    backgroundColor: '#FE79A1',
    borderColor: '#FE79A1',
  },
  periodButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: 'white',
  },
  customDateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  customDateText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
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
