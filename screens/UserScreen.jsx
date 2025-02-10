import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { collection, doc, getDocs, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { TrendingUp, TrendingDown } from 'react-native-feather';

const screenWidth = Dimensions.get('window').width;

const UserScreen = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const initialBalanceRef = useRef(null);

  const fetchWallet = async () => {
    try {
      const walletSnapshot = await getDocs(collection(db, 'wallets'));
      if (!walletSnapshot.empty) {
        const walletDoc = walletSnapshot.docs[0];
        const walletData = walletDoc.data();
        setWallet({ id: walletDoc.id, ...walletData });
        // If we haven't stored the initial balance yet, do so.
        if (initialBalanceRef.current === null) {
          initialBalanceRef.current = walletData.initialBalance !== undefined 
            ? Number(walletData.initialBalance) 
            : Number(walletData.balance);
        }
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const txQuery = query(
        collection(db, 'transactions'),
        orderBy('date', 'asc')
      );
      const txSnapshot = await getDocs(txQuery);
      const txs = txSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setTransactions(txs);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchWallet();
    await fetchTransactions();
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const computeCurrentBalance = () => {
    if (!wallet) return 0;
    const initBal = initialBalanceRef.current !== null ? initialBalanceRef.current : Number(wallet.balance);
    const netChange = transactions.reduce((sum, tx) => {
      const amt = Number(tx.amount);
      return tx.type === 'income' ? sum + amt : sum - amt;
    }, 0);
    return initBal + netChange;
  };

  const computeChartData = () => {
    if (!wallet) return;
    const initBal =
      initialBalanceRef.current !== null
        ? initialBalanceRef.current
        : Number(wallet.balance);
    if (transactions.length === 0) {
      setChartData({
        labels: ["Initial"],
        datasets: [
          {
            data: [initBal],
            color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      });
      return;
    }
    const sortedTxs = [...transactions].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const labels = [];
    const dataPoints = [];
    labels.push("Initial");
    dataPoints.push(initBal);
  
    sortedTxs.forEach((tx) => {
      const dateObj = new Date(tx.date);
      const amt = Number(tx.amount);
      const previousBalance = dataPoints[dataPoints.length - 1];
      const newBalance =
        previousBalance + (tx.type === "income" ? amt : -amt);
      dataPoints.push(newBalance);
      const label = dateObj.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });
      labels.push(label);
    });
    setChartData({
      labels,
      datasets: [
        {
          data: dataPoints,
          color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    });
  };
  

  useEffect(() => {
    if (wallet) {
      computeChartData();
    }
  }, [wallet, transactions]);

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

  const deleteWallet = async () => {
    Alert.alert(
      "Delete Wallet",
      "Are you sure you want to delete your wallet? This will clear all data.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'wallets', wallet.id));
              const txQuery = query(
                collection(db, 'transactions'),
                where('walletId', '==', wallet.id)
              );
              const txSnapshot = await getDocs(txQuery);
              txSnapshot.forEach(async (txDoc) => {
                await deleteDoc(doc(db, 'transactions', txDoc.id));
              });
              navigation.replace('Wallet');
            } catch (error) {
              console.error("Error deleting wallet:", error);
            }
          }
        }
      ]
    );
  };

  const currentBalance = computeCurrentBalance();
  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
      ) : wallet ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.welcomeCard, styles.cardShadow]}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.welcomeText}>Welcome, {wallet.name}!</Text>
              <Text style={styles.balanceLabel}>Net Balance</Text>
              <Text style={styles.balanceText}>
                {wallet?.currency || '$'} {currentBalance.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <TrendingUp stroke="#4CAF50" width={20} height={20} />
                </View>
                <View>
                  <Text style={styles.statLabel}>Income</Text>
                  <Text style={styles.incomeText}>
                    {wallet?.currency || '$'} {totalIncome.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <TrendingDown stroke="#FF5252" width={20} height={20} />
                </View>
                <View>
                  <Text style={styles.statLabel}>Expenses</Text>
                  <Text style={styles.expenseText}>
                    {wallet?.currency || '$'} {totalExpenses.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {chartData && (
            <View style={[styles.chartCard, styles.cardShadow]}>
              <Text style={styles.chartTitle}>Wallet Overview</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={chartData}
                  width={Math.max(screenWidth - 32, chartData.labels.length * 60)}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 2,
                    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: "#007bff",}
                    }}
                  bezier
                  style={styles.chart}
                />
              </ScrollView>
            </View>
          )}

          <View style={styles.recentActivityCard}>
            <View style={styles.recentActivityHeader}>
              <Text style={styles.recentActivityTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.seeMoreText}>See More</Text>
              </TouchableOpacity>
            </View>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.categoryIcon,
                      { backgroundColor: tx.type === 'expense' ? '#FFE5E5' : '#E5FFE5' }
                    ]}>
                      {tx.type === 'expense' ? (
                        <TrendingDown stroke="#FF5252" width={16} height={16} />
                      ) : (
                        <TrendingUp stroke="#4CAF50" width={16} height={16} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.transactionCategory}>{tx.category}</Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: tx.type === 'expense' ? '#FF5252' : '#4CAF50' }
                  ]}>
                    {tx.type === 'expense' ? '-' : '+'}{Number(tx.amount).toFixed(2)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No recent activity</Text>
            )}
          </View>

          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={deleteWallet}
          >
            <Text style={styles.deleteButtonText}>Delete Wallet</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <Text style={styles.noWalletText}>No wallet found.</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#FD79A1',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeHeader: {
    marginBottom: 24,
  },
  loadingContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: 300 
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    alignSelf: 'center'
  },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 4,
    alignSelf: 'center'
  },
  balanceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    alignSelf: 'center'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    flex: 0.48,
  },
  statIconContainer: {
    marginRight: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#000',
    opacity: 0.8,
    fontWeight: '500'
  },
  incomeText:{
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  expenseText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  recentActivityCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentActivityTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  seeMoreText: {
    fontSize: 14,
    color: '#FE79A1',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noWalletText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default UserScreen;
