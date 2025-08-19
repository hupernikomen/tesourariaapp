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

  // Referência para o valor animado da opacidade
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Configura a animação de piscar
  useEffect(() => {
    const piscar = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0, // Opacidade vai para 0 (invisível)
          duration: 200, // Meio segundo para desaparecer
          useNativeDriver: true, // Usa driver nativo para melhor desempenho
        }),
        Animated.timing(fadeAnim, {
          toValue: .4, // Opacidade volta para 1 (visível)
          duration: 600, // Meio segundo para reaparecer
          useNativeDriver: true,
        }),
      ])
    );

    piscar.start(); // Inicia a animação

    return () => piscar.stop(); // Para a animação quando o componente é desmontado
  }, [fadeAnim, loadSaldo]);

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
        alignItems: 'center',
        flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.botao,
      }}>
        {loadSaldo ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, height: 65 }}>
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
              height: 65,
              alignItems: 'center'
            }}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>
                {obterNomeMes(new Date().getMonth() - 1).toUpperCase()}
              </Text>
              <Text style={{ color: colors.contra_theme, fontSize: 15, fontFamily: 'Roboto-Medium' }}>
                {formatoMoeda.format(obterSaldoMesAnterior(resumoFinanceiro))}
              </Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>
                {obterNomeMes(new Date().getMonth()).toUpperCase()}
              </Text>
              <Text style={{ color: colors.contra_theme, fontSize: 15, fontFamily: 'Roboto-Medium' }}>
                {formatoMoeda.format(dados.saldoAtual)}
              </Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Futuro')} style={{ flex: 1, alignItems: 'center' }}>
              {isVencido? <Animated.View
                style={{
                  width: 8,
                  aspectRatio: 1,
                  backgroundColor: colors.alerta,
                  position: 'absolute',
                  right: 30,
                  borderRadius: 10,
                  top: -4,
                  opacity: fadeAnim, // Aplica a opacidade animada
                }}
              />: null}
              <Text style={{ fontSize: 10, color: colors.contra_theme, fontFamily: 'Roboto-Light' }}>FUTURO</Text>
              <Text style={{ color: colors.contra_theme, fontSize: 15, fontFamily: 'Roboto-Medium' }}>
                {formatoMoeda.format(-dados.futurosTotal + dados.saldoAtual)}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>


    </View>
  );
}