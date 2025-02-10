import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const WalletScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [balance, setBalance] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const currencies = ['EUR', 'USD', 'MAD'];
  
useEffect(() => {
  const clearFirestoreData = async () => {
    try {
      const db = getFirestore();

      const collections = ["wallets", "transactions", "budgets"];

      for (const col of collections) {
        const querySnapshot = await getDocs(collection(db, col));

        for (const document of querySnapshot.docs) {
          await deleteDoc(doc(db, col, document.id));
        }
      }

      console.log("Firestore data cleared successfully.");
    } catch (error) {
      console.error("Error clearing Firestore data:", error);
    }
  };

  clearFirestoreData();
}, []);

  const toggleDropdown = () => {
    const toValue = isDropdownOpen ? 0 : 1;
    setIsDropdownOpen(!isDropdownOpen);
    Animated.spring(dropdownAnimation, {
      toValue,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  };

  const handleSelectCurrency = (selectedCurrency) => {
    setCurrency(selectedCurrency);
    toggleDropdown();
  };

  const createWallet = async () => {
    if (!name.trim() || !balance.trim()) {
      Alert.alert('Error', 'Please enter both wallet name and initial balance.');
      return;
    }
    const initialBalance = parseFloat(balance);
    if (isNaN(initialBalance)) {
      Alert.alert('Error', 'Please enter a valid number for balance.');
      return;
    }
    
    try {
      const docRef = await addDoc(collection(db, 'wallets'), {
        name,
        balance: initialBalance,
        currency,
        createdAt: new Date().toISOString(),
      });
      console.log('Wallet created with ID:', docRef.id);
      navigation.replace('Main');
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert('Error', 'There was an issue creating your wallet. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Wallet</Text>

      <TextInput
        style={styles.input}
        placeholder="Wallet Name"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />

      <View style={styles.balanceContainer}>
        <TextInput
          style={[styles.input, styles.balanceInput]}
          placeholder="Initial Balance"
          placeholderTextColor="#aaa"
          value={balance}
          onChangeText={setBalance}
          keyboardType="numeric"
        />
        <View style={styles.currencySelector}>
          <TouchableOpacity
            style={styles.currencyButton}
            onPress={toggleDropdown}
            activeOpacity={0.7}
          >
            <Text style={styles.currencyText}>{currency} ▼</Text>
          </TouchableOpacity>

          {isDropdownOpen && (
            <Animated.View
              style={[
                styles.dropdown,
                {
                  transform: [
                    {
                      translateY: dropdownAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                  opacity: dropdownAnimation,
                },
              ]}
            >
              {currencies.map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.dropdownItem,
                    curr === currency && styles.selectedItem,
                  ]}
                  onPress={() => handleSelectCurrency(curr)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      curr === currency && styles.selectedText,
                    ]}
                  >
                    {curr}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={createWallet}>
        <Text style={styles.buttonText}>Create Wallet</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    width: '100%',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    paddingVertical: 3,
    marginBottom: 20,
    width: '100%',
  },
  balanceInput: {
    flex: 1,
    marginRight: 10,
    fontSize: 16,
    borderWidth: 0,
    padding: 0,
    marginBottom: 0,
  },
  currencySelector: {
    position: 'relative',
    zIndex: 1,
  },
  currencyButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 80,
    marginTop: 4,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f8f9fa',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedText: {
    fontWeight: 'bold',
    color: '#FE79A1',
  },
  button: {
    backgroundColor: '#FE79A1',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WalletScreen;