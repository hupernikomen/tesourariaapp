import { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icone from '../../componentes/Icone';
import { db } from '../../firebaseConnection';
import { collection, getDocs } from 'firebase/firestore';
import { AppContext } from '../../context/appContext';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { setUsuarioDoAS } = useContext(AppContext); // Access setIdUsuario from AppContext
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [currentLetters, setCurrentLetters] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showError, setShowError] = useState(false);
  const [targetWords, setTargetWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [ids, setIds] = useState({}); // Store chave-to-{usuarioId, nome} mapping

  const [load, setLoad] = useState(true)

  const { colors } = useTheme();
  const NUMLETRAS = 5;

  // Fetch all chave words and their corresponding user IDs and names from Firestore
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
              ids[lowerChave] = { usuarioId: doc.id, nome }; // Map chave to {usuarioId, nome}
            }
          });

          setTargetWords(chaves);
          setFilteredWords(chaves);
          setIds(ids);
        } else {
          setFetchError('No user documents with valid chave found.');
        }
      } catch (error) {
        console.error('Error fetching chaves from Firestore:', error);
        setFetchError('Failed to load passwords from database.');
      } finally {
        setLoad(false)
      }
    };

    fetchTargetWords();
  }, []);

  // Generate random letters including the first letters of remaining filtered words
  const generateRandomLetters = (requiredLetters) => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let letters = [...new Set(requiredLetters)]; // Unique required letters

    // Generate additional random letters to reach 9
    while (letters.length < 9) {
      const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (!letters.includes(randomLetter)) {
        letters.push(randomLetter);
      }
    }

    // Shuffle the letters
    return letters.sort(() => Math.random() - 0.5);
  };

  // Update current letters based on current step and filtered words
  useEffect(() => {
    if (filteredWords.length > 0 && currentStep < NUMLETRAS) {
      const requiredLetters = filteredWords
        .filter(word => word.length > currentStep)
        .map(word => word[currentStep]);
      setCurrentLetters(generateRandomLetters(requiredLetters));
    } else if (currentStep < NUMLETRAS) {
      // If no filtered words remain, generate 9 random letters
      setCurrentLetters(generateRandomLetters([]));
    }
  }, [currentStep, filteredWords]);

  // Handle letter selection
  const handleLetterPress = async (letter) => {
    if (targetWords.length === 0) return; // Prevent interaction if no valid words

    const newSelectedLetters = [...selectedLetters, letter];
    setSelectedLetters(newSelectedLetters);

    // Filter words based on the selected letter (for display purposes)
    const newFilteredWords = filteredWords.filter(
      word => word.length > currentStep && word[currentStep] === letter
    );

    // If no words match the selection, still allow progression
    setFilteredWords(newFilteredWords.length > 0 ? newFilteredWords : filteredWords);

    if (newSelectedLetters.length === NUMLETRAS) {
      // Check if selected word is valid after 5 letters
      const selectedWord = newSelectedLetters.join('');
      if (targetWords.includes(selectedWord)) {
        // Store usuarioId and nome as a JSON object in AsyncStorage and set usuarioId in AppContext
        try {
          const usuario = ids[selectedWord];

          await AsyncStorage.setItem('usuarioAsyncStorage', JSON.stringify(usuario));
          setUsuarioDoAS(usuario); // Set usuarioId in AppContext
          // Reset navigation stack to Main
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
      // Move to next step
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle try again
  const handleTryAgain = () => {
    setSelectedLetters([]);
    setCurrentStep(0);
    setShowError(false);
    setFilteredWords(targetWords); // Reset filtered words
  };

  // Handle clear password
  const handleClearPassword = () => {
    setSelectedLetters([]);
    setCurrentStep(0);
    setFilteredWords(targetWords); // Reset filtered words
  };

  // Render Icone components for selected letters
  const renderIcones = () => {
    if (targetWords.length === 0) return null; // Don't render if no target words

    const totalLength = NUMLETRAS; // Fixed to 5 letters
    const selectedCount = selectedLetters.length;
    const icons = [];

    // Add medical-sharp for selected letters
    for (let i = 0; i < selectedCount; i++) {
      icons.push(<Icone key={`sharp-${i}`} nome="medical-sharp" size={26} color={colors.receita} />);
    }
    // Add medical-outline for remaining letters
    for (let i = selectedCount; i < totalLength; i++) {
      icons.push(<Icone key={`outline-${i}`} nome="medical-outline" size={26} />);
    }

    return (
      <View style={styles.iconeContainer}>
        {icons}
        <TouchableOpacity style={styles.clearButton} onPress={handleClearPassword}>
          {selectedLetters.length > 0 && !showError ? (
            <Icone nome="close-circle-outline" size={32} color="#333" />
          ) : (
            <Icone nome="close-circle-outline" size={32} color="#eee" />
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
    width: 70,
    height: 70,
    margin: 3.5,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterText: {
    fontSize: 22,
    color: '#333',
    fontWeight: '500',
    fontFamily:'Raleway-Bold'
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