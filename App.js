import { StatusBar, TouchableOpacity, View } from 'react-native';
import * as Font from 'expo-font';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useEffect, useState } from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';

import Home from './src/pages/home';
import Registro from './src/pages/registro';
import Futuro from './src/pages/futuro';
import Relatorio from './src/pages/relatorio';
import { AppProvider } from './src/context/appContext';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

const Theme = {
  ...DefaultTheme,
  colors: {
    theme: '#fefefe',
    botao: '#fbfbfb',
    contra_theme: '#000',
    background: '#f3f3f3',
    receita: '#457f79',
    despesa: '#c54343',
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
        tabBarStyle: { backgroundColor: Theme.colors.theme, elevation: 0 },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: 'REGISTROS' }} />
      <Tab.Screen name="Futuro" component={Futuro} options={{ title: 'FUTURO', tabBarStyle: { backgroundColor: Theme.colors.theme, elevation: 5 } }} />
      {/* <Tab.Screen
        name="Relatorio"
        component={Relatorio}
        options={{ headerShadowVisible: false, title: 'RELATÓRIO' }}
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
              fontSize:20
            },
            headerTintColor: Theme.colors.contra_theme,
            headerRight: () =>
              route.name === 'Main' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                  <TouchableOpacity style={{ width: 45, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }} onPress={() => navigation.navigate('Registro')}>
                    <AntDesign name="addfile" size={20} color={Theme.colors.contra_theme} />
                  </TouchableOpacity>

                  <TouchableOpacity style={{ width: 45, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }} onPress={() => navigation.navigate('Relatorio')}>
                    <AntDesign name="profile" size={20} color={Theme.colors.contra_theme} />
                  </TouchableOpacity>
                </View>
              ) : null,
          })}
        >
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ title: 'Tesouraria PSH', headerShadowVisible: false }}
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