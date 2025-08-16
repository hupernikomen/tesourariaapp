import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
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

  const navigation = useNavigation();

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
      // Agrupa receitas por tipo, somando totais
      const receitasAgrupadas = Object.keys(mesData).reduce((acc, key) => {
        if (
          key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'receita' && key !== 'despesa' && key !== 'saldo' &&
          mesData[key].movimentacao === 'receita' && mesData[key].total > 0
        ) {
          const tipo = mesData[key].tipo;
          if (!acc[tipo]) {
            acc[tipo] = { total: 0, tipo };
          }
          acc[tipo].total += mesData[key].total;
        }
        return acc;
      }, {});
      const receitas = Object.values(receitasAgrupadas);

      // Agrupa despesas por tipo, somando totais e coletando itens de ministérios
      const despesasAgrupadas = Object.keys(mesData).reduce((acc, key) => {
        if (
          key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'receita' && key !== 'despesa' && key !== 'saldo' &&
          mesData[key].movimentacao === 'despesa' && mesData[key].total > 0
        ) {
          const tipo = mesData[key].tipo;
          if (!acc[tipo]) {
            acc[tipo] = { total: 0, tipo, items: [] };
          }
          acc[tipo].total += mesData[key].total;
          acc[tipo].items.push({ ministerio: mesData[key].ministerio, total: mesData[key].total });
        }
        return acc;
      }, {});
      const despesas = Object.values(despesasAgrupadas);

      const htmlContent = `
        <html>
          <head>
            <style>
              body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f4f7fa;
                color: #333;
              }
              .container {
                max-width: 900px;
                margin: 0 auto;
                background-color: #fff;
                border-radius: 8px;
                padding: 20px;
              }
              .header {
                text-align: center;
                padding-bottom: 10px;
                border-bottom: 1px solid #e0e0e0;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                color: #2c3e50;
                margin: 0;
              }
              .subtitle {
                font-size: 12px;
                color: #7f8c8d;
                margin-top: 3px;
              }
              .summary {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin: 15px 0;
              }
              .summary-card {
                background-color: #ecf0f1;
                padding: 10px;
                border-radius: 6px;
                text-align: center;
                transition: transform 0.2s;
              }
              .summary-card:hover {
                transform: translateY(-3px);
              }
              .summary-card.green { background-color: #e8f5e9; }
              .summary-card.red { background-color: #ffebee; }
              .summary-card.blue { background-color: #e3f2fd; }
              .summary-label {
                font-size: 12px;
                font-weight: bold;
                color: #34495e;
                margin-bottom: 5px;
              }
              .summary-value {
                font-size: 16px;
                color: #2c3e50;
              }
              .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #2c3e50;
                margin: 15px 0 10px;
                padding-left: 8px;
              }
              .details {
                margin-bottom: 10px;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 10px;
                background-color: #f9f9f9;
                border-radius: 4px;
                margin-bottom: 4px;
                font-size: 12px;
              }
              .detail-row.sub-row {
                margin-left: 15px;
                background-color: #f1f1f1;
                font-size: 11px;
              }
              .detail-label {
                color: #34495e;
                font-weight: 500;
              }
              .detail-value {
                color: #2c3e50;
              }

              .divider {
                border-bottom: 1px dashed #e0e0e0;
                margin: 8px 0;
              }
              .footer {
                text-align: center;
                font-size: 10px;
                color: #7f8c8d;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid #e0e0e0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 class="title">Relatório Financeiro - ${mesData.nomeMes.toUpperCase()}</h1>
                <p class="subtitle">Resumo Financeiro Mensal</p>
              </div>
              <div class="summary">
                <div class="summary-card green">
                  <div class="summary-label">RECEITAS</div>
                  <div class="summary-value">${formatoMoeda.format(mesData.receita)}</div>
                </div>
                <div class="summary-card red">
                  <div class="summary-label">DESPESAS</div>
                  <div class="summary-value">${formatoMoeda.format(mesData.despesa)}</div>
                </div>
                <div class="summary-card blue">
                  <div class="summary-label">SALDO</div>
                  <div class="summary-value">${formatoMoeda.format(mesData.saldo)}</div>
                </div>
              </div>
              <div class="details">
                ${receitas.length > 0 ? `
                  <h3 class="section-title">Receitas</h3>
                  ${receitas.map(item => `
                    <div class="detail-row">
                      <span class="detail-label">${item.tipo.toUpperCase()}</span>
                      <span class="detail-value positive">+ ${formatoMoeda.format(item.total)}</span>
                    </div>
                  `).join('')}
                ` : ''}
                ${receitas.length > 0 && despesas.length > 0 ? '<div class="divider"></div>' : ''}
                ${despesas.length > 0 ? `
                  <h3 class="section-title">Despesas</h3>
                  ${despesas.map(item => `
                    <div class="detail-row">
                      <span class="detail-label">${item.tipo.toUpperCase()}</span>
                      <span class="detail-value negative">- ${formatoMoeda.format(item.total)}</span>
                    </div>
                    ${item.items.map(min => `
                      <div class="detail-row sub-row">
                        <span class="detail-label">${min.ministerio.toUpperCase()}</span>
                        <span class="detail-value negative">- ${formatoMoeda.format(min.total)}</span>
                      </div>
                    `).join('')}
                  `).join('')}
                ` : ''}
              </div>
              <div class="footer">
                Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} | Sistema Financeiro da Igreja Batista no PSH
              </div>
            </div>
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
    // Agrupa receitas por tipo, somando totais
    const receitasAgrupadas = Object.keys(mesData).reduce((acc, key) => {
      if (
        key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'receita' && key !== 'despesa' && key !== 'saldo' &&
        mesData[key].movimentacao === 'receita' && mesData[key].total > 0
      ) {
        const tipo = mesData[key].tipo;
        if (!acc[tipo]) {
          acc[tipo] = { total: 0, tipo };
        }
        acc[tipo].total += mesData[key].total;
      }
      return acc;
    }, {});
    const receitas = Object.values(receitasAgrupadas);

    // Agrupa despesas por tipo, somando totais e coletando itens de ministérios
    const despesasAgrupadas = Object.keys(mesData).reduce((acc, key) => {
      if (
        key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'receita' && key !== 'despesa' && key !== 'saldo' &&
        mesData[key].movimentacao === 'despesa' && mesData[key].total > 0
      ) {
        const tipo = mesData[key].tipo;
        if (!acc[tipo]) {
          acc[tipo] = { total: 0, tipo, items: [] };
        }
        acc[tipo].total += mesData[key].total;
        acc[tipo].items.push({ ministerio: mesData[key].ministerio, total: mesData[key].total });
      }
      return acc;
    }, {});
    const despesas = Object.values(despesasAgrupadas);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
        </View>
        <View style={styles.summary}>
          <View style={[styles.summaryCard, styles.greenCard]}>
            <Text style={styles.summaryLabel}>RECEITAS</Text>
            <Text style={styles.summaryValue}>{formatoMoeda.format(mesData.receita)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.redCard]}>
            <Text style={styles.summaryLabel}>DESPESAS</Text>
            <Text style={styles.summaryValue}>{formatoMoeda.format(mesData.despesa)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.blueCard]}>
            <Text style={styles.summaryLabel}>SALDO</Text>
            <Text style={styles.summaryValue}>{formatoMoeda.format(mesData.saldo)}</Text>
          </View>
        </View>
        <View style={styles.details}>
          {receitas.length > 0 && (
            <>
              {receitas.map((item) => (
                <View key={item.tipo} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.tipo.toUpperCase()}</Text>
                  <Text style={[styles.detailValue, styles.positive]}>+ {formatoMoeda.format(item.total)}</Text>
                </View>
              ))}
            </>
          )}
          {receitas.length > 0 && despesas.length > 0 && <View style={styles.divider} />}
          {despesas.length > 0 && (
            <>
              {despesas.map((item) => (
                <View key={item.tipo}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.tipo.toUpperCase()}</Text>
                    <Text style={[styles.detailValue, styles.negative]}>- {formatoMoeda.format(item.total)}</Text>
                  </View>
                  {item.items.map((min, index) => (
                    <View key={index} style={[styles.detailRow, styles.subRow]}>
                      <Text style={styles.detailLabel}>{min.ministerio.toUpperCase()}</Text>
                      <Text style={[styles.detailValue, styles.negative]}>- {formatoMoeda.format(min.total)}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}
        </View>
        <Botao acao={() => generatePDF(mesData)} texto={'Gerar e Compartilhar PDF'} />
      </View>
    );
  };

  if (dadosFiltrados.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum dado disponível</Text>
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
          height:60,
          justifyContent:'center',
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
    paddingVertical: 7,
    backgroundColor: '#f4f7fa',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  subtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 3,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  
  summaryLabel: {
    fontSize: 12,
    color: '#34495e',
  },
  summaryValue: {
    fontSize: 12,
  },

  details: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    marginBottom: 4,
  },
  subRow: {
    marginLeft: 21,
    backgroundColor: '#f4f7fa',
  },
  detailLabel: {
    fontSize: 11,
    color: '#34495e',
  },
  detailValue: {
    fontSize: 12,
    color: '#2c3e50',
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginVertical: 8,
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