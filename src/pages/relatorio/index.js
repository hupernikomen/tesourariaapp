import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { AppContext } from "../../context/appContext";

export default function Relatorio() {
  const { BuscarSaldo, resumoFinanceiro, formatoMoeda } = useContext(AppContext);
  const [dadosFiltrados, setDadosFiltrados] = useState([]);
  const width = Dimensions.get('window').width

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


   const gerarPDF = async () => {
     const htmlContent = `
       <h1>Relatório Financeiro</h1>
       ${dadosFiltrados.map(mesData => `
         <h2>${mesData.nomeMes.toUpperCase()}</h2>
         <p>Receitas: ${formatoMoeda.format(mesData.entrada)}</p>
         <p>Despesas: ${formatoMoeda.format(mesData.saida)}</p>
         <p>Saldo: ${formatoMoeda.format(mesData.saldo)}</p>
         <h3>Detalhamento Receitas:</h3>
         ${Object.keys(mesData).map(key => {
           const tipo = mesData[key];
           return tipo.total > 0 && tipo.movimentacao === 'entrada' ? `
             <p>${key.toUpperCase()}: ${formatoMoeda.format(tipo.total)}</p>
           ` : '';
         }).join('')}
         <h3>Detalhamento Despesas:</h3>
         ${Object.keys(mesData).map(key => {
           const tipo = mesData[key];
           return tipo.total > 0 && tipo.movimentacao === 'saida' ? `
             <p>${key.toUpperCase()}: ${formatoMoeda.format(tipo.total)}</p>
           ` : '';
         }).join('')}
       `).join('')}
     `;

     let options = {
       html: htmlContent,
       fileName: 'RelatorioFinanceiro',
       directory: 'Documents',
     };

     let file = await RNHTMLtoPDF.convert(options);

     const shareOptions = {
       title: 'Compartilhar Relatório',
       url: `file://${file.filePath}`,
       type: 'application/pdf',
     };

     Share.open(shareOptions)
       .then((res) => console.log(res))
       .catch((err) => console.log(err));
   };
   


  const Tab = createMaterialTopTabNavigator();



  const MesScreen = ({ mesData }) => {


    return (
      <View style={{
        flex: 1,
        paddingHorizontal: 21,
        marginVertical: 14
      }}>

        <View style={{ marginVertical: 14, alignItems: "center" }}>
          <Text style={{ fontWeight: 500 }}>RESULTADO:</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: .5, borderColor: '#d3d3d3', paddingVertical: 6 }}>
          <Text style={{ fontSize: 13 }}>RECEITAS</Text>
          <Text style={{ fontSize: 13 }}>{formatoMoeda.format(mesData.entrada)}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: .5, borderColor: '#d3d3d3', paddingVertical: 6 }}>
          <Text style={{ fontSize: 13 }}>DESPESAS</Text>
          <Text style={{ fontSize: 13 }}>{formatoMoeda.format(mesData.saida)}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: .5, borderColor: '#d3d3d3', paddingVertical: 6 }}>
          <Text style={{ fontSize: 13 }}>SALDO</Text>
          <Text style={{ fontSize: 13 }}>{formatoMoeda.format(mesData.saldo)}</Text>
        </View>



        <View style={{ marginVertical: 14, alignItems: "center", marginTop: 28 }}>
          <Text style={{ fontWeight: 500 }}>DETALHAMENTO RECEITAS:</Text>
        </View>




        {Object.keys(mesData).map((key) => {
          // Verifica se a chave não é uma das chaves que você não quer exibir
          if (key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'entrada' && key !== 'saida' && key !== 'saldo') {
            const tipo = mesData[key];

            return tipo.total > 0 && tipo.movimentacao === 'entrada' ? (
              <View key={key} style={{ flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: .5, borderColor: '#d3d3d3', paddingVertical: 6 }}>
                <Text style={{ fontSize: 13 }}>{key.toUpperCase()}S</Text>
                <Text style={{ fontSize: 13 }}>{formatoMoeda.format(tipo.total)}</Text>
              </View>
            ) : null;
          }
          return null;
        })}


        <View style={{ marginVertical: 14, alignItems: "center", marginTop: 28 }}>
          <Text style={{ fontWeight: 500 }}>DETALHAMENTO DESPESAS:</Text>
        </View>



        {Object.keys(mesData).map((key) => {
          // Verifica se a chave não é uma das chaves que você não quer exibir
          if (key !== 'ano' && key !== 'mes' && key !== 'nomeMes' && key !== 'entrada' && key !== 'saida' && key !== 'saldo') {
            const tipo = mesData[key];

            return tipo.total > 0 && tipo.movimentacao === 'saida' ? (
              <View key={key} style={{ flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: .5, borderColor: '#d3d3d3', paddingVertical: 6 }}>
                <Text style={{ fontSize: 13 }}>{key.toUpperCase()}S</Text>
                <Text style={{ fontSize: 13 }}>{formatoMoeda.format(tipo.total)}</Text>
              </View>
            ) : null;
          }
          return null;
        })}


        <View style={{ marginVertical: 14, alignItems: "center", marginTop: 28 }}>
          <Text style={{ fontWeight: 500 }}>POR MINISTÉRIOS:</Text>
        </View>

        {Object.keys(mesData).map((key) => {
          // Verifica se a chave é um ministério
          const tipo = mesData[key];
          if (typeof tipo === 'object' && tipo !== null && tipo.total > 0 && tipo.ministerio) {
            return (
              <View key={key} style={{ flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: .5, borderColor: '#d3d3d3', paddingVertical: 6 }}>
                <Text style={{ fontSize: 13 }}>{tipo.ministerio.toUpperCase()}</Text>
                <Text style={{ fontSize: 13 }}>{formatoMoeda.format(tipo.total)}</Text>
              </View>
            );
          }
          return null;
        })}


             <TouchableOpacity onPress={gerarPDF} style={{ padding: 10, backgroundColor: '#659f99ff', borderRadius: 5, margin: 10 }}>
         <Text style={{ color: '#fff', textAlign: 'center' }}>Gerar e Compartilhar PDF</Text>
       </TouchableOpacity>

      </View>
    );
  };



  if (dadosFiltrados.length === 0) {
    return (
      <View>
        <Text>Nenhum dado disponível para os últimos 6 meses.</Text>
      </View>
    );
  }


  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: (width - 28) / 3 }, // Ajuste a largura conforme necessário
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

