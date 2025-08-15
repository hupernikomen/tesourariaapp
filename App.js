import { StatusBar } from 'react-native';
import * as Font from 'expo-font';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

import Home from './src/pages/home';
import AddImediato from './src/pages/registro';
import AddFuturo from './src/pages/futuro';
import Relatorio from './src/pages/relatorio';
import { AppProvider } from './src/context/appContext';
import ImgDoc from './src/pages/detalhes/ImgDoc';
import LoginScreen from './src/pages/login';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: 110 },
        tabBarActiveTintColor: '#222',
        tabBarInactiveTintColor: '#ddd',
        tabBarIndicatorStyle: { backgroundColor: '#777', height: 1.5 },
        tabBarStyle: { backgroundColor: '#fff' },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: 'FEITO' }} />
      <Tab.Screen name="Futuro" component={AddFuturo} options={{ title: 'FUTURO' }} />
      <Tab.Screen name="AddRegistros" component={AddImediato} options={{ title: 'REGISTRAR' }} />
      <Tab.Screen
        name="Relatorio"
        component={Relatorio}
        options={{ headerShadowVisible: false, title: 'RELATÓRIO' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const Theme = {
    ...DefaultTheme,
    colors: {
      theme: '#f3f3f3',
      background: '#f3f3f3',
      positivo: '#659f99ff',
      negativo: '#C43302',
      posfraco: '#93c47d70',
      negfraco: '#9E9365',
    },
  };

  // Carrega a fonte personalizada
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Raleway-Regular': require('./assets/fonts/Raleway-Regular.ttf'),
        'Raleway-Bold': require('./assets/fonts/Raleway-Bold.ttf'),
        'Raleway-Thin': require('./assets/fonts/Raleway-Thin.ttf'),
        'Raleway-Light': require('./assets/fonts/Raleway-Light.ttf'),
        'Montserrat-Regular': require('./assets/fonts/Montserrat-Regular.ttf'),
        'Montserrat-Bold': require('./assets/fonts/Montserrat-Bold.ttf'),
        'Montserrat-Thin': require('./assets/fonts/Montserrat-Thin.ttf'),
        'Montserrat-Light': require('./assets/fonts/Montserrat-Light.ttf'),
        'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
        'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),
        'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
        'Roboto-Thin': require('./assets/fonts/Roboto-Thin.ttf'),
        'Roboto-Light': require('./assets/fonts/Roboto-Light.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // Exibe um componente de carregamento enquanto as fontes não estão prontas
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#659f99" />
        <Text>Carregando fontes...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={Theme}>
      <StatusBar backgroundColor={'#fff'} barStyle={'dark-content'} />
      <AppProvider>
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTitleStyle: {
              fontSize: 19,
              fontFamily: 'Raleway-Bold', // Usa a fonte carregada no cabeçalho
            },
            headerTintColor: '#222',
          }}
        >
          <Stack.Screen
            name="LoginScreen"
            component={LoginScreen}
            options={{
              headerShadowVisible: false,
              title: '',
              headerTransparent: true,
              headerStyle: { backgroundColor: 'transparent' },
              headerTintColor: '#659f99ff',
            }}
          />
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ title: 'Financeiro PSH', headerShadowVisible: false }}
          />
          <Stack.Screen
            name="ImgDoc"
            component={ImgDoc}
            options={{
              headerShadowVisible: false,
              title: '',
              headerTransparent: true,
              headerStyle: { backgroundColor: 'transparent' },
              headerTintColor: '#659f99ff',
            }}
          />
        </Stack.Navigator>
      </AppProvider>
    </NavigationContainer>
  );
}