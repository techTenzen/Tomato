import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  FormControl, 
  FormLabel, 
  Input, 
  Button, 
  Image, 
  Grid, 
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { app } from '../../Components/firebase/Firebase';

const AdminShops = () => {
  const [shopName, setShopName] = useState('');
  const [shopImageUrl, setShopImageUrl] = useState('');
  const [shops, setShops] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const firestore = getFirestore(app);
  const toast = useToast();

  // Load and validate user on component mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          throw new Error('No user found in localStorage');
        }

        const user = JSON.parse(userStr);
        if (!user || !user.uid) { // Changed from id to uid as Firebase typically uses uid
          throw new Error('Invalid user data');
        }

        setCurrentUser(user);
      } catch (error) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        // You might want to redirect to login page here
      }
    };

    loadUser();
  }, [toast]);

  const fetchVendorShops = async () => {
    if (!currentUser?.uid) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const shopsRef = collection(firestore, 'shops');
      const q = query(shopsRef, where('vendorId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      
      const shopsList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      setShops(shopsList);
    } catch (error) {
      toast({
        title: 'Error Fetching Shops',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchVendorShops();
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser?.uid) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add a shop',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!shopName || !shopImageUrl) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const shopsRef = collection(firestore, 'shops');
      const newShopData = {
        name: shopName,
        imageUrl: shopImageUrl,
        vendorId: currentUser.uid, // Using uid instead of id
        createdAt: new Date()
      };

      // Validate all required fields are present
      if (!Object.values(newShopData).every(value => value !== undefined)) {
        throw new Error('Missing required fields');
      }

      await addDoc(shopsRef, newShopData);

      toast({
        title: 'Shop Added Successfully',
        description: `${shopName} has been created`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setShopName('');
      setShopImageUrl('');
      fetchVendorShops();
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: 'Error Adding Shop',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Rest of the component remains the same
  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Shop Management</Heading>
        
        <Button 
          colorScheme="green" 
          onClick={() => setIsModalOpen(true)}
          isDisabled={!currentUser}
        >
          Add New Shop
        </Button>

        <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
          {shops.map(shop => (
            <Box 
              key={shop.id} 
              borderWidth={1} 
              borderRadius="lg" 
              overflow="hidden"
              boxShadow="md"
            >
              <Image 
                src={shop.imageUrl} 
                alt={shop.name} 
                h="200px" 
                w="100%" 
                objectFit="cover" 
              />
              <Box p={3}>
                <Heading size="md">{shop.name}</Heading>
              </Box>
            </Box>
          ))}
        </Grid>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add New Shop</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Shop Name</FormLabel>
                    <Input 
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="Enter shop name"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Shop Image URL</FormLabel>
                    <Input 
                      value={shopImageUrl}
                      onChange={(e) => setShopImageUrl(e.target.value)}
                      placeholder="Enter image URL"
                    />
                  </FormControl>

                  <Button 
                    colorScheme="blue" 
                    type="submit" 
                    width="full"
                  >
                    Add Shop
                  </Button>
                </VStack>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default AdminShops;