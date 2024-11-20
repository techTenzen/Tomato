import React, { useState } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Input, 
  Button, 
  Text, 
  Link, 
  useToast, 
  FormControl, 
  FormErrorMessage, 
  Divider 
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { auth, firestore } from '../../Components/firebase/Firebase';
import backgroundImage from '../../Assets/WhatsApp Image 2024-11-20 at 10.00.05 PM.jpeg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const saveUserToLocalStorage = async (user) => {
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      const userData = userDoc.exists() 
        ? userDoc.data() 
        : { email: user.email, role: 'customer' };

      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: userData.role,
        shopId: userData.shopId || null
      }));

      return userData.role;
    } catch (error) {
      console.error("Error saving user:", error);
      return 'customer';
    }
  };

  const handleSignIn = async (signInMethod) => {
    setIsLoading(true);
    setEmailError('');
    setPasswordError('');

    try {
      let userCredential;
      if (signInMethod === 'email') {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        const provider = new GoogleAuthProvider();
        userCredential = await signInWithPopup(auth, provider);
      }

      const userRole = await saveUserToLocalStorage(userCredential.user);
      
      toast({
        title: 'Login Successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate based on user role
      switch(userRole) {
        case 'admin':
          navigate('/admin/shops');
          break;
        case 'vendor':
          navigate('/vendor/items');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Login Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });

      if (error.message.includes('email')) {
        setEmailError(error.message);
      } else if (error.message.includes('password')) {
        setPasswordError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex justify="center" align="center" h="100vh" bg={`url(${backgroundImage}) no-repeat center/cover`} bgSize="cover">
      <Box w="400px" p={6} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
        <Heading mb={1} fontWeight="bold" fontSize="3xl">
          Login
        </Heading>
        <Text mb={6} color="gray.500">To get started</Text>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSignIn('email');
        }}>
          <FormControl isInvalid={!!emailError} mb={4}>
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              bg="gray.100"
              borderRadius="md"
              height="50px"
              _placeholder={{ color: 'gray.500' }}
            />
            {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!passwordError} mb={2}>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              bg="gray.100"
              borderRadius="md"
              height="50px"
              _placeholder={{ color: 'gray.500' }}
            />
            {passwordError && <FormErrorMessage>{passwordError}</FormErrorMessage>}
          </FormControl>
          <Button 
            colorScheme="blue" 
            w="full" 
            type="submit" 
            height="50px" 
            borderRadius="md" 
            isLoading={isLoading} 
            fontWeight="bold" 
            fontSize="lg"
          >
            Continue
          </Button>
        </form>

        <Divider my={6} />

        <Button 
          colorScheme="red" 
          w="full" 
          height="50px" 
          borderRadius="md" 
          fontWeight="bold" 
          fontSize="lg" 
          onClick={() => handleSignIn('google')}
          isLoading={isLoading}
        >
          Sign in with Google
        </Button>

        <Text mt={4} textAlign="center">
          New User? <Link href="/register" color="blue.500" fontWeight="bold">Register</Link>
        </Text>
      </Box>
    </Flex>
  );
};

export default Login;