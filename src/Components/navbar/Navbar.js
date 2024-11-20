import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  Avatar, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  useColorModeValue 
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { app } from '../firebase/Firebase';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDocRef = doc(firestore, 'users', authUser.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data();

          const fullUserData = {
            uid: authUser.uid,
            email: authUser.email,
            role: userData?.role || 'customer',
            shopId: userData?.shopId || null
          };

          setUser(fullUserData);
          localStorage.setItem('user', JSON.stringify(fullUserData));
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navBg = useColorModeValue('white', 'gray.800');
  const navShadow = useColorModeValue('md', 'dark-lg');

  return (
    <Flex 
      as="nav" 
      align="center" 
      justify="space-between" 
      wrap="wrap" 
      padding="1.5rem" 
      bg={navBg} 
      boxShadow={navShadow}
    >
      <Flex align="center" mr={5}>
        <Text fontSize="lg" fontWeight="bold">
          <Link to="/">FOST</Link>
        </Text>
      </Flex>

      <Flex align="center">
        {user ? (
          <>
            <Link to="/cart">
              <Button variant="solid" colorScheme="orange" mr={4}>
                Cart
              </Button>
            </Link>
            <Menu>
              <MenuButton>
                <Flex align="center">
                  <Avatar 
                    size="sm" 
                    name={user.email} 
                    mr={2} 
                  />
                  <Text fontWeight="medium">{user.email}</Text>
                </Flex>
              </MenuButton>
              <MenuList>
                {user.role === 'admin' && (
                  <MenuItem onClick={() => navigate('/admin/shops')}>
                    Admin Dashboard
                  </MenuItem>
                )}
                {user.role === 'vendor' && (
                  <MenuItem onClick={() => navigate(`/vendor/items`)}>
                    Vendor Dashboard
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </MenuList>
            </Menu>
          </>
        ) : (
          <Flex>
            <Button 
              colorScheme="blue" 
              mr={3} 
              variant="outline"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button 
              colorScheme="green"
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default Navbar;