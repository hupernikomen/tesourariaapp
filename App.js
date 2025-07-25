import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import Home from "./src/pages/home";
import AddImediato from "./src/pages/movimentos/imediato/add";
// import EdicaoImediato from "./src/pages/movimentos/imediato/edicao";
import AddFuturo from "./src/pages/movimentos/futuro/add";
import Relatorio from "./src/pages/relatorio";
import { AppProvider } from "./src/context/appContext";
import DetalheFuturo from './src/pages/detalhes/futuro';
import DetalheRegistro from './src/pages/detalhes/registro';
import ImgDoc from './src/pages/detalhes/ImgDoc';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: 110 },
        tabBarActiveTintColor: '#fff',
        tabBarIndicatorStyle: { backgroundColor: '#f3f3f3', height:3 },
        tabBarStyle: { backgroundColor: '#659f99ff' },
        tabBarLabelStyle:{fontSize:12}
        
      }}
      >
      <Tab.Screen name="Home" component={Home} options={{title:'HOME'}} />
      <Tab.Screen name="AddRegistros" component={AddImediato} options={{title:'REGISTRO'}}/>
      <Tab.Screen name="Parcelamento" component={AddFuturo} options={{title: 'FUTURO'}}/>
      <Tab.Screen name="Relatorio" component={Relatorio} options={{ headerShadowVisible: false, title: 'RELATÓRIO' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const Theme = {
    ...DefaultTheme,
    colors: {
      theme: '#f3f3f3',
      background: '#f3f3f3',
      positivo: '#659f99ff',
      negativo: '#C43302',
      posfraco: '#93c47d70',
      negfraco: '#9E9365',
    }
  };

  return (
    <NavigationContainer theme={Theme}>
      <StatusBar
        backgroundColor={'#659f99ff'}
        barStyle={'light-content'} />

      <AppProvider>
        <Stack.Navigator screenOptions={{
          headerStyle: {
            backgroundColor: '#659f99ff'
          },
          headerTitleStyle: {
            fontSize: 18
          },
          headerTintColor: '#fff',
        }}>
          <Stack.Screen name="Main" component={TabNavigator} options={{ title:'Financeiro PSH', headerShadowVisible:false, headerTitleAlign:'center' }} />
          <Stack.Screen name="DetalheFuturo" component={DetalheFuturo} options={{ headerShadowVisible: false, title: '' }} />
          <Stack.Screen name="DetalheRegistro" component={DetalheRegistro} options={{ headerShadowVisible: false, title: '' }} />
          <Stack.Screen name="ImgDoc" component={ImgDoc} options={{ headerShadowVisible: false, title: '', headerTransparent:true, headerStyle:{backgroundColor:'transparent'}, headerTintColor:'#659f99ff' }} />
        </Stack.Navigator>
      </AppProvider>
    </NavigationContainer>
  );
}
