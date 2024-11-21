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
  Divider,
  Alert,
  AlertIcon,
  AlertDescription
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
  const [loginError, setLoginError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

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
    setLoginError('');

    try {
      let userCredential;
      if (signInMethod === 'email') {
        // Validate email and password before attempting sign in
        if (!email || !password) {
          setLoginError('Please enter both email and password');
          setIsLoading(false);
          return;
        }

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
      console.error('Login error:', error);
      
      // Specific error handling for different types of login failures
      switch(error.code) {
        case 'auth/invalid-credential':
          setLoginError('Invalid email or password. Please try again.');
          break;
        case 'auth/user-not-found':
          setLoginError('No account found with this email. Please register.');
          break;
        case 'auth/wrong-password':
          setLoginError('Incorrect password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setLoginError('Too many failed attempts. Please try again later.');
          break;
        default:
          setLoginError('Login failed. Please try again.');
      }

      toast({
        title: 'Login Error',
        description: loginError,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
        
        {loginError && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          handleSignIn('email');
        }}>
          <FormControl mb={4}>
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
          </FormControl>
          <FormControl mb={2}>
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