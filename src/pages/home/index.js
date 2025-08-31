import { useContext, useEffect, useState, useRef } from 'react';
import { View, FlatList, RefreshControl, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { AppContext } from '../../context/appContext';
import Bxsaldo from '../../componentes/bxsaldo';
import Item from '../../componentes/Item';
import Load from '../../componentes/load';

export default function Home() {
  const { saldo, dadosFinancas, futurosTotal, dadosParcelas, loadSaldo, HistoricoMovimentos, usuarioDoAS, BuscarRegistrosFuturos, BuscarSaldo } = useContext(AppContext);
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [isUserViewVisible, setIsUserViewVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    onRefresh();
    const delayTimeout = setTimeout(() => {
      setIsUserViewVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      const hideTimeout = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setIsUserViewVisible(false);
        });
      }, 7000);

      return () => clearTimeout(hideTimeout);
    }, 5000);

    return () => clearTimeout(delayTimeout);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await HistoricoMovimentos();
    await BuscarRegistrosFuturos();
    await BuscarSaldo();
    setRefreshing(false);
  };

  const sortedRegistros = dadosFinancas
    ? dadosFinancas.sort((a, b) => {
        const dateA = new Date(a.dataDoc);
        const dateB = new Date(b.dataDoc);
        return dateB - dateA;
      })
    : [];

  if (loadSaldo) return <Load />;

  return (
    <View style={styles.container}>
      <FlatList
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={<View style={styles.itemSeparator} />}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>Nenhum registro até o momento.</Text>
          </View>
        }
        ListFooterComponent={<View style={styles.footer} />}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Bxsaldo dados={{ futurosTotal, saldo, dadosParcelas }} />
            <View style={styles.notificationContainer}>
              {isUserViewVisible && (
                <Animated.View style={[styles.notification, { transform: [{ translateY: slideAnim }] }]}>
                  <Text style={[styles.notificationText, { backgroundColor: colors.alerta, color: '#fff' }]}>
                    Você está logado em: {usuarioDoAS?.nome}
                  </Text>
                </Animated.View>
              )}
            </View>
            <View style={[styles.sectionDivider, { borderBottomColor: '#e0e0e0' }]}>
              <Text style={[styles.sectionTitle, {backgroundColor:colors.background}]}>ÚLTIMOS REGISTROS</Text>
            </View>
          </View>
        }
        data={sortedRegistros}
        renderItem={({ item }) => <Item item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.contra_theme]}
            tintColor={colors.contra_theme}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemSeparator: {
    marginVertical: 3.5,
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontFamily: 'Roboto-Light',
  },
  footer: {
    height: 21,
  },
  headerContainer: {
    gap: 7,
    position: 'static',
  },
  notificationContainer: {
    overflow: 'hidden',
    height: 50,
    alignItems: 'center',
  },
  notification: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 10,
    textTransform: 'uppercase',
    padding: 6,
    borderRadius: 6,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    marginVertical: 21,
    marginTop: 14,
    marginHorizontal: 14,
  },
  sectionTitle: {
    position: 'absolute',
    top: -9,
    paddingHorizontal: 14,
    alignSelf: 'center',
    fontSize: 12,
  },
});