import { useContext, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { AppContext } from "../../context/appContext";
import { useNavigation, useTheme } from '@react-navigation/native';

export default function Bxsaldo({ dados }) {
  const { colors } = useTheme();
  const { obterNomeMes, formatoMoeda, resumoFinanceiro, loadSaldo } = useContext(AppContext);
  const navigation = useNavigation();

  // Animation setup
  const slideAnim = useRef(new Animated.Value(-100)).current; // Start position: -100 (above the view)
  const opacityAnim = useRef(new Animated.Value(0)).current; // Start opacity: 0 (invisible)

  useEffect(() => {
    if (!loadSaldo) {
      // When loadSaldo is false, animate content in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0, // Move to original position
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1, // Fade in
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // When loadSaldo is true, reset to hidden state
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);
    }
  }, [loadSaldo]);

  function obterSaldoMesAnterior(dados) {
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth() + 1;

    let mesAnterior = mesAtual - 1;
    let anoAnterior = anoAtual;

    if (mesAnterior < 1) {
      mesAnterior = 12;
      anoAnterior -= 1;
    }

    const mesAnteriorDados = dados.find(d => d.ano === anoAnterior && d.mes === mesAnterior);
    return mesAnteriorDados ? mesAnteriorDados.saldo : null;
  }

  return (
    <View>
      <View style={{ marginHorizontal: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', }}>
        {loadSaldo ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, height: 70 }}>
            <ActivityIndicator color={colors.receita} />
          </View>
        ) : (
          <Animated.View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
              backgroundColor: colors.theme,
              borderBottomStartRadius: 28,
              borderBottomEndRadius: 28,
              height: 70,
              alignItems: 'center'
            }}
          >
            <View style={{ flex: 1, alignItems: 'center', gap:3 }}>
              <Text style={{ fontSize: 11, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>
                {obterNomeMes(new Date().getMonth() - 1).toUpperCase()}
              </Text>
              <Text style={{ color: colors.contra_theme, fontSize: 14, fontFamily: 'Roboto-Regular' }}>
                R$ {formatoMoeda.format(obterSaldoMesAnterior(resumoFinanceiro))}
              </Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1, gap:3 }}>
              <Text style={{ fontSize: 10, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>
                {obterNomeMes(new Date().getMonth()).toUpperCase()}
              </Text>
              <Text style={{ color: colors.contra_theme, fontSize: 14, fontFamily: 'Roboto-Regular' }}>
                R$ {formatoMoeda.format(dados.saldoAtual)}
              </Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Futuro')} style={{ flex: 1, alignItems: 'center', gap:3 }}>
              <Text style={{ fontSize: 10, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>FUTURO</Text>
              <Text style={{ color: colors.contra_theme, fontSize: 14, fontFamily: 'Roboto-Regular' }}>
                R$ {formatoMoeda.format(-dados.futurosTotal + dados.saldoAtual)}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}