import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import ExpensesScreen from './screens/ExpensesScreen';
import IncomeScreen from './screens/IncomeScreen';
import UserScreen from './screens/UserScreen';
import { Home, Clock, TrendingUp, TrendingDown, User } from 'react-native-feather';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return <Home stroke={focused ? '#FE79A1' : '#999'} width={size} height={size} />;
          } else if (route.name === 'History') {
            return <Clock stroke={focused ? '#FE79A1' : '#999'} width={size} height={size} />;
          } else if (route.name === 'Income') {
            return <TrendingUp stroke={focused ? '#FE79A1' : '#999'} width={size} height={size} />;
          } else if (route.name === 'Expenses') {
            return <TrendingDown stroke={focused ? '#FE79A1' : '#999'} width={size} height={size} />;
          } else if (route.name === 'User') {
            return <User stroke={focused ? '#FE79A1' : '#999'} width={size} height={size} />;
          }
        },
        tabBarActiveTintColor: '#FE79A1',
        tabBarInactiveTintColor: '#999',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Income" component={IncomeScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="User" component={UserScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
