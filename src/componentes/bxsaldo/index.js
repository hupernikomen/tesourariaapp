import { useContext } from 'react'
import { View, Text, ActivityIndicator } from 'react-native';
import { AppContext } from "../../context/appContext";

export default function Bxsaldo({dados}) {

  const { obterNomeMes, formatoMoeda, resumoFinanceiro } = useContext(AppContext)

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
      <View style={{ backgroundColor: '#fff', marginBottom: 14, alignItems: 'center', height: 65, flexDirection: 'row', justifyContent: 'space-between', borderBottomStartRadius: 24, borderBottomEndRadius: 24, marginHorizontal: 14 }}>
        {dados.load ?
          <View style={{ alignItems: "center", justifyContent: 'center', flex: 1 }}>
            <ActivityIndicator color={'#222'} />
          </View>
          :
          <>
            <View style={{ flex: 1, alignItems: "center" }}>

              <Text style={{ fontSize: 10, color: '#222' }}>{obterNomeMes(new Date().getMonth() - 1).toUpperCase()}</Text>
              <Text style={{ color: '#222', fontSize: 16, fontWeight: 500 }}>{formatoMoeda.format(obterSaldoMesAnterior(resumoFinanceiro))}</Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>

              <Text style={{ fontSize: 10, color: '#222' }}>{obterNomeMes(new Date().getMonth()).toUpperCase()}</Text>

              <Text style={{ color: '#222', fontSize: 16, fontWeight: 500 }}>
                {formatoMoeda.format(dados.saldoAtual)}
              </Text>
            </View>


            <View style={{ flex: 1, alignItems: "center" }}>

              <Text style={{ fontSize: 10, color: '#222' }}>FUTURO</Text>
              <Text style={{ color: '#222', fontSize: 16, fontWeight: 500 }}>{formatoMoeda.format(-dados.futurosTotal + dados.saldoAtual)}</Text>
            </View>
          </>
        }
      </View>

    </View>
  );
}