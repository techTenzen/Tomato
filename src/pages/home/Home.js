import React, { useState } from 'react';
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
  chakra
} from '@chakra-ui/react';
import { Search2Icon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaMotorcycle, FaUtensils, FaGift } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import pic1 from "../../Assets/WhatsApp Image 2024-11-20 at 10.00.05 PM.jpeg"
import pic2 from "../../Assets/WhatsApp Image 2024-11-20 at 10.00.18 PM.jpeg"
import pic3 from "../../Assets/WhatsApp Image 2024-11-20 at 9.59.19 PM.jpeg"
import pic4 from "../../Assets/Untitled design (1) (1).png"
// Animated components
const MotionBox = chakra(motion.div);
const MotionVStack = chakra(motion.div);

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

  const handleOrderClick = () => {
    if (location.trim()) {
      navigate('/main');
    }
  };

  const handleCategoryClick = () => {
    navigate('/main');
  };

  const bgGradient = useColorModeValue(
    'linear(to-r, teal.100, teal.50)',
    'linear(to-r, teal.800, teal.700)'
  );

  const foodCategories = [
    { icon: FaUtensils, title: 'Restaurant' },
    
    { icon: FaGift, title: 'Special Offers' }
  ];

  // Carousel settings
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

  return (
    <Box
      bg={bgGradient}
      minHeight="100vh"
      display="flex"
      alignItems="center"
      pt={{ base: 10, md: 0 }}
      px={{ base: 4, md: 0 }} // Padding for mobile screens
      mb={0} // Remove margin-bottom to eliminate space
    >
      <Container maxW="container.xl">
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
                color="teal.800" // Changed color to teal for a sleek look
                mb={0} // Remove bottom margin to eliminate space
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
            display={{ base: 'block', md: 'block' }} // Ensure it displays correctly on mobile
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={pic4} // Placeholder image; replace with actual image URL
              alt="Food Delivery"
              borderRadius="2xl"
              boxShadow="2xl"
              objectFit="cover"
              w="full"
              h={{ base: "200px", md: "auto" }} // Set a fixed height for mobile screens
            />
          </MotionBox>
        </Flex>
      </Container>
    </Box>
  );
};

export default Home;