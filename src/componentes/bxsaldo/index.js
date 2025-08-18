import { useContext, useEffect, useRef, useState } from 'react';
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
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1, // Fade in
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // When loadSaldo is true, reset to hidden state
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);

    }
  }, [loadSaldo]);
  const isVencido = dados?.dadosParcelas?.[0]?.parcelas?.some((parcela) => new Date(parcela.dataDoc) < new Date()) || false;

  function obterSaldoMesAnterior(dados) {
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth();

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
      <View style={{
        alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.theme, elevation: 5, borderBottomStartRadius: 35,
        borderBottomEndRadius: 35,
      }}>
        {loadSaldo ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, height: 60 }}>
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
              borderBottomStartRadius: 35,
              borderBottomEndRadius: 35,
              height: 60,
              alignItems: 'center'
            }}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>
                {obterNomeMes(new Date().getMonth() - 1).toUpperCase()}
              </Text>
              <Text style={{ color: colors.contra_theme, fontSize: 14, fontFamily: 'Roboto-Regular' }}>
                {formatoMoeda.format(obterSaldoMesAnterior(resumoFinanceiro))}
              </Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>
                {obterNomeMes(new Date().getMonth()).toUpperCase()}
              </Text>
              <Text style={{ color: colors.contra_theme, fontSize: 14, fontFamily: 'Roboto-Regular' }}>
                {formatoMoeda.format(dados.saldoAtual)}
              </Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Futuro')} style={{ flex: 1, alignItems: 'center' }}>

              <Text style={{ fontSize: 10, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>FUTURO</Text>
              <Text style={{ color: colors.contra_theme, fontSize: 14, fontFamily: 'Roboto-Regular' }}>
                {formatoMoeda.format(-dados.futurosTotal + dados.saldoAtual)}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {isVencido ?
        <View style={{ alignItems: "center", padding: 7 }}>
          <Text style={{ fontSize: 10, fontWeight: 300, color: '#fff', backgroundColor: colors.alerta, paddingHorizontal: 14, borderRadius: 14, paddingVertical: 4 }}>EXISTEM CONTAS PENDENTES</Text>
        </View> : null}
    </View>
  );
}