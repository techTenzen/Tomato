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
  useColorModeValue,
  useBreakpointValue,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Badge
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { app } from '../firebase/Firebase';
import { Menu as MenuIcon, ShoppingCart } from 'lucide-react';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0); // Add cart count state
  const navigate = useNavigate();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load cart count from localStorage or your state management solution
  useEffect(() => {
    const loadCartCount = () => {
      const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
      setCartCount(cartItems.length);
    };

    loadCartCount();
    // Add event listener for cart updates if you have one
    window.addEventListener('cartUpdate', loadCartCount);
    return () => window.removeEventListener('cartUpdate', loadCartCount);
  }, []);

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
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navBg = useColorModeValue('white', 'gray.800');
  const navShadow = useColorModeValue('md', 'dark-lg');

  const CartButton = () => (
    <Button
      leftIcon={<ShoppingCart size={20} />}
      variant="solid"
      colorScheme="orange"
      size={isMobile ? "sm" : "md"}
      onClick={() => navigate('/cart')}
      position="relative"
    >
      Cart
      {cartCount > 0 && (
        <Badge
          colorScheme="red"
          position="absolute"
          top="-8px"
          right="-8px"
          borderRadius="full"
        >
          {cartCount}
        </Badge>
      )}
    </Button>
  );

  const NavContent = () => (
    <>
      <Menu>
        <MenuButton ml={4}>
          <Flex align="center">
            <Avatar
              size="sm"
              name={user?.email}
              mr={2}
            />
            <Text fontWeight="medium" display={{ base: "none", md: "block" }}>
              {user?.email}
            </Text>
          </Flex>
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => {
            navigate('/profile');
            onClose();
          }}>
            Profile
          </MenuItem>
          {user?.role === 'admin' && (
            <MenuItem onClick={() => {
              navigate('/admin/shops');
              onClose();
            }}>
              Admin Dashboard
            </MenuItem>
          )}
          {user?.role === 'vendor' && (
            <MenuItem onClick={() => {
              navigate(`/vendor/items`);
              onClose();
            }}>
              Vendor Dashboard
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </MenuList>
      </Menu>
    </>
  );

  const AuthButtons = () => (
    <Flex direction={isMobile ? "column" : "row"} gap={2}>
      <Button
        colorScheme="blue"
        variant="outline"
        onClick={() => {
          navigate('/login');
          onClose();
        }}
        w={isMobile ? "full" : "auto"}
      >
        Login
      </Button>
      <Button
        colorScheme="green"
        onClick={() => {
          navigate('/register');
          onClose();
        }}
        w={isMobile ? "full" : "auto"}
      >
        Register
      </Button>
    </Flex>
  );

  return (
    <>
      <Box
        position="sticky"
        top="0"
        left="0"
        right="0"
        zIndex="1000"
        transition="all 0.3s ease-in-out"
        opacity={scrolled ? 0.95 : 1}
      >
        <Flex
          as="nav"
          align="center"
          justify="space-between"
          wrap="wrap"
          padding="1.5rem"
          bg={navBg}
          boxShadow={scrolled ? navShadow : 'none'}
          transition="all 0.3s ease"
        >
          <Flex align="center" mr={5}>
            <Text fontSize="lg" fontWeight="bold">
              <Link to="/">FOST</Link>
            </Text>
          </Flex>

          {isMobile ? (
            <>
              <Flex gap={4} align="center">
                <CartButton />
                <IconButton
                  aria-label="Open menu"
                  icon={<MenuIcon />}
                  onClick={onOpen}
                  variant="ghost"
                />
              </Flex>
              <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
                <DrawerOverlay />
                <DrawerContent>
                  <DrawerCloseButton />
                  <DrawerHeader>Menu</DrawerHeader>
                  <DrawerBody>
                    <VStack spacing={4} align="stretch">
                      {user ? (
                        <VStack spacing={4} align="stretch">
                          <Text fontWeight="medium">{user.email}</Text>
                          <Button onClick={() => {
                            navigate('/profile');
                            onClose();
                          }} w="full">
                            Profile
                          </Button>
                          {user.role === 'admin' && (
                            <Button onClick={() => {
                              navigate('/admin/shops');
                              onClose();
                            }} w="full">
                              Admin Dashboard
                            </Button>
                          )}
                          {user.role === 'vendor' && (
                            <Button onClick={() => {
                              navigate(`/vendor/items`);
                              onClose();
                            }} w="full">
                              Vendor Dashboard
                            </Button>
                          )}
                          <Button onClick={handleLogout} w="full" colorScheme="red">
                            Logout
                          </Button>
                        </VStack>
                      ) : (
                        <AuthButtons />
                      )}
                    </VStack>
                  </DrawerBody>
                </DrawerContent>
              </Drawer>
            </>
          ) : (
            <Flex align="center" gap={4}>
              <CartButton />
              {user ? <NavContent /> : <AuthButtons />}
            </Flex>
          )}
        </Flex>
      </Box>
    </>
  );
};

export default Navbar;