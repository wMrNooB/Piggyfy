import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Minus, Clipboard } from 'react-native-feather';
import AddTransactionModal from './AddTransactionModal';
import SpendingLimitModal from './SpendingLimitModal';
import Toast from 'react-native-toast-message';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const HomeScreen = ({ navigation }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [error, setError] = useState(null);
  const [spendingLimit, setSpendingLimit] = useState(null);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [spendingModalVisible, setSpendingModalVisible] = useState(false);
  const [notifiedHalf, setNotifiedHalf] = useState(false);
  const [notified80, setNotified80] = useState(false);
  const [notifiedExceeded, setNotifiedExceeded] = useState(false); 
  

  const fetchWallet = async () => {
    try {
      const walletSnapshot = await getDocs(collection(db, 'wallets'));
      if (!walletSnapshot.empty) {
        const walletData = walletSnapshot.docs[0].data();
        setWallet({ id: walletSnapshot.docs[0].id, ...walletData });
        setBalance(walletData.balance);
        setError(null);
      } else {
        setError('No wallet found. Please set up your wallet.');
      }
    } catch (error) {
      setError('Failed to fetch wallet data. Please try again later.');
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const txSnapshot = await getDocs(q);
      const txs = txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txs);
      setError(null);
    } catch (error) {
      setError('Failed to fetch transactions. Please try again later.');
      console.error('Error fetching transactions:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
      fetchTransactions();
    }, [])
  );
  
  useEffect(() => {
    setNotifiedHalf(false);
    setNotified80(false);
    setNotifiedExceeded(false);
  }, [spendingLimit]);

  useEffect(() => {
    if (spendingLimit) {
      const ratio = expenseTotal / spendingLimit.amount;
  
      if (ratio >= 1 && !notifiedExceeded) {
        Toast.show({
          type: 'error',
          text1: "You've exceeded your spending limit.",
          text2: `You've spent ${expenseTotal.toFixed(2)} which is over your limit of ${spendingLimit.amount.toFixed(2)}.`,
          position: 'top',
          topOffset: 50,
          visibilityTime: 3000,
        });
        setNotifiedExceeded(true);
      } else if (ratio >= 0.8 && !notified80) {
        Toast.show({
          type: 'warn',
          text1: "You're almost at your spending limit.",
          text2: `Your spending is near the limit, Watch your spending!`,
          position: 'top',
          topOffset: 50,
          visibilityTime: 3000,
        });
        setNotified80(true);
      } else if (ratio >= 0.5 && !notifiedHalf) {
        Toast.show({
          type: 'info',
          text1: "You've reached 50% of your spending limit!",
          text2: `You've used half of your budget`,
          position: 'top',
          topOffset: 50,
          visibilityTime: 3000,
        });
        setNotifiedHalf(true);
      }
    }
  }, [expenseTotal, spendingLimit]);
  
  

  useEffect(() => {
    if (wallet) {
      const totalIncome = getTotalIncome();
      const totalExpenses = getTotalExpenses();
      const newBalance = wallet.balance + totalIncome - totalExpenses;
      setBalance(newBalance);
    }
  }, [wallet, transactions]);

  const getTotalExpensesForLimit = (limit) => {
    const computedThreshold = new Date(limit.startDate).getTime();
    const setAtThreshold = new Date(limit.setAt).getTime();
    const threshold = Math.max(computedThreshold, setAtThreshold);
    return transactions
      .filter(t =>
        t.type === 'expense' &&
        t.category === limit.category.name &&
        new Date(t.date).getTime() >= threshold
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };
  

  useEffect(() => {
    if (spendingLimit) {
      const total = getTotalExpensesForLimit(spendingLimit);
      setExpenseTotal(total);
    }
  }, [transactions, spendingLimit]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const groupTransactionsByDate = () => {
    const groups = {};
    [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((transaction) => {
        const date = formatDate(transaction.date);
        if (!groups[date]) groups[date] = [];
        groups[date].push(transaction);
      });
    return groups;
  };

  const formatCurrency = (amount) => {
    return `${wallet?.currency} ${Number(amount).toFixed(2)}`;
  };

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const getColorForLimit = () => {
    if (!spendingLimit) return '#000';
    const ratio = expenseTotal / spendingLimit.amount;
    if (ratio < 0.5) return '#4CAF50';
    if (ratio < 0.8) return 'orange';
    return 'red';
  };
  const getSpentColor = () => {
    if (!spendingLimit) return '#000';
    const ratio = expenseTotal / spendingLimit.amount;
    if (ratio < 0.5) return '#4CAF50';
    if (ratio < 0.8) return '#f39c12'; 
    return 'red';
  };
  
  const getLeftColor = () => {
    if (!spendingLimit) return '#000';
    const ratio = expenseTotal / spendingLimit.amount;
    if (ratio < 0.5) return '#2196F3'; 
    if (ratio < 1) return '#9b59b6'; 
    return 'black'; 
  };
  

  const handleSaveSpendingLimit = (limitData) => {
    setSpendingLimit(limitData);
    const total = getTotalExpensesForLimit(limitData);
    setExpenseTotal(total);
  };
  

  const calculateProgress = () => {
    if (!spendingLimit || spendingLimit.amount === 0) return 0;
    return Math.min((expenseTotal / spendingLimit.amount) * 100, 100);
  };

  const renderTransactionItem = (transaction) => {
    const isExpense = transaction.type === 'expense';
    const Icon = isExpense ? Minus : Plus;
    
    return (
      <View key={transaction.id} style={styles.transactionItem}>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionCategory}>{transaction.category}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Icon 
            stroke={isExpense ? '#FF5252' : '#4CAF50'} 
            width={16} 
            height={16} 
            style={styles.amountIcon}
          />
          <Text style={[styles.transactionAmount, { 
            color: isExpense ? '#FF5252' : '#4CAF50',
            fontWeight: '700'
          }]}>
            {formatCurrency(transaction.amount)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTransactionsList = () => {
    if (error) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (transactions.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No transactions yet</Text>
          <Text style={styles.emptyStateSubtext}>Your transactions will appear here</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.transactionsList}>
        {Object.entries(groupTransactionsByDate()).map(([date, dayTransactions]) => (
          <View key={date}>
            <Text style={styles.dateHeader}>{date}</Text>
            {dayTransactions.map(renderTransactionItem)}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.balanceCard, styles.cardShadow]}>
        <Text style={styles.balanceLabel}>Net Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
      </View>

      <View style={styles.topRowCards}>
        <TouchableOpacity
          style={[styles.card, styles.incomeCard, styles.halfCard, styles.cardShadow]}
          onPress={() => {
            setTransactionType('income');
            setIsModalVisible(true);
          }}>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Income</Text>
            <Text style={styles.cardAmount}>{formatCurrency(getTotalIncome())}</Text>
            <View style={styles.addButtonRow}>
              <View style={[styles.addButton, styles.greenCircle]}>
                <Plus stroke="#fff" width={15} height={15} />
              </View>
              <Text style={[styles.addButtonText, { color: '#4CAF50' }]}>Add Income</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.expenseCard, styles.halfCard, styles.cardShadow]}
          onPress={() => {
            setTransactionType('expense');
            setIsModalVisible(true);
          }}>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Expenses</Text>
            <Text style={styles.cardAmount}>{formatCurrency(getTotalExpenses())}</Text>
            <View style={styles.addButtonRow}>
              <View style={[styles.addButton, styles.redCircle]}>
                <Minus stroke="#fff" width={15} height={15} />
              </View>
              <Text style={[styles.addButtonText, { color: '#FF5252' }]}>Add Expense</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <AddTransactionModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          fetchTransactions();
        }}
        type={transactionType}
      />

      <TouchableOpacity
        style={[styles.card, styles.budgetCard, styles.cardShadow]}
        onPress={() => setSpendingModalVisible(true)}
      >
       <View style={styles.cardContent}>
        <Text style={styles.cardLabel}>Spending Limit</Text>
         {spendingLimit ? (
          <>
        <Text style={[styles.cardAmount, { color: getColorForLimit() }]}>
          {formatCurrency(spendingLimit.amount)}
        </Text>
        <Text style={styles.categoryText}>
          {spendingLimit.category.name}
        </Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${calculateProgress()}%`,
                backgroundColor: getColorForLimit(),
              },
            ]}
          />
        </View>
        <View style={styles.limitDetails}>
          <Text style={[styles.limitDetailText, {color: getSpentColor()}]}>
            {formatCurrency(expenseTotal)} spent
          </Text>
          <Text style={[styles.limitDetailText, {color : getLeftColor()}]}>
            {formatCurrency(spendingLimit.amount - expenseTotal)} left
          </Text>
        </View>
       </>
      ) : (
        <Text style={styles.cardAmount}>Not Set</Text>
      )}
      <View style={styles.addButtonRow}>
        <View style={[styles.addButton, styles.blueCircle]}>
          <Clipboard stroke="#fff" width={12} height={12} />
          </View>
            <Text style={[styles.addButtonText, { color: '#2196F3' }]}>
             {spendingLimit ? 'Edit Limit' : 'Set Limit'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <SpendingLimitModal
        visible={spendingModalVisible}
        onClose={() => setSpendingModalVisible(false)}
        onSave={handleSaveSpendingLimit}
      />

      <View style={[styles.transactionsContainer, styles.cardShadow]}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeMoreText}>See More</Text>
          </TouchableOpacity>
        </View>
        {renderTransactionsList()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  balanceCard: {
    backgroundColor: '#FE79A1',
    padding: 20,
    margin: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: '#FE79A1',
    paddingTop: 8,
  },
  activeNavText: {
    color: '#FE79A1',
    fontWeight: '500',
  },
  navItem: {
    alignItems: 'center',
    paddingTop: 10,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  cardsSection: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  topRowCards: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 5,
  },
  halfCard: {
    flex: 1,
  },
  expenseAmount: {
    color: '#FF5252',
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  cardContent: {
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  periodText: {
    fontSize: 14,
    color: '#555',
  },
  expenseText: {
    fontSize: 12,
    marginBottom: 4,
  },
  greenCircle: {
    backgroundColor: '#4CAF50',
  },
  redCircle: {
    backgroundColor: '#FF5252',
  },
  blueCircle: {
    backgroundColor: '#2196F3',
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  budgetCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    marginHorizontal: 16,
  },
  transactionsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeMoreText: {
    fontSize: 14,
    color: '#FE79A1',
    fontWeight: '500',
  },
  dateHeader: {
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'black',
    marginVertical: 4,
  },
  progressBarContainer: {
    width: '80%',
    height: 3,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginVertical: 4,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  limitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    alignSelf: 'center',
    marginTop: 4,
  },
  limitDetailText: {
    fontWeight:'bold',
    fontSize: 14,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountIcon: {
    marginRight: 4,
  },
  transactionDate: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  transactionIconAndCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendIcon: {
    marginRight: 8,
  },
  transactionCategory: {
    fontSize: 16,
    color: '#333',
  },
});

export default HomeScreen;
