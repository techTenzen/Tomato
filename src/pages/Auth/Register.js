import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Input, 
  Button, 
  Text, 
  Link, 
  useToast, 
  Select,
  FormControl,
  FormErrorMessage
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  collection, 
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { auth, firestore } from '../../Components/firebase/Firebase';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [shopId, setShopId] = useState('');
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [restrictions, setRestrictions] = useState({
    adminExists: false,
    shopVendorMap: {}
  });

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRegistrationConstraints = async () => {
      try {
        const usersRef = collection(firestore, 'users');
        
        // Check admin existence
        const adminQuery = query(usersRef, where('role', '==', 'admin'));
        const adminSnapshot = await getDocs(adminQuery);
        
        // Check vendor-shop mapping
        const vendorQuery = query(usersRef, where('role', '==', 'vendor'));
        const vendorSnapshot = await getDocs(vendorQuery);
        
        const shopVendorMap = {};
        vendorSnapshot.forEach(doc => {
          const vendorData = doc.data();
          if (vendorData.shopId) {
            shopVendorMap[vendorData.shopId] = true;
          }
        });

        setRestrictions({
          adminExists: !adminSnapshot.empty,
          shopVendorMap
        });
      } catch (error) {
        console.error('Error checking registration constraints:', error);
      }
    };

    const fetchShops = async () => {
      const shopsRef = collection(firestore, 'shops');
      const snapshot = await getDocs(shopsRef);
      const availableShops = snapshot.docs
        .filter(doc => !restrictions.shopVendorMap[doc.id])
        .map(doc => ({ id: doc.id, ...doc.data() }));
      
      setShops(availableShops);
    };

    checkRegistrationConstraints();
    fetchShops();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setIsLoading(true);

    // Password validation
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Role-specific validations
    if (role === 'admin' && restrictions.adminExists) {
      toast({
        title: 'Registration Restricted',
        description: 'An admin already exists',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    if (role === 'vendor' && !shopId) {
      toast({
        title: 'Shop Selection Required',
        description: 'Please select a shop',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        role: role,
        shopId: role === 'vendor' ? shopId : null,
        createdAt: new Date()
      });

      toast({
        title: 'Registration Successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      switch(role) {
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
        title: 'Registration Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex justify="center" align="center" h="100vh" bg="gray.100">
      <Box w="400px" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
        <Heading mb={4} fontWeight="bold" fontSize="2xl">
          Register
        </Heading>
        <form onSubmit={handleRegister}>
          <FormControl mb={4}>
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              bg="gray.100"
              borderRadius="md"
              height="50px"
            />
          </FormControl>
          <FormControl mb={4} isInvalid={!!passwordError}>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              bg="gray.100"
              borderRadius="md"
              height="50px"
            />
          </FormControl>
          <FormControl mb={4} isInvalid={!!passwordError}>
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              bg="gray.100"
              borderRadius="md"
              height="50px"
            />
            {passwordError && (
              <FormErrorMessage>{passwordError}</FormErrorMessage>
            )}
          </FormControl>
          
          <Select 
            mb={4} 
            placeholder="Select Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="customer">Customer</option>
            {!restrictions.adminExists && <option value="admin">Admin</option>}
            <option value="vendor">Vendor</option>
          </Select>

          {role === 'vendor' && (
            <Select 
              mb={4}
              placeholder="Select Your Shop"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
            >
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </Select>
          )}

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
            Register
          </Button>
        </form>
        <Text mt={4} textAlign="center">
          Already Have an account? <Link href="/login" color="blue.500" fontWeight="bold">Login</Link>
        </Text>
      </Box>
    </Flex>
  );
};

export default Register;