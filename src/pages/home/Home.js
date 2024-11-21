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
  Spinner
} from '@chakra-ui/react';
import { Search2Icon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaUtensils, FaGift, FaShoppingBag } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { app } from '../../Components/firebase/Firebase';

// Import images
import pic1 from "../../Assets/WhatsApp Image 2024-11-20 at 10.00.05 PM.jpeg"
import pic2 from "../../Assets/WhatsApp Image 2024-11-20 at 10.00.18 PM.jpeg"
import pic3 from "../../Assets/WhatsApp Image 2024-11-20 at 9.59.19 PM.jpeg"
import pic4 from "../../Assets/Untitled design (1) (1).png"

// Animated components
const MotionBox = chakra(motion.div);
const MotionVStack = chakra(motion.div);

// Active Orders Banner Component
const ActiveOrderBanner = ({ activeOrders, onViewOrder }) => {
  if (!activeOrders || activeOrders.length === 0) return null;

  return (
    <Box 
      bg="green.50" 
      p={3} 
      borderRadius="lg" 
      mb={4} 
      boxShadow="md"
    >
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center">
          <Icon as={FaShoppingBag} mr={3} color="green.500" />
          <Text fontWeight="bold" color="green.700">
            {activeOrders.length} Active Order{activeOrders.length > 1 ? 's' : ''}
          </Text>
        </Flex>
        <Button 
          colorScheme="green" 
          size="sm" 
          onClick={onViewOrder}
        >
          View Order Status
        </Button>
      </Flex>
    </Box>
  );
};

const FoodCategory = ({ icon, title, onClick }) => (
  <MotionVStack
    spacing={2}
    align="center"
    p={4}
    borderRadius="lg"
    bg="white"
    whileHover={{
      scale: 1.05,
      transition: { duration: 0.2 }
    }}
    whileTap={{ scale: 0.95 }}
    cursor="pointer"
    boxShadow="sm"
    _hover={{
      boxShadow: 'md',
      bg: 'green.50'
    }}
    onClick={onClick}
  >
    <Icon as={icon} boxSize={{ base: 8, md: 10 }} color="green.500" />
    <Text fontWeight="medium" textAlign="center" fontSize={{ base: 'md', md: 'lg' }}>
      {title}
    </Text>
  </MotionVStack>
);

const Home = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const firestore = getFirestore(app);

  useEffect(() => {
    const fetchActiveOrders = async () => {
      try {
        // Get the logged-in user from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!user) {
          setLoading(false);
          return;
        }

        const ordersRef = collection(firestore, 'orders');
        const activeOrdersQuery = query(
          ordersRef, 
          where('userId', '==', user.uid),
          where('status', 'in', ['pending', 'processing'])
        );
        
        const snapshot = await getDocs(activeOrdersQuery);
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActiveOrders(orders);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching active orders:', error);
        setLoading(false);
      }
    };

    fetchActiveOrders();
  }, [firestore]);

  const handleOrderClick = () => {
    if (location.trim()) {
      navigate('/main');
    }
  };

  const handleCategoryClick = () => {
    navigate('/main');
  };

  const handleViewActiveOrder = () => {
    if (activeOrders.length > 0) {
      navigate(`/order-waiting/${activeOrders[0].id}`);
    }
  };

  const bgGradient = useColorModeValue(
    'linear(to-r, teal.100, teal.50)',
    'linear(to-r, teal.800, teal.700)'
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
    cssEase: "linear"
  };

  if (loading) {
    return (
      <Flex 
        justifyContent="center" 
        alignItems="center" 
        height="100vh" 
        bg={bgGradient}
      >
        <Spinner size="xl" color="green.500" />
      </Flex>
    );
  }

  return (
    <Box
      bg={bgGradient}
      minHeight="100vh"
      display="flex"
      alignItems="center"
      pt={{ base: 10, md: 0 }}
      px={{ base: 4, md: 0 }}
      mb={0}
    >
      <Container maxW="container.xl">
        {/* Active Orders Banner */}
        <ActiveOrderBanner 
          activeOrders={activeOrders} 
          onViewOrder={handleViewActiveOrder} 
        />

        {/* Rest of the component remains the same */}
        <Flex
          flexDirection={{ base: 'column', md: 'row' }}
          alignItems="center"
          justifyContent="space-between"
          gap={{ base: 8, md: 12 }}
        >
          {/* Left Section: Text & Search */}
          <MotionBox
            w={{ base: 'full', md: '50%' }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <VStack spacing={6} align="start" w="full">
              <Text
                fontSize={{ base: '3xl', md: '5xl' }}
                fontWeight="extrabold"
                lineHeight="shorter"
                color="teal.800"
                mb={0}
              >
                Order right from your table!
              </Text>

              {/* Carousel Section */}
              <Box w="full" borderRadius="lg" overflow="hidden">
                <Slider {...carouselSettings}>
                  <Box>
                    <Image src={pic1} alt="Delicious Meal" />
                  </Box>
                  <Box>
                    <Image src={pic2} alt="Fast Delivery" />
                  </Box>
                  <Box>
                    <Image src={pic3} alt="Exclusive Offers" />
                  </Box>
                </Slider>
              </Box>

              {/* Location & Search */}
              <HStack
                w="full"
                bg="white"
                p={2}
                borderRadius="full"
                boxShadow="md"
              >
                <Icon as={FaMapMarkerAlt} ml={3} color="green.500" />
                <Input
                  placeholder="Enter your location"
                  variant="unstyled"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  pl={2}
                  fontSize={{ base: 'sm', md: 'md' }}
                />
                <Button
                  borderRadius="full"
                  colorScheme="green"
                  rightIcon={<Search2Icon />}
                  onClick={handleOrderClick}
                  size={{ base: 'sm', md: 'md' }}
                >
                  Search
                </Button>
              </HStack>

              {/* Food Categories */}
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} w="full" mt={6}>
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

          {/* Right Section: Image */}
          <MotionBox
            w={{ base: 'full', md: '50%' }}
            display={{ base: 'block', md: 'block' }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={pic4}
              alt="Food Delivery"
              borderRadius="2xl"
              boxShadow="2xl"
              objectFit="cover"
              w="full"
              h={{ base: "200px", md: "auto" }}
            />
          </MotionBox>
        </Flex>
      </Container>
    </Box>
  );
};

export default Home;