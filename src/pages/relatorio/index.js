import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { AppContext } from "../../context/appContext";

export default function Relatorio() {
  const { BuscarSaldo, resumoFinanceiro, formatoMoeda } = useContext(AppContext);
  const [dadosFiltrados, setDadosFiltrados] = useState([]);
  const width = Dimensions.get('window').width;

  useEffect(() => {
    const fetchData = async () => {
      await BuscarSaldo();
    };

    fetchData();
  }, []);

  useEffect(() => {
    const dataAtual = new Date();
    const umAno = new Date(dataAtual.setMonth(dataAtual.getMonth() - 12));

    const filtrados = resumoFinanceiro.filter(mesData => {
      const dataMes = new Date(mesData.ano, mesData.mes - 1);
      return dataMes >= umAno;
    });

    setDadosFiltrados(filtrados);
  }, [resumoFinanceiro]);

  const Tab = createMaterialTopTabNavigator();

  const MesScreen = ({ mesData }) => {
    const receitas = Object.keys(mesData).filter(key =>
      key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'entrada' && key !== 'saida' && key !== 'saldo' &&
      mesData[key].movimentacao === 'entrada' && mesData[key].total > 0
    );

    const despesas = Object.keys(mesData).filter(key =>
      key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'entrada' && key !== 'saida' && key !== 'saldo' &&
      mesData[key].movimentacao === 'saida' && mesData[key].total > 0
    );

    const ministerios = Object.keys(mesData).filter(key =>
      typeof mesData[key] === 'object' && mesData[key] !== null && mesData[key].total > 0 && mesData[key].ministerio
    );

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>RECEITAS</Text>
            <Text style={styles.value}>{formatoMoeda.format(mesData.entrada)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DESPESAS</Text>
            <Text style={styles.value}>{formatoMoeda.format(mesData.saida)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>SALDO</Text>
            <Text style={styles.value}>{formatoMoeda.format(mesData.saldo)}</Text>
          </View>
        </View>
        <View style={{padding:14}}>

          {receitas.map((key) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key.toUpperCase()}S</Text>
              <Text style={styles.value}>+ {formatoMoeda.format(mesData[key].total)}</Text>
            </View>
          ))}

          {despesas.length > 0 && <View style={{ borderBottomColor: '#aaa', borderBottomWidth: .5 }} />}
          {despesas.map((key) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key.toUpperCase()}S</Text>
              <Text style={styles.value}>- {formatoMoeda.format(mesData[key].total)}</Text>
            </View>
          ))}

          {ministerios.length > 0 && <View style={{ borderBottomColor: '#aaa', borderBottomWidth: .5 }} />}
          {ministerios.map((key) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{mesData[key].ministerio.toUpperCase()}</Text>
              <Text style={styles.value}>- {formatoMoeda.format(mesData[key].total)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (dadosFiltrados.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum dado disponível para os últimos 6 meses.</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: (width - 28) / 3 },
        tabBarActiveTintColor: '#333',
        tabBarInactiveTintColor: '#ddd',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          marginHorizontal: 14,
          borderBottomStartRadius: 24,
          borderBottomEndRadius: 24,
          overflow: 'hidden',
        },
      }}
    >
      {dadosFiltrados.map((mesData) => (
        <Tab.Screen
          key={mesData.mes}
          name={mesData.nomeMes.toUpperCase()}
          children={() => <MesScreen mesData={mesData} />}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 14,
    marginVertical: 14,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    color: '#333',
  },
  value: {
    fontSize: 12,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
