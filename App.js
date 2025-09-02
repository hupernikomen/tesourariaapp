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
import Pagamento from './src/pages/pagamento';
import Lixeira from './src/pages/lixeira';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

const Theme = {
  ...DefaultTheme,
  colors: {
    theme: '#fefefe',
    botao: '#fbfbfb',
    contra_theme: '#4b4a56ff',
    background: '#f5f5f3ff',
    receita: '#598e88ff',
    despesa: '#db5e5eff',
    alerta: '#E39B0E',
  },
  font:{
    padrao: 'Roboto-Regular',
    fina: 'Roboto-Light',
    bold: 'Roboto-Medium'
  }
};

function TabNavigator() {
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarItemStyle: { width: 114,height:70 },
        tabBarScrollEnabled: true,
        tabBarIndicatorStyle: { backgroundColor: Theme.colors.background, height: 6 },
        tabBarActiveTintColor: Theme.colors.theme,
        tabBarInactiveTintColor: '#7aa49fff',
        tabBarStyle: { backgroundColor: Theme.colors.receita},
        tabBarLabelStyle: {
          fontFamily:Theme.font.bold
        },
      }}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: 'FEED' }} />
      <Tab.Screen name="Futuro" component={Futuro} options={{ title: 'FUTURO' }} />
      <Tab.Screen name="Registro" component={Registro} options={{ title: 'REGISTRAR' }} />
      <Tab.Screen name="Relatorio" component={Relatorio} options={{ title: 'RELATÓRIO' }} />
      <Tab.Screen name="Lixeira" component={Lixeira} options={{ title: 'LIXEIRA' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

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



  if (!fontsLoaded) {
    return null; 
  }

  return (
    <NavigationContainer theme={Theme}>
      <StatusBar backgroundColor={Theme.colors.receita} barStyle={'light-content'} />
      <AppProvider>
        <Stack.Navigator
          initialRouteName="LoginScreen"
          screenOptions={({ navigation, route }) => ({
            headerStyle: {
              backgroundColor: Theme.colors.receita,
            },
            headerTitleStyle: {
              fontFamily: 'Roboto-Medium',
              fontSize: 18,
            },
            headerTintColor: Theme.colors.botao,
          })}
        >
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Registro"
            component={Registro}
            options={{ title: 'Criar Registro', headerShadowVisible: false }}
          />
          <Stack.Screen
            name="Pagamento"
            component={Pagamento}
            options={{ title: 'Pagamento', headerShadowVisible: false }}
          />

          <Stack.Screen
            name="LoginScreen"
            component={LoginScreen}
            options={{ title: '', headerShown: false }}
          />
        </Stack.Navigator>
      </AppProvider>
    </NavigationContainer>
  );
}