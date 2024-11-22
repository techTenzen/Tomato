import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Image,
  VStack,
  HStack,
  Input,
  Icon,
  Container,
  SimpleGrid,
  useColorModeValue,
  chakra,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Heading,
  Badge
} from '@chakra-ui/react';
import { Search2Icon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaUtensils, FaGift, FaShoppingBag, FaEye } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { app } from '../../Components/firebase/Firebase';

// Import images
import pic1 from "../../Assets/WhatsApp Image 2024-11-20 at 10.00.05 PM.jpeg"
import pic2 from "../../Assets/WhatsApp Image 2024-11-20 at 10.00.18 PM.jpeg"
import pic3 from "../../Assets/WhatsApp Image 2024-11-20 at 9.59.19 PM.jpeg"
import pic4 from "../../Assets/Untitled design (1) (1).png"

const MotionBox = chakra(motion.div);
const MotionVStack = chakra(motion.div);

const FoodCategory = ({ icon, title, onClick }) => (
  <MotionVStack
    spacing={3}
    align="center"
    p={6}
    borderRadius="xl"
    bg="white"
    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
    whileTap={{ scale: 0.95 }}
    cursor="pointer"
    boxShadow="lg"
    _hover={{
      boxShadow: 'xl',
      bg: 'green.50',
      transform: 'translateY(-4px)',
      transition: 'all 0.3s ease'
    }}
    onClick={onClick}
  >
    <Icon as={icon} boxSize={{ base: 10, md: 12 }} color="green.500" />
    <Text 
      fontWeight="semibold" 
      textAlign="center" 
      fontSize={{ base: 'lg', md: 'xl' }}
      color="gray.700"
    >
      {title}
    </Text>
  </MotionVStack>
);

const OrderCard = ({ order, onViewDetails }) => (
  <Box
    p={4}
    bg="white"
    borderRadius="xl"
    boxShadow="md"
    _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
    transition="all 0.3s ease"
  >
    <Flex justify="space-between" align="center">
      <VStack align="start" spacing={2}>
        <Text fontWeight="bold" fontSize="lg">Order #{order.id.slice(-6)}</Text>
        <Badge 
          colorScheme={
            order.status === 'completed' ? 'green' : 
            order.status === 'processing' ? 'orange' : 
            'blue'
          }
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </VStack>
      <Button
        colorScheme="green"
        size="sm"
        onClick={() => onViewDetails(order.id)}
        leftIcon={<FaEye />}
      >
        View Details
      </Button>
    </Flex>
  </Box>
);

const Home = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const firestore = getFirestore(app);

  useEffect(() => {
    const fetchActiveOrders = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          setLoading(false);
          return;
        }

        const ordersRef = collection(firestore, 'orders');
        const activeOrdersQuery = query(
          ordersRef, 
          where('userId', '==', user.uid),
          where('status', 'in', ['pending', 'processing', 'completed'])
        );
        
        const unsubscribe = onSnapshot(activeOrdersQuery, (snapshot) => {
          const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setActiveOrders(orders);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching active orders:', error);
        setLoading(false);
      }
    };

    fetchActiveOrders();
  }, [firestore]);

  const handleOrderClick = () => {
    if (location.trim()) navigate('/main');
  };

  const handleCategoryClick = () => navigate('/main');

  const handleViewActiveOrders = () => setIsOrderModalOpen(true);

  const handleOrderDetailsNavigation = (orderId) => {
    navigate(`/order-waiting/${orderId}`);
    setIsOrderModalOpen(false);
  };

  const bgGradient = useColorModeValue(
    'linear(to-br, green.50, teal.50, blue.50)',
    'linear(to-br, green.900, teal.900, blue.900)'
  );

  const foodCategories = [
    { icon: FaUtensils, title: 'Restaurant' },
    { icon: FaGift, title: 'Special Offers' }
  ];

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    cssEase: "linear",
    arrows: false
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh" bg={bgGradient}>
        <Spinner size="xl" color="green.500" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box
      bg={bgGradient}
      minH="100vh"
      py={{ base: 8, md: 16 }}
      px={{ base: 4, md: 8 }}
    >
      <Container maxW="container.xl">
        {activeOrders.length > 0 && (
          <Box
            bg="white"
            p={4}
            borderRadius="2xl"
            mb={8}
            boxShadow="xl"
            border="1px"
            borderColor="green.100"
          >
            <Flex align="center" justify="space-between">
              <HStack spacing={4}>
                <Icon as={FaShoppingBag} boxSize={6} color="green.500" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.700">
                    {activeOrders.length} Active Order{activeOrders.length > 1 ? 's' : ''}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Track your orders in real-time
                  </Text>
                </VStack>
              </HStack>
              <Button
                colorScheme="green"
                size="lg"
                onClick={handleViewActiveOrders}
                leftIcon={<FaEye />}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg'
                }}
              >
                View Orders
              </Button>
            </Flex>
          </Box>
        )}

        <Flex
          direction={{ base: 'column', lg: 'row' }}
          align="center"
          justify="space-between"
          gap={{ base: 12, lg: 16 }}
        >
          <MotionBox
            w={{ base: 'full', lg: '50%' }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <VStack spacing={8} align="start" w="full">
              <Heading
                fontSize={{ base: '4xl', md: '5xl', lg: '6xl' }}
                fontWeight="black"
                lineHeight="shorter"
                color="teal.800"
                letterSpacing="tight"
              >
                Order right from your table!
              </Heading>

              <Box w="full" borderRadius="2xl" overflow="hidden" boxShadow="2xl">
                <Slider {...carouselSettings}>
                  {[pic1, pic2, pic3].map((pic, index) => (
                    <Box key={index} position="relative" pb="56.25%">
                      <Image
                        src={pic}
                        alt={`Slide ${index + 1}`}
                        position="absolute"
                        top={0}
                        left={0}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    </Box>
                  ))}
                </Slider>
              </Box>

              <HStack
                w="full"
                bg="white"
                p={3}
                borderRadius="full"
                boxShadow="xl"
                spacing={4}
              >
                <Icon as={FaMapMarkerAlt} boxSize={5} ml={4} color="green.500" />
                <Input
                  placeholder="Enter your location"
                  variant="unstyled"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  fontSize="lg"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Button
                  borderRadius="full"
                  colorScheme="green"
                  rightIcon={<Search2Icon />}
                  onClick={handleOrderClick}
                  size="lg"
                  px={8}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
                  }}
                >
                  Search
                </Button>
              </HStack>

              <SimpleGrid columns={{ base: 2 }} spacing={6} w="full">
                {foodCategories.map((category, index) => (
                  <FoodCategory
                    key={index}
                    icon={category.icon}
                    title={category.title}
                    onClick={handleCategoryClick}
                  />
                ))}
              </SimpleGrid>
            </VStack>
          </MotionBox>

          <MotionBox
            w={{ base: 'full', lg: '45%' }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={pic4}
              alt="Food Delivery"
              borderRadius="3xl"
              boxShadow="2xl"
              w="full"
              h="auto"
              objectFit="cover"
            />
          </MotionBox>
        </Flex>

        <Modal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          size="xl"
          motionPreset="slideInBottom"
        >
          <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
          <ModalContent borderRadius="xl" mx={4}>
            <ModalHeader fontSize="2xl" fontWeight="bold">Your Active Orders</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={handleOrderDetailsNavigation}
                  />
                ))}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setIsOrderModalOpen(false)} size="lg">
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default Home;