import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { AppContext } from '../../context/appContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Botao from '../../componentes/Botao';
import { useTheme } from '@react-navigation/native';
import Icone from '../../componentes/Icone';

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
      const receitasAgrupadas = Object.keys(mesData.tipos).reduce((acc, key) => {
        if (
          mesData.tipos[key].movimentacao === 'receita' &&
          mesData.tipos[key].total > 0
        ) {
          const tipo = mesData.tipos[key].tipo;

          if (!acc[tipo]) {
            acc[tipo] = { total: 0, tipo };
          }

          acc[tipo].total += mesData.tipos[key].total;
        }
        return acc;
      }, {});
      const receitas = Object.values(receitasAgrupadas);

      // Agrupa despesas por tipo, somando totais e coletando itens de ministérios
      const despesasAgrupadas = Object.keys(mesData.tipos).reduce((acc, key) => {
        if (
          mesData.tipos[key].movimentacao === 'despesa' &&
          mesData.tipos[key].total > 0
        ) {
          const tipo = mesData.tipos[key].tipo;
          if (!acc[tipo]) {
            acc[tipo] = { total: 0, tipo, items: [] };
          }
          acc[tipo].total += mesData.tipos[key].total;
          acc[tipo].items.push({ ministerio: mesData.tipos[key].ministerio, total: mesData.tipos[key].total });
        }
        return acc;
      }, {});
      const despesas = Object.values(despesasAgrupadas);

      // Detalhamento usando o array movements (todos os movimentos individuais)
      let detalhamento = mesData.movements.map(move => ({
        detalhamento: move.detalhamento,
        valor: move.valor,
        movimentacao: move.movimentacao,
        tipo: move.tipo,
        dataDoc: move.dataDoc
      }));

      // Ordena por dataDoc (crescente)
      detalhamento.sort((a, b) => a.dataDoc - b.dataDoc);

      const htmlContent = `
      <html>
        <head>
          <style>
            @page {
              size: A4;
              margin: 10mm; /* Margens reduzidas para mais espaço */
            }
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 10mm 10mm 20mm 10mm; /* Margens reduzidas */
              background-color: #fff;
              color: #333;
              min-height: 297mm;
              width: 210mm;
              box-sizing: border-box;
              position: relative;
            }
            .container {
              max-width: 190mm; /* Aumentado para preencher mais a página */
              margin: 0 auto;
              display: flex;
              border-radius: 4mm;
              padding: 2mm; /* Reduzido */
              gap: 2mm; /* Reduzido */
              box-sizing: border-box;
            }
            .main-column {
              width: 65%;
              padding-right: 2mm;
              box-sizing: border-box;
            }
            .detail-column {
              width: 35%;
              border-left: 1px solid #e0e0e0;
              padding-left: 2mm;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              padding-bottom: 2mm;
              border-bottom: 1px solid #e0e0e0;
            }
            .title {
              font-size: 18pt;
              font-weight: bold;
              color: #2c3e50;
              margin: 0;
            }
            .subtitle {
              font-size: 10pt;
              color: #7f8c8d;
              margin-top: 1mm;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 2mm;
              margin: 3mm 0;
            }
            .summary-card {
              background-color: #ecf0f1;
              padding: 2mm;
              border-radius: 2mm;
              text-align: center;
              transition: transform 0.2s;
            }
            .summary-card:hover {
              transform: translateY(-1mm);
            }
            .summary-card.green { background-color: #e8f5e9; }
            .summary-card.red { background-color: #ffebee; }
            .summary-card.blue { background-color: #e3f2fd; }
            .summary-label {
              font-size: 10pt;
              color: #34495e;
              margin-bottom: 1mm;
            }
            .summary-value {
              font-size: 12pt;
              color: #2c3e50;
            }
            .section-title {
              font-size: 14pt;
              color: #2c3e50;
              margin: 3mm 0 2mm;
              padding-left: 1mm;
            }
            .details {
              margin-bottom: 2mm;
            }
            .tipo-row {
              display: flex;
              justify-content: space-between;
              padding: 1mm 1mm;
              font-size: 10pt;
              border-bottom: 0.5px solid #e0e0e0;
              font-weight: 500;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 1mm 1mm;
              font-size: 10pt;
              border-bottom: 0.5px solid #e0e0e0;
            }
            .detail-row.sub-row {
              margin-left: 10mm;
              padding: 1mm 1mm;
              margin-bottom: 0.2mm;
              font-size: 9pt;
              border-bottom: 0.5px solid #e0e0e0;
            }
            .detail-label {
              color: #34495e;
            }
            .detail-value {
              color: #2c3e50;
            }
            .detail-value.positive {
              color: #1a8748;
            }
            .detail-value.negative {
              color: #c0392b;
            }
            .divider {
              border-bottom: 1px dashed #e0e0e0;
              margin: 2mm 0;
            }
            .footer {
              position: absolute;
              bottom: 5mm;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8pt;
              color: #7f8c8d;
              padding-top: 2mm;
              border-top: 1px solid #e0e0e0;
              width: 100%;
              box-sizing: border-box;
            }
            .detail-column .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 1mm 1mm;
              font-size: 9pt;
              margin-bottom: 0.2mm;
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
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                margin: 0;
                padding: 10mm 10mm 20mm 10mm;
                width: 210mm;
                min-height: 297mm;
              }
              .container {
                margin-bottom: 20mm;
                max-width: 190mm;
              }
              .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                margin: 0;
                padding: 2mm 0;
              }
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
                  ${item.items.length > 1 ? item.items.map(min => `
                    <div class="detail-row sub-row">
                      <span class="detail-label">${min.ministerio.replace('Min. ', '').toUpperCase()}</span>
                      <span class="detail-value">- ${formatoMoeda.format(min.total)}</span>
                    </div>
                  `).join('') : ''}
                `).join('')}
              ` : ''}
              </div>
            </div>
            <div class="detail-column">
              <h3 class="section-title">Movimentações</h3>
              ${detalhamento.length > 0 ? detalhamento.map(det => {
                // Verifica se dataDoc é um número válido
                const date = Number.isFinite(det.dataDoc) ? new Date(det.dataDoc) : null;
                const formattedDate = date && !isNaN(date.getTime()) 
                  ? date.getDate().toString().padStart(2, '0') 
                  : 'Data Inválida';
                return `
                <div class="detail-row">
                  <span class="detail-label">${formattedDate} - ${det.tipo === 'Dízimos' ? '********' : det.detalhamento}</span>
                  <span class="detail-value ${det.movimentacao === 'receita' ? 'positive' : 'negative'}">
                    ${det.movimentacao === 'receita' ? '+' : '-'} ${formatoMoeda.format(det.valor)}
                  </span>
                </div>
              `;
              }).join('') : '<p>Nenhum registro detalhado disponível.</p>'}
            </div>
          </div>
          <div class="footer">
            Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')} | Sistema Financeiro da Igreja Batista no PSH
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

    const receitasAgrupadas = Object.keys(mesData.tipos).reduce((acc, key) => {
      if (
        mesData.tipos[key].movimentacao === 'receita' &&
        mesData.tipos[key].total > 0
      ) {
        const tipo = mesData.tipos[key].tipo;
        if (!acc[tipo]) {
          acc[tipo] = { total: 0, tipo };
        }
        acc[tipo].total += mesData.tipos[key].total;
      }
      return acc;
    }, {});
    const receitas = Object.values(receitasAgrupadas);

    const despesasAgrupadas = Object.keys(mesData.tipos).reduce((acc, key) => {
      if (
        mesData.tipos[key].movimentacao === 'despesa' &&
        mesData.tipos[key].total > 0
      ) {
        const tipo = mesData.tipos[key].tipo;
        if (!acc[tipo]) {
          acc[tipo] = { total: 0, tipo, items: [] };
        }
        acc[tipo].total += mesData.tipos[key].total;
        acc[tipo].items.push({ ministerio: mesData.tipos[key].ministerio, detalhamento: mesData.tipos[key].detalhamento, total: mesData.tipos[key].total });
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
                  <Icone
                    nome={isReceitasExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={18}
                    color={colors.contra_theme}
                    style={styles.iconLeft}
                  />
                  <Text style={styles.sectionTitle}>Receitas</Text>
                </View>
                <Text style={[styles.detailValue, { color: colors.receita }]}>
                  + {formatoMoeda.format(mesData.receita)}
                </Text>
              </TouchableOpacity>
            )}
            {isReceitasExpanded && receitas.length > 0 && (
              <View>
                {receitas.map((item) => (
                  <View key={item.tipo} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.tipo.toUpperCase()}</Text>
                    <Text style={[styles.detailValue, { color: colors.receita }]}>
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
                  <Icone
                    nome={isDespesasExpanded ? 'chevron-down' : 'chevron-forward'}
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
                        <Icone
                          nome={expandedTipos[item.tipo] ? 'chevron-down' : 'chevron-forward'}
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
                        <Text style={styles.detailLabel}>{min.ministerio.replace('Min. ', '').toUpperCase()}</Text>
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
                  <Icone
                    nome={mesData.saldo >= 0 ? 'trending-up' : 'trending-down'}
                    size={18}
                    color={colors.contra_theme}
                    style={styles.iconLeft}
                  />
                  <Text style={styles.sectionTitle}>Saldo</Text>
                </View>
                <Text style={[styles.detailValue, { color: mesData.saldo >= 0 ? colors.receita : colors.despesa }]}>
                  {mesData.saldo >= 0 ? '+' : '-'} {formatoMoeda.format(Math.abs(mesData.saldo))}
                </Text>
              </View>
            )}
          </View>
          {receitas.length > 0 && despesas.length > 0 && <View style={styles.divider} />}
          <Botao texto={'Gerar e Compartilhar PDF'} icone={'share-social-outline'} acao={() => generatePDF(mesData)} corBotao={colors.receita} />
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
          height: 50,
          justifyContent: 'center',
          backgroundColor: colors.botao,
          elevation: 0
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
    borderRadius: 7,
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
    borderRadius: 7,
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
    paddingVertical: 8,
    paddingHorizontal: 21,
    borderRadius: 4,
    marginBottom: 4,
  },
  subRow: {
    marginLeft: 21,
  },
  detailLabel: {
    fontSize: 11,
    color: '#34495e',
    marginLeft: 28
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
