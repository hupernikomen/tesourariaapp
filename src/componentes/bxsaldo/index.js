import { useContext, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { AppContext } from "../../context/appContext";
import { useNavigation, useTheme } from '@react-navigation/native';

export default function Bxsaldo({ dados }) {
  const { colors } = useTheme();
  const { obterNomeMes, formatoMoeda, resumoFinanceiro, loadSaldo } = useContext(AppContext);
  const navigation = useNavigation();

  // Animation setup
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Configura a animação de piscar
  useEffect(() => {
    const piscar = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    piscar.start();
    return () => piscar.stop();
  }, [fadeAnim]);

  useEffect(() => {
    if (!loadSaldo) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          delay: 300,
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);
    }
  }, [loadSaldo]);

  const isVencido = dados?.dadosParcelas?.[0]?.parcelas?.some((parcela) => new Date(parcela.dataDoc) < new Date()) || false;

  function obterSaldoMesAnterior(dados, dataAtual = new Date()) {
    if (!dados || !Array.isArray(dados)) {
      console.warn('Dados inválidos ou ausentes');
      return 0;
    }

    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth() + 1;

    let mesAnterior = mesAtual - 1;
    let anoAnterior = anoAtual;

    if (mesAnterior < 1) {
      mesAnterior = 12;
      anoAnterior -= 1;
    }

    const mesAnteriorDados = dados.find(d => d.ano === anoAnterior && d.mes === mesAnterior);
    return mesAnteriorDados ? mesAnteriorDados.saldo : 0;
  }

  return (
    <View>
      <View style={[styles.headerContainer, { backgroundColor: colors.botao }]}>
        <Animated.View style={[styles.animatedContainer, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
          <View style={styles.balanceContainer}>
            <Text style={[styles.monthText, { color: colors.contra_theme }]}>
              {obterNomeMes(new Date().getMonth() - 1).toUpperCase()}
            </Text>
            <Text style={[styles.balanceText, { color: colors.contra_theme }]}>
              {formatoMoeda.format(obterSaldoMesAnterior(resumoFinanceiro))}
            </Text>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={[styles.monthText, { color: colors.contra_theme }]}>
              {obterNomeMes(new Date().getMonth()).toUpperCase()}
            </Text>
            <Text style={[styles.balanceText, { color: colors.contra_theme }]}>
              {formatoMoeda.format(dados.saldo)}
            </Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Futuro')} style={styles.balanceContainer}>
            <Animated.Text style={[styles.monthText, { color: colors.contra_theme, opacity: isVencido ? fadeAnim : 1}]}>FUTURO</Animated.Text>
            <Text style={[styles.balanceText, { color: colors.contra_theme }]}>
              {formatoMoeda.format(-dados.futurosTotal + dados.saldo)}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  animatedContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 70,
    alignItems: 'center',
  },
  balanceContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 10,
    fontFamily: 'Roboto-Light',
    textTransform: 'uppercase',
  },
  balanceText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  alertDot: {
    width: 8,
    aspectRatio: 1,
    position: 'absolute',
    right: 30,
    borderRadius: 10,
    top: -4,
  },
});