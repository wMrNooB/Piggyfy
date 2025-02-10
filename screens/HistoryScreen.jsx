import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, TextInput, Animated, Modal, TouchableWithoutFeedback } from 'react-native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Search, List, ChevronDown, TrendingDown, TrendingUp } from 'react-native-feather';
import { db } from '../firebaseConfig';

const { width } = Dimensions.get('window');

const HistoryScreen = () => {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]);
  const [filterOption, setFilterOption] = useState('date');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const searchAnimation = new Animated.Value(0);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const toggleSearch = () => {
    const toValue = isSearchActive ? 0 : 1;
    setIsSearchActive(!isSearchActive);
    Animated.spring(searchAnimation, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 50
    }).start();
  };

  const fetchTransactions = async () => {
    try {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const txs = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setTransactions(txs);
    } catch (error) {
      console.error("Error fetching transactions: ", error);
    }
  };

  const groupTransactions = () => {
    const filteredTransactions = searchQuery.trim() !== ''
      ? transactions.filter(tx => 
          tx.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : transactions;

    if (filterOption === 'date') {
      const groups = {};
      filteredTransactions.forEach(tx => {
        const dateStr = isNaN(new Date(tx.date).getTime())
          ? 'Invalid Date'
          : new Date(tx.date).toLocaleDateString();
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(tx);
      });
      return Object.entries(groups);
    } else {
      return Object.entries({
        income: filteredTransactions.filter(tx => tx.type === 'income'),
        expense: filteredTransactions.filter(tx => tx.type === 'expense')
      });
    }
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionCardWrapper}>
      <View style={[
        styles.transactionCard,
        item.type === 'expense' ? styles.expenseCard : styles.incomeCard
      ]}>
        <View style={styles.transactionLeft}>
          <View style={[
            styles.categoryIcon,
            { backgroundColor: item.type === 'expense' ? '#FFE5E5' : '#E5FFE5' }
          ]}>
            {item.type === 'expense' ? (
              <TrendingDown stroke="#FF5252" width={16} height={16} />
            ) : (
              <TrendingUp stroke="#4CAF50" width={16} height={16} />
            )}
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.categoryText}>{item.category}</Text>
            {item.description ? (
              <Text style={styles.descriptionText}>{item.description}</Text>
            ) : null}
            <Text style={styles.dateText}>
              {isNaN(new Date(item.date).getTime())
                ? 'Invalid Date'
                : new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Text style={[
          styles.amountText,
          item.type === 'expense' ? styles.expenseAmount : styles.incomeAmount
        ]}>
          {item.type === 'expense' ? '-' : '+'}{Number(item.amount).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const renderGroupedTransactions = ({ item }) => {
    const [groupTitle, groupItems] = item;
    return (
      <View style={styles.groupContainer}>
        <Text style={styles.groupHeader}>
          {filterOption === 'type' 
            ? (groupTitle === 'income' ? 'INCOME' : 'EXPENSES')
            : groupTitle}
        </Text>
        {groupItems.map((transaction, txIndex) => (
          <View key={`${groupTitle}-${transaction.id}-${txIndex}`}>
            {renderTransactionItem({ item: transaction })}
          </View>
        ))}
      </View>
    );
  };
  const FilterMenu = () => (
    <Modal
      transparent
      visible={isFilterMenuOpen}
      onRequestClose={() => setIsFilterMenuOpen(false)}
      animationType="fade"
    >
      <TouchableWithoutFeedback onPress={() => setIsFilterMenuOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.filterMenu}>
            <TouchableOpacity 
              style={[
                styles.filterOption,
                filterOption === 'date' && styles.selectedFilterOption
              ]}
              onPress={() => {
                setFilterOption('date');
                setIsFilterMenuOpen(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                filterOption === 'date' && styles.selectedFilterText
              ]}>Date</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterOption,
                filterOption === 'type' && styles.selectedFilterOption
              ]}
              onPress={() => {
                setFilterOption('type');
                setIsFilterMenuOpen(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                filterOption === 'type' && styles.selectedFilterText
              ]}>Type</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>No transactions found</Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery ? 'Try a different search term' : 'Your transaction history will appear here'}
      </Text>
    </View>
  );

  const searchWidth = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width - 80]
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {!isSearchActive ? (
          <>
            <Text style={styles.screenTitle}>Transaction History</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={toggleSearch}
                style={styles.iconButton}
              >
                <Search stroke="#FD79A1" width={20} height={20} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsFilterMenuOpen(true)}
                style={[styles.iconButton, styles.filterIconButton]}
              >
                <List stroke="#FD79A1" width={20} height={20} />
                <Text style={styles.selectedFilter}>
                  {filterOption === 'date' ? 'Date' : 'Type'}
                </Text>
                <ChevronDown stroke="#FD79A1" width={14} height={14} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.searchHeaderContainer}>
            <Animated.View style={[styles.searchContainer, { width: searchWidth }]}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search transactions..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </Animated.View>
            <TouchableOpacity 
              onPress={toggleSearch}
              style={styles.iconButton}
            >
              <Search stroke="#FD79A1" width={20} height={20} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FilterMenu />

      {transactions.length > 0 ? (
        <FlatList
          data={groupTransactions()}
          renderItem={renderGroupedTransactions}
          keyExtractor={(item, index) => `group-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333'
  },
  iconButton: {
    marginHorizontal: 1,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFF5F8'
  },
  searchContainer: {
    flex: 1
  },
  searchHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8
  },
  searchInput: {
    height: 36,
    backgroundColor: '#FFF5F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#333',
    fontSize: 15
  },
  filterIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8
  },
  selectedFilter: {
    color: '#FD79A1',
    fontSize: 13,
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 110,
    paddingRight: 20
  },
  filterMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 6,
    width: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterOption: {
    padding: 10,
    borderRadius: 6,
  },
  selectedFilterOption: {
    backgroundColor: '#FFF5F8',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedFilterText: {
    color: '#FD79A1',
    fontWeight: '500',
  },
  filterIndicator: {
    backgroundColor: '#FFF5F8',
    paddingVertical: 8,
    paddingHorizontal: 20
  },
  filterText: {
    color: '#FD79A1',
    fontSize: 14,
    fontWeight: '600'
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100
  },
  groupContainer: {
    marginBottom: 20
  },
  groupHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginLeft: 4
  },
  transactionCardWrapper: {
    marginBottom: 12
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    height: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#FF5252'
  },
  incomeCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#4CAF50'
  },
  transactionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  descriptionContainer: {
    height: 20,
    justifyContent: 'center'
  },
  descriptionText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  expenseAmount: {
    color: '#FF5252'
  },
  incomeAmount: {
    color: '#4CAF50'
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999'
  }
});

export default HistoryScreen;