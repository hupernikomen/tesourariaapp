import { useContext } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AppContext } from "../../context/appContext";
import { useNavigation, useTheme } from '@react-navigation/native';


export default function Bxsaldo({ dados }) {

  const {colors} = useTheme()

  const { obterNomeMes, formatoMoeda, resumoFinanceiro,loadSaldo } = useContext(AppContext)

  const navigation = useNavigation()

  function obterSaldoMesAnterior(dados) {
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth() + 1; 

    // Calcular o mês anterior
    let mesAnterior = mesAtual - 1;
    let anoAnterior = anoAtual;

    if (mesAnterior < 1) {
      mesAnterior = 12;
      anoAnterior -= 1;
    }

    const mesAnteriorDados = dados.find(d => d.ano === anoAnterior && d.mes === mesAnterior);

    return mesAnteriorDados ? mesAnteriorDados.saldo : null

  }


  return (
    <View>
      <View style={{ marginHorizontal:14,backgroundColor: colors.theme, marginBottom: 14, alignItems: 'center', height: 75, flexDirection: 'row', justifyContent: 'space-between', borderBottomStartRadius: 28, borderBottomEndRadius: 28 }}>
        {loadSaldo ?
          <View style={{ alignItems: "center", justifyContent: 'center', flex: 1 }}>
            <ActivityIndicator color={colors.contra_theme} />
          </View>
          :
          <>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>{obterNomeMes(new Date().getMonth() - 1).toUpperCase()}</Text>
              <Text style={{ color: colors.contra_theme, fontSize: 15, fontFamily: 'Roboto-Medium' }}>{formatoMoeda.format(obterSaldoMesAnterior(resumoFinanceiro))}</Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>{obterNomeMes(new Date().getMonth()).toUpperCase()}</Text>
              <Text style={{ color: colors.contra_theme, fontSize: 15, fontFamily: 'Roboto-Medium' }}>{formatoMoeda.format(dados.saldoAtual)}</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Futuro')} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 10, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>FUTURO</Text>
              <Text style={{ color: colors.contra_theme, fontSize: 15, fontFamily: 'Roboto-Medium' }}>{formatoMoeda.format(-dados.futurosTotal + dados.saldoAtual)}</Text>
            </TouchableOpacity>
          </>
        }
      </View>
    </View>
  );
}
