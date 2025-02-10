import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';


const { width } = Dimensions.get('window');

export default function OnBoardingScreen2({navigation}) {
  return (
    <View style={styles.container}>
    <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('Wallet')}>
      <Text style={styles.skipText}>Skip</Text>
    </TouchableOpacity>

    <View style={styles.imageContainer}>
      <Image
        source={require('../assets/piggy.jpg')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>

    <View style={styles.textContainer}>
      <Text style={styles.title}>Budgeting Made Simple</Text>
      <Text style={styles.description}>
        We help you categorize your spending, identify areas to save, and stay on top of your financial goals.
      </Text>
    </View>

    <View style={styles.bottomContainer}>
      <View style={styles.indicatorContainer}>
        <View style={[styles.indicator, { backgroundColor: '#E0E0E0' }]} />
        <View style={[styles.indicator, { backgroundColor: '#FE79A1' }]} />
        <View style={[styles.indicator, { backgroundColor: '#E0E0E0' }]} />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('OnBoarding3')}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  </View>
);
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    skipButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      zIndex: 1,
    },
    skipText: {
      fontSize: 16,
      color: '#666',
    },
    imageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
    },
    image: {
      width: width * 0.6,
      height: width * 0.6,
    },
    textContainer: {
      paddingHorizontal: 40,
      alignItems: 'center',
      marginBottom: 70,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
    },
    description: {
      fontSize: 16,
      textAlign: 'center',
      color: '#666',
      lineHeight: 24,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      color: '#666',
      marginTop: 10,
      lineHeight: 24,
    },
    bottomContainer: {
      paddingBottom: 40,
    },
    indicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 40,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    button: {
      backgroundColor: '#FE79A1',
      marginHorizontal: 20,
      paddingVertical: 15,
      borderRadius: 8,
    },
    buttonText: {
      color: 'white',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
  });