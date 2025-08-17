import { StatusBar } from 'react-native';
import * as Font from 'expo-font';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useEffect, useState } from 'react';

import Home from './src/pages/home';
import Registro from './src/pages/registro';
import Futuro from './src/pages/futuro';
import Relatorio from './src/pages/relatorio';
import { AppProvider } from './src/context/appContext';
import LoginScreen from './src/pages/login';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

  const Theme = {
    ...DefaultTheme,
    colors: {
      theme: '#fff',
      contra_theme:'#000',
      background: '#f3f3f3',
      receita: '#457f79',
      despesa: '#c54343',
    },
  };

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: 110 },
        tabBarActiveTintColor: Theme.colors.contra_theme,
        tabBarInactiveTintColor: Theme.colors.contra_theme + '3' ,
        tabBarIndicatorStyle: { backgroundColor: Theme.colors.contra_theme + '5', height: 1 },
        tabBarStyle: { backgroundColor: Theme.colors.theme },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: 'FEITO' }} />
      <Tab.Screen name="Futuro" component={Futuro} options={{ title: 'FUTURO' }} />
      <Tab.Screen name="Registro" component={Registro} options={{ title: 'REGISTRAR' }} />
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



  // Carrega a fonte personalizada
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Raleway-Regular': require('./assets/fonts/Raleway-Regular.ttf'),
        'Raleway-Bold': require('./assets/fonts/Raleway-Bold.ttf'),
        'Raleway-Thin': require('./assets/fonts/Raleway-Thin.ttf'),
        'Raleway-Light': require('./assets/fonts/Raleway-Light.ttf'),
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



  return (
    <NavigationContainer theme={Theme}>
      <StatusBar backgroundColor={Theme.colors.theme} barStyle={'dark-content'} />
      <AppProvider>
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerStyle: {
              backgroundColor: Theme.colors.theme,
            },
            headerTitleAlign:'center',
            headerTitleStyle: {
              fontSize: 17,
            },
            headerTintColor: Theme.colors.contra_theme,
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
            options={{ title: 'Tesouraria PSH', headerShadowVisible: false }}
          />
         
        </Stack.Navigator>
      </AppProvider>
    </NavigationContainer>
  );
}