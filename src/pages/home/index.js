import { useContext, useEffect, useState, useRef } from 'react';
import { View, FlatList, RefreshControl, Text, Animated } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { AppContext } from '../../context/appContext';
import Bxsaldo from '../../componentes/bxsaldo';
import Item from '../../componentes/Item';
import Icone from '../../componentes/Icone';
import Load from '../../componentes/load';

export default function Home() {
  const { saldo, dadosFinancas, futurosTotal, dadosParcelas, loadSaldo, HistoricoMovimentos, usuarioDoAS, BuscarRegistrosFuturos, BuscarSaldo } = useContext(AppContext);
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [isUserViewVisible, setIsUserViewVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current; // Inicia fora da tela (acima)

  // Animação com atraso de 3 segundos
  useEffect(() => {
    onRefresh();
    const delayTimeout = setTimeout(() => {
      setIsUserViewVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0, // Slide de cima para baixo
        duration: 1000,
        useNativeDriver: true,
      }).start();

      const hideTimeout = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -50, // Slide de volta para cima
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setIsUserViewVisible(false);
        });
      }, 5000); // 5 segundos de visibilidade

      return () => clearTimeout(hideTimeout);
    }, 5000); // 3 segundos de atraso

    return () => clearTimeout(delayTimeout);
  }, []); // Dependência vazia para rodar apenas no mount

  // Função de refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await HistoricoMovimentos();
    await BuscarRegistrosFuturos()
    await BuscarSaldo()
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
    <View style={{ flex: 1 }}>
      <FlatList
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={<View style={{ marginVertical: 3.5 }} />}
        ListEmptyComponent={<View style={{ alignItems: 'center', justifyContent: "center" }}><Text style={{ fontFamily: 'Roboto-Light' }}>Nenhum registro até o momento.</Text></View>}
        ListFooterComponent={<View style={{ height: 21 }} />}
        ListHeaderComponent={
          <View style={{ gap: 7, position: 'static' }}>
            {isUserViewVisible && (
              <Animated.View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  paddingVertical: 7,
                  backgroundColor: colors.contra_theme,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                <Icone nome={'user'} size={16} color='#fff' />
                <Text style={{ fontFamily: 'Roboto-Medium', fontSize: 11, textTransform: 'uppercase', color: '#fff' }}>
                  Você está logado em: {usuarioDoAS?.nome}
                </Text>
              </Animated.View>
            )}
            <Bxsaldo dados={{ futurosTotal, saldo, dadosParcelas }} />
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: '#e0e0e0',
                marginVertical: 14,
              }}
            />
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