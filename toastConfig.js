import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { AlertTriangle, AlertCircle, AlertOctagon } from 'react-native-feather';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  baseToast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: width - 32, // Full width minus margins
    marginHorizontal: 16,
    marginVertical: 8,
  },
  messageContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    opacity: 0.8,
  },
  // Theme-specific styles
  info: {
    backgroundColor: '#F8F9FF',
    borderColor: '#FF94B1', // Light pink to match your theme
  },
  warn: {
    backgroundColor: '#FFFAF4',
    borderColor: '#FFB463', // Warm orange
  },
  error: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF4646', // Bright red
  },
  infoText: {
    color: '#FF4B81', // Darker pink for text
  },
  warnText: {
    color: '#F29339', // Darker orange for text
  },
  errorText: {
    color: '#E53535', // Darker red for text
  },
});

const toastConfig = {
  info: ({ text1, text2 }) => (
    <View style={[styles.baseToast, styles.info]}>
      <AlertCircle stroke={styles.infoText.color} width={24} height={24} />
      <View style={styles.messageContainer}>
        <Text style={[styles.title, styles.infoText]}>{text1}</Text>
        {text2 && <Text style={[styles.message, styles.infoText]}>{text2}</Text>}
      </View>
    </View>
  ),
  warn: ({ text1, text2 }) => (
    <View style={[styles.baseToast, styles.warn]}>
      <AlertTriangle stroke={styles.warnText.color} width={24} height={24} />
      <View style={styles.messageContainer}>
        <Text style={[styles.title, styles.warnText]}>{text1}</Text>
        {text2 && <Text style={[styles.message, styles.warnText]}>{text2}</Text>}
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={[styles.baseToast, styles.error]}>
      <AlertOctagon stroke={styles.errorText.color} width={24} height={24} />
      <View style={styles.messageContainer}>
        <Text style={[styles.title, styles.errorText]}>{text1}</Text>
        {text2 && <Text style={[styles.message, styles.errorText]}>{text2}</Text>}
      </View>
    </View>
  ),
};

export default toastConfig;