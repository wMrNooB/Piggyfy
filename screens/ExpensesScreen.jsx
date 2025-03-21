import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Rect } from 'react-native-svg';
import AddTransactionModal from './AddTransactionModal';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const screenWidth = Dimensions.get('window').width;

const ExpensesScreen = () => {
  const [expenses, setExpenses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch expense transactions
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'transactions'),
        where('type', '==', 'expense'),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [])
  );

  const sanitizedData = expenses.map(item => {
    const amt = Number(item.amount);
    return isFinite(amt) ? amt : 0;
  });

  const chartLabels = expenses.map(item => {
    const date = new Date(item.date);
    return isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const totalExpenses = sanitizedData.reduce((sum, value) => sum + value, 0);

  // Group expenses by category
  const groupExpensesByCategory = () => {
    const groups = {};
    expenses.forEach(tx => {
      const category = tx.category || 'Other';
      const amt = Number(tx.amount);
      if (isFinite(amt)) {
        groups[category] = (groups[category] || 0) + amt;
      }
    });
    return groups;
  };

  const expensesByCategory = groupExpensesByCategory();
  const orderedCategories = Object.keys(expensesByCategory);
  const barChartData = orderedCategories.map(cat => expensesByCategory[cat]);
  const barChartLabels = orderedCategories;
  const barChartWidth = Math.max(screenWidth - 32, orderedCategories.length * 80);


  const vibrantColors = [
    '#6050DC',
    '#D52DB7',
    '#FF2E7E',
    '#FF6B45',
    '#FFAB05',
    '#50C878',
    '#6EC6FF',
    '#A479E7',
    '#FF85C2',
    '#FFB347'
  ];
  const legendData = orderedCategories.map((cat, idx) => {
    const amt = expensesByCategory[cat];
    const percentage = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
    return { category: cat, percentage, color: vibrantColors[idx % vibrantColors.length] };
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={'#FE79A1'} />
          </View>
        ) : (
          <>

            {sanitizedData.length > 0 ? (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Expenses Over Time</Text>
                <Text style={styles.yAxisLabel}>Amount in (EUR)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={{
                      labels: chartLabels,
                      datasets: [
                        {
                          data: sanitizedData,
                          color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // red line
                          strokeWidth: 2,
                        },
                      ],
                    }}
                    width={Math.max(screenWidth - 32, chartLabels.length * 60)}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 2,
                      color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: { borderRadius: 16 },
                      propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: "#dc3545",
                      },
                      fillShadowGradientFrom: "#dc3545",
                      fillShadowGradientTo: "#fff",
                    }}
                    bezier
                    style={styles.chart}
                  />
                </ScrollView>
              </View>
            ) : (
              <View style={[styles.chartCard, styles.cardShadow]}>
                <Text style={styles.chartTitle}>Expenses Over Time</Text>
                <Text style={styles.noDataText}>No expense data available</Text>
              </View>
            )}

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Expenses</Text>
              <Text style={styles.balanceAmount}>EUR {totalExpenses.toFixed(2)}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.addButtonText}>+ Add Expense</Text>
              </TouchableOpacity>
            </View>

            {barChartData.length > 0 ? (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Expenses Distribution</Text>
                <Text style={styles.yAxisLabel}>Amount in (EUR)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={{
                      labels: barChartLabels,
                      datasets: [{ data: barChartData }],
                    }}
                    width={barChartWidth}
                    height={220}
                    fromZero
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 2,
                      propsForBackgroundLines: {
                        stroke: '#D3D3D3',
                      },
                      color: (opacity = 1) => '#FE79A1',
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: { borderRadius: 16 },
                      barPercentage: 1.0,
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars
                    renderBar={({ index, x, y, width, height }) => {
                      const thicknessMultiplier = 1.5;
                      const newWidth = width * thicknessMultiplier;
                      const newX = x - (newWidth - width) / 2;
                      return (
                        <Rect
                          key={`bar-${index}`}
                          x={newX}
                          y={y}
                          width={newWidth}
                          height={height}
                          fill={'#FE79A1'}
                        />
                      );
                    }}
                  />
                </ScrollView>
                
                <View style={styles.legendContainer}>
                  {legendData.map(item => (
                    <View key={item.category} style={styles.legendItem}>
                      <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
                      <Text style={styles.legendText}>
                        {item.category}: {item.percentage.toFixed(0)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={[styles.chartCard, styles.cardShadow]}>
                <Text style={styles.chartTitle}>Expenses Distribution</Text>
                <Text style={styles.noDataText}>No expense data available</Text>
              </View>
            )}
          </>
        )}
        <AddTransactionModal 
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            fetchExpenses();
          }}
          type="expense"
        />
      </ScrollView>
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
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'left',
    marginBottom: 4,
    width: '100%',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  balanceCard: {
    backgroundColor: '#FE79A1',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FE79A1',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 4,
  },
  legendColorBox: {
    width: 14,
    height: 14,
    marginRight: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
});

export default ExpensesScreen;
