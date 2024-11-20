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
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const firestore = getFirestore(app);
  const toast = useToast();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      // Get current user and shop data from localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        throw new Error("No user found");
      }

      const user = JSON.parse(userStr);

      // Query items for this shop
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const userStr = localStorage.getItem("user");
      const user = JSON.parse(userStr);

      const newItem = {
        ...itemData,
        price: parseFloat(itemData.price),
        vendorId: user.uid,
        createdAt: new Date(),
      };

      await addDoc(collection(firestore, "items"), newItem);

      // Refresh items list
      await fetchItems();

      // Reset form and close modal
      setItemData({
        name: "",
        price: "",
        description: "",
        imageUrl: "",
      });
      onClose();

      toast({
        title: "Success",
        description: "Item added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        status: "error",
        duration: 3000,
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
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
      <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Heading>Item Management</Heading>
                    <HStack spacing={4}>
                      <Button as={Link} to="/vendor/orders" colorScheme="green">
                        View Orders
                      </Button>
                      <Button colorScheme="blue" onClick={onOpen}>
                        Add New Item
                      </Button>
                    </HStack>
                  </Box>

        <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
          {items.length === 0 ? (
            <Text textAlign="center" gridColumn="1/-1" color="gray.500">
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
              >
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  height="200px"
                  width="100%"
                  objectFit="cover"
                  fallbackSrc="https://via.placeholder.com/200"
                />
                <Box p={4}>
                  <Heading size="md" mb={2}>
                    {item.name}
                  </Heading>
                  <Text
                    color="green.500"
                    fontSize="xl"
                    fontWeight="bold"
                    mb={2}
                  >
                    ${item.price.toFixed(2)}
                  </Text>
                  <Text noOfLines={2} color="gray.600">
                    {item.description}
                  </Text>
                </Box>
              </Box>
            ))
          )}
        </Grid>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
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
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      name="description"
                      value={itemData.description}
                      onChange={handleInputChange}
                      placeholder="Enter item description"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Image URL</FormLabel>
                    <Input
                      name="imageUrl"
                      value={itemData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="Enter image URL"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    isLoading={submitting}
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
