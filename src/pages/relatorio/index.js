import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { AppContext } from '../../context/appContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Botao from '../../componentes/Botao';
import { useTheme } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function Relatorio() {
  const { BuscarSaldo, resumoFinanceiro, formatoMoeda } = useContext(AppContext);
  const [dadosFiltrados, setDadosFiltrados] = useState([]);
  const width = Dimensions.get('window').width;
  const { colors } = useTheme();

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
          key !== 'ano' &&
          key !== 'mes' &&
          key !== 'nomeMes' &&
          key !== 'receita' &&
          key !== 'despesa' &&
          key !== 'saldo' &&
          mesData[key].movimentacao === 'receita' &&
          mesData[key].total > 0
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
          key !== 'ano' &&
          key !== 'mes' &&
          key !== 'nomeMes' &&
          key !== 'receita' &&
          key !== 'despesa' &&
          key !== 'saldo' &&
          mesData[key].movimentacao === 'despesa' &&
          mesData[key].total > 0
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

      const detalhamento = Object.keys(mesData)
        .filter(
          key =>
            key !== 'ano' &&
            key !== 'mes' &&
            key !== 'nomeMes' &&
            key !== 'receita' &&
            key !== 'despesa' &&
            key !== 'saldo'
        )
        .map(key => ({
          detalhamento: mesData[key].detalhamento,
          valor: mesData[key].valor,
          movimentacao: mesData[key].movimentacao,
          tipo: mesData[key].tipo,
          dataDoc: mesData[key].dataDoc,
        }));

      const htmlContent = `
      <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #fff;
              color: #333;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
              display: flex;
              border-radius: 8px;
              padding: 20px;
              gap: 20px;
              box-sizing: border-box;
            }
            .main-column {
              width: 66.67%;
              padding-right: 10px;
              box-sizing: border-box;
            }
            .detail-column {
              width: 33.33%;
              border-left: 1px solid #e0e0e0;
              padding-left: 10px;
              box-sizing: border-box;
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
              color: #34495e;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 16px;
              color: #2c3e50;
            }
            .section-title {
              font-size: 16px;
              color: #2c3e50;
              margin: 15px 0 10px;
              padding-left: 8px;
            }
            .details {
              margin-bottom: 10px;
            }
            .tipo-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 6px;
              font-size: 12px;
              border-bottom: 0.5px solid #e0e0e0;
              font-weight: 500
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 6px;
              font-size: 12px;
              border-bottom: 0.5px solid #e0e0e0;
            }
            .detail-row.sub-row {
              margin-left: 15px;
              padding: 4px 6px;
              margin-bottom: 1px;
              font-size: 11px;
              border-bottom: 0.5px solid #e0e0e0;
            }
            .detail-label {
              color: #34495e;
            }
            .detail-value {
              color: #2c3e50;
            }
            .detail-value.positive {
              color: #1a8748ff;
            }
            .detail-value.negative {
              color: #c0392b;
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
            .detail-column .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 6px;
              font-size: 10px;
              margin-bottom: 1px;
            }
            .detail-column .detail-label {
              flex: 2;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .detail-column .detail-value {
              flex: 1;
              text-align: right;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="main-column">
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
                    <div class="tipo-row">
                      <span class="detail-label">${item.tipo.toUpperCase()}</span>
                      <span class="detail-value positive">+ ${formatoMoeda.format(item.total)}</span>
                    </div>
                  `).join('')}
                ` : ''}
                ${receitas.length > 0 && despesas.length > 0 ? '<div class="divider"></div>' : ''}
                ${despesas.length > 0 ? `
                  <h3 class="section-title">Despesas</h3>
                  ${despesas.map(item => `
                    <div class="tipo-row">
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
                Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')} | Sistema Financeiro da Igreja Batista no PSH
              </div>
            </div>
            <div class="detail-column">
              <h3 class="section-title">Movimentações</h3>
              ${detalhamento.length > 0 ? detalhamento.map(det => `
                <div class="detail-row">
                  <span class="detail-label">${new Date(det.dataDoc).getDate().toString().padStart(2, '0')} - ${det.tipo === 'Dízimos' ? '********' : det.detalhamento}</span>
                  <span class="detail-value ${det.movimentacao === 'receita' ? 'positive' : 'negative'}">
                    ${det.movimentacao === 'receita' ? '+' : '-'} ${formatoMoeda.format(det.valor)}
                  </span>
                </div>
              `).join('') : '<p>Nenhum registro detalhado disponível.</p>'}
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
    const [isReceitasExpanded, setIsReceitasExpanded] = useState(false);
    const [isDespesasExpanded, setIsDespesasExpanded] = useState(false);
    const [expandedTipos, setExpandedTipos] = useState({});

    const receitasAgrupadas = Object.keys(mesData).reduce((acc, key) => {
      if (
        key !== 'ano' &&
        key !== 'mes' &&
        key !== 'nomeMes' &&
        key !== 'receita' &&
        key !== 'despesa' &&
        key !== 'saldo' &&
        mesData[key].movimentacao === 'receita' &&
        mesData[key].total > 0
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

    const despesasAgrupadas = Object.keys(mesData).reduce((acc, key) => {
      if (
        key !== 'ano' &&
        key !== 'mes' &&
        key !== 'nomeMes' &&
        key !== 'receita' &&
        key !== 'despesa' &&
        key !== 'saldo' &&
        mesData[key].movimentacao === 'despesa' &&
        mesData[key].total > 0
      ) {
        const tipo = mesData[key].tipo;
        if (!acc[tipo]) {
          acc[tipo] = { total: 0, tipo, items: [] };
        }
        acc[tipo].total += mesData[key].total;
        acc[tipo].items.push({ ministerio: mesData[key].ministerio, detalhamento: mesData[key].detalhamento, total: mesData[key].total });
      }
      return acc;
    }, {});
    const despesas = Object.values(despesasAgrupadas);

    const toggleReceitas = () => {
      setIsReceitasExpanded(!isReceitasExpanded);
    };

    const toggleDespesas = () => {
      setIsDespesasExpanded(!isDespesasExpanded);
    };

    const toggleTipo = (tipo) => {
      setExpandedTipos((prev) => ({
        ...prev,
        [tipo]: !prev[tipo],
      }));
    };

    return (
      <View style={styles.screenContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.details}>
            {receitas.length > 0 && (
              <TouchableOpacity style={styles.sectionHeader} onPress={toggleReceitas}>
                <View style={styles.headerContent}>
                  <AntDesign
                    name={isReceitasExpanded ? 'down' : 'right'}
                    size={16}
                    color={colors.contra_theme}
                    style={styles.iconLeft}
                  />
                  <Text style={styles.sectionTitle}>Receitas</Text>
                </View>
                <Text style={[styles.detailValue, styles.positive]}>
                  + {formatoMoeda.format(mesData.receita)}
                </Text>
              </TouchableOpacity>
            )}
            {isReceitasExpanded && receitas.length > 0 && (
              <View>
                {receitas.map((item) => (
                  <View key={item.tipo} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.tipo.toUpperCase()}</Text>
                    <Text style={[styles.detailValue, styles.positive]}>
                      + {formatoMoeda.format(item.total)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {receitas.length > 0 && despesas.length > 0 && <View style={styles.divider} />}
            {despesas.length > 0 && (
              <TouchableOpacity style={styles.sectionHeader} onPress={toggleDespesas}>
                <View style={styles.headerContent}>
                  <AntDesign
                    name={isDespesasExpanded ? 'down' : 'right'}
                    size={16}
                    color={colors.contra_theme}
                    style={styles.iconLeft}
                  />
                  <Text style={styles.sectionTitle}>Despesas</Text>
                </View>
                <Text style={[styles.detailValue, styles.negative]}>
                  - {formatoMoeda.format(mesData.despesa)}
                </Text>
              </TouchableOpacity>
            )}
            {isDespesasExpanded && despesas.length > 0 && (
              <View>
                {despesas.map((item) => (
                  <View key={item.tipo}>
                    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleTipo(item.tipo)}>
                      <View style={styles.headerContent}>
                        <AntDesign
                          name={expandedTipos[item.tipo] ? 'down' : 'right'}
                          size={16}
                          color={colors.contra_theme}
                          style={styles.iconLeft}
                        />
                        <Text style={styles.detailLabel}>{item.tipo.toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.detailValue, styles.negative]}>
                        - {formatoMoeda.format(item.total)}
                      </Text>
                    </TouchableOpacity>
                    {expandedTipos[item.tipo] && item.items.map((min, index) => (
                      <View key={index} style={[styles.detailRow, styles.subRow]}>
                        <Text style={styles.detailLabel}>{min.ministerio.toUpperCase()}</Text>
                        <Text style={[styles.detailValue, styles.negative]}>
                          - {formatoMoeda.format(min.total)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
            {despesas.length > 0 && <View style={styles.divider} />}
            {(receitas.length > 0 || despesas.length > 0) && (
              <View style={styles.sectionHeader}>

                <View style={styles.headerContent}>
                  <AntDesign
                    name={mesData.saldo >= 0 ? 'smileo' : 'frowno'}
                    size={18}
                    color={colors.contra_theme}
                    style={styles.iconLeft}
                  />
                  <Text style={styles.sectionTitle}>Saldo</Text>
                </View>
                <Text style={[styles.detailValue, mesData.saldo >= 0 ? styles.positive : styles.negative]}>
                  {mesData.saldo >= 0 ? '+' : '-'} {formatoMoeda.format(Math.abs(mesData.saldo))}
                </Text>
              </View>
            )}
          </View>
          {receitas.length > 0 && despesas.length > 0 && <View style={styles.divider} />}
          <TouchableOpacity style={[styles.sectionHeader, { elevation: 3, alignItems: 'center', justifyContent: 'center' }]} onPress={() => generatePDF(mesData)}>
            <View style={styles.sectionHeader}>
              <AntDesign
                name={'sharealt'}
                size={20}
                color={colors.contra_theme}
                style={styles.iconLeft}
              />
              <Text>Gerar e Compartilhar PDF</Text>
            </View>

          </TouchableOpacity>
        </ScrollView>
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
          height: 60,
          justifyContent: 'center',
          backgroundColor: '#fff',
          borderBottomStartRadius: 35,
          borderBottomEndRadius: 35,
          elevation: 3
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
      screenContainer: {
        flex: 1,
      },
      scrollView: {
        flex: 1,
      },
      contentContainer: {
        paddingHorizontal: 14,
        paddingVertical: 21,
        paddingBottom: 21,
      },
      summary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 15,
      },
      summaryCard: {
        flex: 1,
        padding: 10,
        borderRadius: 21,
        alignItems: 'center',
        marginHorizontal: 2,
      },
      summaryLabel: {
        fontSize: 11,
        marginBottom: 3,
        color: '#34495e',
        fontFamily: 'Roboto-Regular',
      },
      summaryValue: {
        fontFamily: 'Roboto-Regular',
        fontSize: 12,
      },
      sectionTitle: {
        fontSize: 16,
        color: '#2c3e50',
        marginVertical: 10,
        paddingLeft: 8,
      },
      sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 21,
        paddingVertical: 7,
        backgroundColor: '#fbfbfb',
        borderRadius: 14,
        marginBottom: 4,
      },
      headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      iconLeft: {
        marginRight: 8,
      },
      details: {
        marginBottom: 21,
      },
      detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
        borderRadius: 4,
        marginBottom: 4,
      },
      subRow: {
        marginLeft: 21,
      },
      detailLabel: {
        fontSize: 11,
        color: '#34495e',
      },
      detailValue: {
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        color: '#2c3e50',
      },
      positive: {
        color: '#1a8748',
      },
      negative: {
        color: '#c0392b',
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
