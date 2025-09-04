import { useContext, useEffect, useState, useRef, useLayoutEffect } from 'react';
import { View, FlatList, RefreshControl, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { AppContext } from '../../context/appContext';
import Bxsaldo from '../../componentes/bxsaldo';
import Item from '../../componentes/Item';
import Load from '../../componentes/load';
import Avisos from '../../componentes/Avisos';

export default function Home() {
  const { saldo, dadosFinancas, futurosTotal, dadosParcelas, load, setLoad, HistoricoMovimentos, notificacao, setNotificacao, BuscarRegistrosFuturos, BuscarSaldo, aviso, setAviso } = useContext(AppContext);
  const { cores } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;



  useEffect(() => {
    setLoad(true)
    Promise.all([HistoricoMovimentos(), BuscarRegistrosFuturos(), BuscarSaldo()]).finally(() => setLoad(false))

    const delayTimeout = setTimeout(() => {
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
        });
      }, 7000);

      return () => clearTimeout(hideTimeout);
    }, 5000);

    return () => clearTimeout(delayTimeout);
  }, [notificacao]);

  const onRefresh = async () => {
    setNotificacao('')
    setRefreshing(true);
    await Promise.all([HistoricoMovimentos(), BuscarRegistrosFuturos(), BuscarSaldo()])
    setRefreshing(false);
  };

  const sortedRegistros = dadosFinancas
    ? dadosFinancas.sort((a, b) => {
      const dateA = new Date(a.dataDoc);
      const dateB = new Date(b.dataDoc);
      return dateB - dateA;
    })
    : [];

  if (load) return <Load />

  return (
    <View style={styles.container}>
      <Avisos visible={aviso} setAviso={setAviso} message={aviso.mensagem} title={aviso.titulo} />
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
              {notificacao && (
                <Animated.View style={[styles.notification, { transform: [{ translateY: slideAnim }] }]}>
                  <Text style={[styles.notificationText, { backgroundColor: cores.preto, color: '#fff' }]}>
                    {notificacao}
                  </Text>
                </Animated.View>
              )}
            </View>
            {sortedRegistros.length > 0 ? <View style={[styles.sectionDivider, { borderBottomColor: '#e0e0e0' }]}>
              <Text style={[styles.sectionTitle, { backgroundColor: cores.background }]}>ÚLTIMOS REGISTROS</Text>
            </View> : null}
          </View>
        }
        data={sortedRegistros}

        renderItem={({ item }) => <Item item={item} />}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[cores.preto]}
            tintColor={cores.preto}
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
    marginVertical: 14
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
    height: 40,
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
    fontSize: 13,
  },
});