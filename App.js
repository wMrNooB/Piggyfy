import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import OnBoardingScreen from './screens/OnBoardingScreen';
import OnBoardingScreen2 from './screens/OnBoardingScreen2';
import OnBoardingScreen3 from './screens/OnBoardingScreen3';
import WalletScreen from './screens/WalletScreen';
import MainTabNavigator from './MainTabNavigator';
import UserScreen from './screens/UserScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="OnBoarding"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'white' }
        }}
      >
        <Stack.Screen name="OnBoarding" component={OnBoardingScreen} />
        <Stack.Screen name="OnBoarding2" component={OnBoardingScreen2} />
        <Stack.Screen name="OnBoarding3" component={OnBoardingScreen3} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="User" component={UserScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
