import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Heading,
  Button,
  useToast,
  Grid,
  Image,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Spinner,
  Alert,
  AlertIcon,
  useDisclosure,
  HStack,
  Flex,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Link } from 'react-router-dom';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../../Components/firebase/Firebase";

const VendorItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [itemData, setItemData] = useState({
    name: "",
    price: "",
    description: "",
    imageUrl: "",
  });
  const [itemImage, setItemImage] = useState(null);
  const [itemImagePreview, setItemImagePreview] = useState('');
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const firestore = getFirestore(app);
  const storage = getStorage(app);
  const toast = useToast();

  // Responsive column configuration
  const gridColumns = useBreakpointValue({ 
    base: "repeat(1, 1fr)",  // 1 column on mobile
    sm: "repeat(2, 1fr)",    // 2 columns on small screens
    md: "repeat(3, 1fr)",    // 3 columns on medium screens
    lg: "repeat(auto-fill, minmax(250px, 1fr))" // flexible columns on large screens
  });

  // Responsive button stack direction
  const buttonStackDirection = useBreakpointValue({ 
    base: "column", 
    md: "row" 
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        throw new Error("No user found");
      }

      const user = JSON.parse(userStr);

      const itemsRef = collection(firestore, "items");
      const q = query(itemsRef, where("vendorId", "==", user.uid));
      const snapshot = await getDocs(q);

      const itemsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setItems(itemsList);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch items",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setItemData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a JPEG, PNG, or GIF image',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: 'File Too Large',
          description: 'Image must be smaller than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setItemImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadItemImage = async () => {
    if (!itemImage) return null;

    try {
      const userStr = localStorage.getItem("user");
      const user = JSON.parse(userStr);

      const storageRef = ref(storage, `items/${user.uid}/${Date.now()}_${itemImage.name}`);
      const snapshot = await uploadBytes(storageRef, itemImage);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      toast({
        title: 'Image Upload Failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
  
    try {
      const userStr = localStorage.getItem("user");
      const user = JSON.parse(userStr);
  
      let imageUrl = itemData.imageUrl;
      if (itemImage) {
        imageUrl = await uploadItemImage();
        if (!imageUrl) {
          console.error("Image upload failed");
          setSubmitting(false);
          return;
        }
      }
  
      const newItem = {
        name: itemData.name,
        price: parseFloat(itemData.price),
        description: itemData.description,
        imageUrl: imageUrl,
        vendorId: user.uid,
        shopId: user.shopId || user.uid,
        createdAt: new Date(),
      };
  
      const docRef = await addDoc(collection(firestore, "items"), newItem);
      
      await fetchItems();
      
      // Reset form and close modal
      setItemData({
        name: "",
        price: "",
        description: "",
        imageUrl: "",
      });
      setItemImage(null);
      setItemImagePreview('');
      onClose();

      toast({
        title: "Success",
        description: "Item added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Full Error Details:", error);
      toast({
        title: "Error",
        description: `Failed to add item: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        p={6}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="200px"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={{ base: 3, md: 6 }}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={{ base: 3, md: 6 }}>
      <VStack spacing={6} align="stretch">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          alignItems="center"
          mb={4}
        >
          <Heading 
            size={{ base: 'lg', md: 'xl' }} 
            mb={{ base: 4, md: 0 }}
          >
            Item Management
          </Heading>
          <Flex 
            direction={buttonStackDirection} 
            gap={3} 
            width={{ base: '100%', md: 'auto' }}
          >
            <Button 
              as={Link} 
              to="/vendor/orders" 
              colorScheme="green" 
              width={{ base: '100%', md: 'auto' }}
            >
              View Orders
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={onOpen}
              width={{ base: '100%', md: 'auto' }}
            >
              Add New Item
            </Button>
          </Flex>
        </Flex>

        <Grid 
          templateColumns={gridColumns} 
          gap={{ base: 4, md: 6 }}
        >
          {items.length === 0 ? (
            <Text 
              textAlign="center" 
              gridColumn="1/-1" 
              color="gray.500"
            >
              No items in your shop. Add some items to get started!
            </Text>
          ) : (
            items.map((item) => (
              <Box
                key={item.id}
                borderWidth={1}
                borderRadius="lg"
                overflow="hidden"
                boxShadow="md"
                transition="transform 0.2s"
                _hover={{ transform: 'scale(1.02)' }}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  height={{ base: '150px', md: '200px' }}
                  width="100%"
                  objectFit="cover"
                  fallbackSrc="https://via.placeholder.com/200"
                />
                <Box p={{ base: 2, md: 4 }}>
                  <Heading 
                    size={{ base: 'sm', md: 'md' }} 
                    mb={2}
                  >
                    {item.name}
                  </Heading>
                  <Text
                    color="green.500"
                    fontSize={{ base: 'lg', md: 'xl' }}
                    fontWeight="bold"
                    mb={2}
                  >
                    ${item.price.toFixed(2)}
                  </Text>
                  <Text 
                    noOfLines={2} 
                    color="gray.600"
                    fontSize={{ base: 'sm', md: 'md' }}
                  >
                    {item.description}
                  </Text>
                </Box>
              </Box>
            ))
          )}
        </Grid>

        <Modal 
          isOpen={isOpen} 
          onClose={onClose}
          size={{ base: 'full', md: 'md' }}
        >
          <ModalOverlay />
          <ModalContent 
            mx={{ base: 0, md: 'auto' }} 
            my={{ base: 0, md: '10vh' }}
          >
            <ModalHeader>Add New Item</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Item Name</FormLabel>
                    <Input
                      name="name"
                      value={itemData.name}
                      onChange={handleInputChange}
                      placeholder="Enter item name"
                      size={{ base: 'md', md: 'lg' }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Price</FormLabel>
                    <Input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemData.price}
                      onChange={handleInputChange}
                      placeholder="Enter price"
                      size={{ base: 'md', md: 'lg' }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      name="description"
                      value={itemData.description}
                      onChange={handleInputChange}
                      placeholder="Enter item description"
                      size={{ base: 'md', md: 'lg' }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Item Image</FormLabel>
                    <Input 
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleImageChange}
                      size={{ base: 'md', md: 'lg' }}
                      sx={{
                        '::file-selector-button': {
                          height: '40px',
                          padding: '0 15px',
                          mr: 4,
                          bg: 'gray.200',
                          borderRadius: 'md',
                          cursor: 'pointer'
                        }
                      }}
                    />
                    {itemImagePreview && (
                      <Image 
                        src={itemImagePreview} 
                        alt="Item Preview" 
                        mt={4} 
                        maxH={{ base: '150px', md: '200px' }} 
                        objectFit="cover" 
                        width="100%"
                      />
                    )}
                    <Input
                      mt={2}
                      name="imageUrl"
                      value={itemData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="Or enter image URL"
                      size={{ base: 'md', md: 'lg' }}
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    isLoading={submitting}
                    size={{ base: 'md', md: 'lg' }}
                  >
                    Add Item
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

export default VendorItems;