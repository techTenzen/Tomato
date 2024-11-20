import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Container,
  SimpleGrid,
  Image, 
  Text, 
  VStack, 
  Heading, 
  Spinner, 
  Alert, 
  AlertIcon,
  useToast,
  Button,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stack,
  IconButton
} from '@chakra-ui/react';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc 
} from 'firebase/firestore';
import { app } from '../../Components/firebase/Firebase';

const Shop = () => {
  const [items, setItems] = useState([]);
  const [shopDetails, setShopDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const { shopId } = useParams();
  const firestore = getFirestore(app);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        
        // First, fetch shop details
        const shopRef = doc(firestore, 'shops', shopId);
        const shopSnap = await getDoc(shopRef);
        
        if (!shopSnap.exists()) {
          throw new Error('Shop not found');
        }
        
        const shopData = {
          id: shopSnap.id,
          ...shopSnap.data()
        };
        setShopDetails(shopData);

        // Then, fetch items using the shop's vendorId
        const itemsRef = collection(firestore, 'items');
        const q = query(
          itemsRef, 
          where('vendorId', '==', shopData.vendorId)
        );
        
        const snapshot = await getDocs(q);
        const itemsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setItems(itemsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shop data:', error);
        setError(error.message);
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Could not fetch shop details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    if (shopId) {
      fetchShopData();
    }
  }, [shopId, firestore, toast]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    onOpen();
  };

  const addToCart = (item) => {
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const itemIndex = existingCart.findIndex(cartItem => cartItem.id === item.id);
    
    if (itemIndex > -1) {
      existingCart[itemIndex].quantity = (existingCart[itemIndex].quantity || 1) + 1;
    } else {
      existingCart.push({
        ...item,
        quantity: 1,
        shopId: shopId,
        shopName: shopDetails?.name
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    toast({
      title: 'Added to Cart',
      description: `${item.name} has been added to your cart`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" minH="50vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" p={6}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {shopDetails && (
          <Box textAlign="center">
            <Box position="relative" height="300px" mb={6}>
              <Image 
                src={shopDetails.imageUrl} 
                alt={shopDetails.name}
                w="100%"
                h="100%"
                objectFit="cover"
                borderRadius="xl"
              />
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                bg="blackAlpha.600"
                p={4}
                borderBottomRadius="xl"
              >
                <Heading color="white">{shopDetails.name}</Heading>
                {shopDetails.description && (
                  <Text color="whiteAlpha.900" mt={2}>
                    {shopDetails.description}
                  </Text>
                )}
              </Box>
            </Box>
          </Box>
        )}

        <Box>
          <Heading size="lg" mb={6}>Available Items</Heading>
          
          {items.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              No items available in this shop yet.
            </Alert>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
              {items.map((item) => (
                <Box
                  key={item.id}
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="sm"
                  transition="all 0.2s"
                  _hover={{
                    transform: 'translateY(-4px)',
                    boxShadow: 'md',
                  }}
                  bg="white"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    height="200px"
                    width="100%"
                    objectFit="cover"
                    cursor="pointer"
                    onClick={() => handleItemClick(item)}
                  />
                  
                  <Box p={4}>
                    <Heading size="md" mb={2}>{item.name}</Heading>
                    <Text color="gray.600" noOfLines={2} mb={3}>
                      {item.description}
                    </Text>
                    
                    <Flex justify="space-between" align="center">
                      <Text
                        color="green.600"
                        fontSize="xl"
                        fontWeight="bold"
                      >
                        ${item.price.toFixed(2)}
                      </Text>
                      <Button
                        colorScheme="blue"
                        onClick={() => addToCart(item)}
                      >
                        Add to Cart
                      </Button>
                    </Flex>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>

        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <Flex justify="space-between" align="center">
                {selectedItem?.name}
                <IconButton
                  onClick={onClose}
                  variant="ghost"
                  aria-label="Close"
                >
                  ✕
                </IconButton>
              </Flex>
            </ModalHeader>
            <ModalBody pb={6}>
              {selectedItem && (
                <Stack spacing={4}>
                  <Image
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    borderRadius="md"
                    objectFit="cover"
                    maxH="400px"
                    w="100%"
                  />
                  
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">
                    ${selectedItem.price.toFixed(2)}
                  </Text>
                  
                  <Text color="gray.700">
                    {selectedItem.description}
                  </Text>
                  
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={() => {
                      addToCart(selectedItem);
                      onClose();
                    }}
                  >
                    Add to Cart
                  </Button>
                </Stack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default Shop;