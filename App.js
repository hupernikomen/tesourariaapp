import { StatusBar, TouchableOpacity, View, Text } from 'react-native';
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
import Icone from './src/componentes/Icone';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

const Theme = {
  ...DefaultTheme,
  colors: {
    theme: '#fefefe',
    botao: '#fbfbfb',
    contra_theme: '#4c4a60ff',
    background: '#f5f5f3ff',
    receita: '#659f99',
    despesa: '#db5e5eff',
    alerta: '#E39B0E',
  },
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: false,
        tabBarActiveTintColor: Theme.colors.contra_theme,
        tabBarInactiveTintColor: '#ddd',
        tabBarStyle: { backgroundColor: Theme.colors.theme },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen name="Home" component={Home} options={{
        
              title:'FEED'
      }} />
      <Tab.Screen name="Futuro" component={Futuro} options={{
        title:'FUTURO'
      }} />
      <Tab.Screen name="Registro" component={Registro} options={{
        title:'REGISTRAR'
      }} />
      {/* <Tab.Screen
        name="Relatorio"
        component={Relatorio}
        options={{
          title:'RELATÓRIO'
        }}
      /> */}
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

  if (!fontsLoaded) {
    return null; // Ou um componente de loading
  }

  return (
    <NavigationContainer theme={Theme}>
      <StatusBar backgroundColor={Theme.colors.theme} barStyle={'dark-content'} />
      <AppProvider>
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={({ navigation, route }) => ({
            headerStyle: {
              backgroundColor: Theme.colors.theme,
            },
            headerTitleStyle: {
              fontFamily: 'Roboto-Bold',
              fontSize: 18
            },
            headerTintColor: Theme.colors.contra_theme,

          })}
        >
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={({ navigation }) => ({
              title: 'Tesouraria PSH', headerShadowVisible: false,
              headerLeft: () => {
                return (
                  <View style={{ paddingHorizontal: 7 }}>
                    <Icone nome={'leaf'} color={Theme.colors.receita} />
                  </View>
                )
              },
              headerRight: () => {
                return (
                  <TouchableOpacity onPress={() => navigation.navigate('Relatorio')} style={{ paddingHorizontal: 7 }}>
                    <Icone nome={'clipboard-outline'} size={22} />
                  </TouchableOpacity>
                )
              }
            })}
          />
          <Stack.Screen
            name="Registro"
            component={Registro}
            options={{ title: 'Criar Registro', headerShadowVisible: false }}
          />
          <Stack.Screen
            name="Relatorio"
            component={Relatorio}
            options={{ title: 'Relatório Financeiro', headerShadowVisible: false }}
          />

        </Stack.Navigator>
      </AppProvider>
    </NavigationContainer>
  );
}