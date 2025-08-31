import { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icone from '../../componentes/Icone';
import { db } from '../../firebaseConnection';
import { collection, getDocs } from 'firebase/firestore';
import { AppContext } from '../../context/appContext';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { setUsuarioDoAS, setNotificacao } = useContext(AppContext); 
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [currentLetters, setCurrentLetters] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showError, setShowError] = useState(false);
  const [targetWords, setTargetWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [ids, setIds] = useState({}); 

  const [load, setLoad] = useState(true)

  const { colors } = useTheme();
  const NUMLETRAS = 5;

  useEffect(() => {
    setLoad(true)
    const fetchTargetWords = async () => {
      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);

        if (!querySnapshot.empty) {
          const chaves = [];
          const ids = {};
          querySnapshot.docs.forEach(doc => {
            const { chave, nome } = doc.data();

            if (chave && chave.trim() !== '') {
              const lowerChave = chave.toLowerCase();
              chaves.push(lowerChave);
              ids[lowerChave] = { usuarioId: doc.id, nome }; 
            }
          });

          setTargetWords(chaves);
          setFilteredWords(chaves);
          setIds(ids);
        } else {
          setFetchError('No user documents with valid chave found.');
        }
      } catch (error) {
        setFetchError('Failed to load passwords from database.');
      } finally {
        setLoad(false)
      }
    };

    fetchTargetWords();
  }, []);

  const generateRandomLetters = (requiredLetters) => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let letters = [...new Set(requiredLetters)]; 

    while (letters.length < 9) {
      const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (!letters.includes(randomLetter)) {
        letters.push(randomLetter);
      }
    }

    return letters.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    if (filteredWords.length > 0 && currentStep < NUMLETRAS) {
      const requiredLetters = filteredWords
        .filter(word => word.length > currentStep)
        .map(word => word[currentStep]);
      setCurrentLetters(generateRandomLetters(requiredLetters));
    } else if (currentStep < NUMLETRAS) {
      setCurrentLetters(generateRandomLetters([]));
    }
  }, [currentStep, filteredWords]);

  const handleLetterPress = async (letter) => {
    if (targetWords.length === 0) return;

    const newSelectedLetters = [...selectedLetters, letter];
    setSelectedLetters(newSelectedLetters);

    const newFilteredWords = filteredWords.filter(
      word => word.length > currentStep && word[currentStep] === letter
    );

    setFilteredWords(newFilteredWords.length > 0 ? newFilteredWords : filteredWords);

    if (newSelectedLetters.length === NUMLETRAS) {
      const selectedWord = newSelectedLetters.join('');
      if (targetWords.includes(selectedWord)) {
        try {
          const usuario = ids[selectedWord];

          await AsyncStorage.setItem('usuarioAsyncStorage', JSON.stringify(usuario));
          setUsuarioDoAS(usuario); 
            setNotificacao(`Você está logado em: ${usuario?.nome}`)
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } catch (error) {
          console.error('Error saving userData to AsyncStorage:', error);
          setFetchError('Failed to save user data.');
        }
      } else {
        setShowError(true);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleTryAgain = () => {
    setSelectedLetters([]);
    setCurrentStep(0);
    setShowError(false);
    setFilteredWords(targetWords);
  };

  const handleClearPassword = () => {
    setSelectedLetters([]);
    setCurrentStep(0);
    setFilteredWords(targetWords);
  };

  const renderIcones = () => {
    if (targetWords.length === 0) return null; 

    const totalLength = NUMLETRAS;
    const selectedCount = selectedLetters.length;
    const icons = [];

    for (let i = 0; i < selectedCount; i++) {
      icons.push(<Icone key={`sharp-${i}`} nome="medical-sharp" size={32} color={colors.receita} />);
    }

    for (let i = selectedCount; i < totalLength; i++) {
      icons.push(<Icone key={`outline-${i}`} nome="medical-outline" size={32} />);
    }

    return (
      <View style={styles.iconeContainer}>
        {icons}
        <TouchableOpacity style={styles.clearButton} onPress={handleClearPassword}>
          {selectedLetters.length > 0 && !showError ? (
            <Icone nome="close-circle-outline" size={35} color="#333" />
          ) : (
            <Icone nome="close-circle-outline" size={35} color="#eee" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {fetchError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      ) : (
        <>
          {renderIcones()}
          {showError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Senha Incorreta.</Text>
              <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
                <Text style={styles.tryAgainText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.lettersContainer}>

              {currentLetters.map((letter, index) => {
                return (

                  <TouchableOpacity
                    key={index}
                    style={[styles.letterButton, { backgroundColor: colors.botao }]}
                    onPress={() => handleLetterPress(letter)}
                    disabled={targetWords.length === 0}
                  >
                    {load ?
                      null :
                      <Text style={styles.letterText}>{letter.toUpperCase()}</Text>
                    }
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  iconeContainer: {
    flexDirection: 'row',
    marginBottom: 42,
    height: 100,
    alignItems: 'center',
  },
  lettersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 250,
  },
  letterButton: {
    width: 80,
    height: 100,
    margin: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterText: {
    fontSize: 22,
    color: '#333',
    fontWeight: '500',
    fontFamily:'Roboto-Bold'
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  tryAgainButton: {
    backgroundColor: '#db5e5eff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  tryAgainText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 10,
    width: 50,
    marginRight: -25,
  },
});

export default LoginScreen;