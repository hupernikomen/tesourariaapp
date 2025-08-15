import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { AppContext } from "../../context/appContext";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Botao from '../../componentes/Botao';
import { useNavigation } from '@react-navigation/native';

export default function Relatorio() {
  const { BuscarSaldo, resumoFinanceiro, formatoMoeda } = useContext(AppContext);
  const [dadosFiltrados, setDadosFiltrados] = useState([]);
  const width = Dimensions.get('window').width;

  const navigation = useNavigation()

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

  const generatePDF = async (mesData) => {
    try {
      // Filtra receitas (chaves combinadas com movimentacao 'receita')
      const receitas = Object.keys(mesData).filter(key =>
        key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'receita' && key !== 'despesa' && key !== 'saldo' &&
        mesData[key].movimentacao === 'receita' && mesData[key].total > 0
      );

      // Agrupa despesas por tipo, somando totais
      const despesasAgrupadas = Object.keys(mesData).reduce((acc, key) => {
        if (
          key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'receita' && key !== 'despesa' && key !== 'saldo' &&
          mesData[key].movimentacao === 'despesa' && mesData[key].total > 0
        ) {
          const tipo = mesData[key].tipo;
          if (!acc[tipo]) {
            acc[tipo] = { total: 0, tipo };
          }
          acc[tipo].total += mesData[key].total;
        }
        return acc;
      }, {});
      const despesas = Object.values(despesasAgrupadas);

      // Agrupa ministerios para despesas, mantendo chaves combinadas
      const ministeriosAgrupados = Object.keys(mesData).reduce((acc, key) => {
        if (
          key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'receita' && key !== 'despesa' && key !== 'saldo' &&
          mesData[key].movimentacao === 'despesa' && mesData[key].total > 0
        ) {
          const ministerioNome = `${mesData[key].ministerio.toUpperCase()} (${mesData[key].tipo.toUpperCase()})`;
          acc[key] = {
            ministerio: ministerioNome,
            total: mesData[key].total
          };
        }
        return acc;
      }, {});
      const ministerios = Object.values(ministeriosAgrupados);

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .title { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
              .card { padding: 15px; background-color: #f3f3f3;margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .label { font-size: 12px; color: #333; }
              .value { font-size: 12px; color: #000; }
              .divider { border-bottom: 1px solid #ccc; margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1 class="title">Relatório Financeiro - ${mesData.nomeMes.toUpperCase()}</h1>
            <div class="card">
              <div class="row">
                <span class="label">RECEITAS</span>
                <span class="value">${formatoMoeda.format(mesData.receita)}</span>
              </div>
              <div class="row">
                <span class="label">DESPESAS</span>
                <span class="value">${formatoMoeda.format(mesData.despesa)}</span>
              </div>
              <div class="row">
                <span class="label">SALDO</span>
                <span class="value">${formatoMoeda.format(mesData.saldo)}</span>
              </div>
            </div>

                      <div class="row">
                <span class="title">Detalhamento:</span>
              </div>

            ${receitas.map(key => `
              <div class="row">
                <span class="label">${mesData[key].tipo.toUpperCase()}</span>
                <span class="value">+ ${formatoMoeda.format(mesData[key].total)}</span>
              </div>
            `).join('')}
            ${despesas.length > 0 ? '<div class="divider"></div>' : ''}
            ${despesas.map(item => `
              <div class="row">
                <span class="label">${item.tipo.toUpperCase()}</span>
                <span class="value">- ${formatoMoeda.format(item.total)}</span>
              </div>
            `).join('')}
            ${ministerios.length > 0 ? '<div class="divider"></div>' : ''}
            ${ministerios.map(min => `
              <div class="row">
                <span class="label">${min.ministerio}</span>
                <span class="value">- ${formatoMoeda.format(min.total)}</span>
              </div>
            `).join('')}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Compartilhar Relatório ${mesData.nomeMes}` });
    } catch (error) {
      console.error('Erro ao gerar ou compartilhar o PDF:', error);
    }
  };

  const MesScreen = ({ mesData }) => {

    // Filtra receitas
    const receitas = Object.keys(mesData).filter(key =>
      key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'receita' && key !== 'despesa' && key !== 'saldo' &&
      mesData[key].movimentacao === 'receita' && mesData[key].total > 0
    );

    // Agrupa despesas por tipo, somando totais
    const despesasAgrupadas = Object.keys(mesData).reduce((acc, key) => {
      if (
        key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'receita' && key !== 'despesa' && key !== 'saldo' &&
        mesData[key].movimentacao === 'despesa' && mesData[key].total > 0
      ) {
        const tipo = mesData[key].tipo;
        if (!acc[tipo]) {
          acc[tipo] = { total: 0, tipo };
        }
        acc[tipo].total += mesData[key].total;
      }
      return acc;
    }, {});
    const despesas = Object.values(despesasAgrupadas);

    // Agrupa ministerios para despesas, mantendo chaves combinadas
    const ministeriosAgrupados = Object.keys(mesData).reduce((acc, key) => {
      if (
        key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'receita' && key !== 'despesa' && key !== 'saldo' &&
        mesData[key].movimentacao === 'despesa' && mesData[key].total > 0
      ) {
        const ministerioNome = `${mesData[key].ministerio.toUpperCase()} (${mesData[key].tipo.toUpperCase()})`;
        acc[key] = {
          ministerio: ministerioNome,
          total: mesData[key].total
        };
      }
      return acc;
    }, {});
    const ministerios = Object.values(ministeriosAgrupados);

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>RECEITAS</Text>
            <Text style={styles.value}>{formatoMoeda.format(mesData.receita)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DESPESAS</Text>
            <Text style={styles.value}>{formatoMoeda.format(mesData.despesa)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>SALDO</Text>
            <Text style={styles.value}>{formatoMoeda.format(mesData.saldo)}</Text>
          </View>
        </View>
        <View style={{ padding: 14 }}>
          {receitas.map((key) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{mesData[key].tipo.toUpperCase()}</Text>
              <Text style={styles.value}>+ {formatoMoeda.format(mesData[key].total)}</Text>
            </View>
          ))}

          {despesas.length > 0 && <View style={{ borderBottomColor: '#ccc', borderBottomWidth: 0.3, marginVertical: 7 }} />}
          {despesas.map((item) => (
            <View key={item.tipo} style={styles.row}>
              <Text style={styles.label}>{item.tipo.toUpperCase()}</Text>
              <Text style={styles.value}>- {formatoMoeda.format(item.total)}</Text>
            </View>
          ))}

          {ministerios.length > 0 && <View style={{ borderBottomColor: '#ccc', borderBottomWidth: 0.3, marginVertical: 7 }} />}
          {ministerios.map((min) => (
            <View key={min.ministerio} style={styles.row}>
              <Text style={styles.label}>{min.ministerio}</Text>
              <Text style={styles.value}>- {formatoMoeda.format(min.total)}</Text>
            </View>
          ))}
        </View>


        <Botao acao={() => generatePDF(mesData)} texto={'Gerar e Compartilhar PDF'} />
      </View>
    );
  };

  if (dadosFiltrados.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum dado disponível</Text>
        <Text style={styles.emptyText}>para os últimos 12 meses.</Text>
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
    marginVertical: 7,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 21,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3.5,
  },
  label: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Roboto-Regular',
  },
  value: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'Roboto-Light',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#000',
    paddingHorizontal: 42,
    textAlign: 'center',
  },

});