import { useContext } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AppContext } from "../../context/appContext";
import { useNavigation } from '@react-navigation/native';


export default function Bxsaldo({ dados }) {

  const { obterNomeMes, formatoMoeda, resumoFinanceiro,loadSaldo } = useContext(AppContext)

  const navigation = useNavigation()

  function obterSaldoMesAnterior(dados) {
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth() + 1; // getMonth() retorna 0-11, então adicionamos 1

    // Calcular o mês anterior
    let mesAnterior = mesAtual - 1;
    let anoAnterior = anoAtual;

    // Se o mês atual for janeiro, precisamos ajustar para dezembro do ano anterior
    if (mesAnterior < 1) {
      mesAnterior = 12;
      anoAnterior -= 1;
    }

    // Encontrar o saldo do mês anterior
    const mesAnteriorDados = dados.find(d => d.ano === anoAnterior && d.mes === mesAnterior);

    // Retornar o saldo ou uma mensagem se não encontrado
    return mesAnteriorDados ? mesAnteriorDados.saldo : null;
  }

  return (
    <View>
      <View style={{ backgroundColor: '#fff', marginBottom: 14, alignItems: 'center', height: 75, flexDirection: 'row', justifyContent: 'space-between', borderBottomStartRadius: 24, borderBottomEndRadius: 24, marginHorizontal: 14 }}>
        {loadSaldo ?
          <View style={{ alignItems: "center", justifyContent: 'center', flex: 1 }}>
            <ActivityIndicator color={'#222'} />
          </View>
          :
          <>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: '#000', fontFamily: 'Roboto-Light' }}>{obterNomeMes(new Date().getMonth() - 1).toUpperCase()}</Text>
              <Text style={{ color: '#333', fontSize: 15, fontFamily: 'Roboto-Medium' }}>{formatoMoeda.format(obterSaldoMesAnterior(resumoFinanceiro))}</Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 10, color: '#000', fontFamily: 'Roboto-Light' }}>{obterNomeMes(new Date().getMonth()).toUpperCase()}</Text>
              <Text style={{ color: '#333', fontSize: 15, fontFamily: 'Roboto-Medium' }}>{formatoMoeda.format(dados.saldoAtual)}</Text>
            </View>


            <TouchableOpacity onPress={() => navigation.navigate('Futuro')} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 10, color: '#000', fontFamily: 'Roboto-Light' }}>FUTURO</Text>
              <Text style={{ color: '#333', fontSize: 15, fontFamily: 'Roboto-Medium' }}>{formatoMoeda.format(-dados.futurosTotal + dados.saldoAtual)}</Text>
            </TouchableOpacity>
          </>
        }
      </View>

    </View>
  );
}