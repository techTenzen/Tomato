import React from 'react';
import { 
  Box, 
  Text, 
  HStack, 
  Icon, 
  Flex, 
  Container, 
  VStack 
} from '@chakra-ui/react';
import { 
  FaUtensils, 
  FaMotorcycle, 
  FaGift, 
  FaHeart, 
  FaShoppingBag 
} from 'react-icons/fa';

const Footer = () => {
  return (
    <Box
      bg="orange.500"
      color="white"
      py={8}
      borderTopRadius="2xl"
      boxShadow="0 -4px 6px rgba(0, 0, 0, 0.1)"
      mt="auto"
    >
      <Container maxW="container.xl">
        <VStack spacing={6}>
          <Text 
            fontSize={["xl", "2xl"]} 
            fontWeight="bold" 
            textAlign="center"
            letterSpacing="tight"
          >
            Ordering Made Easy Through FOST
          </Text>
          <HStack 
            justifyContent="center" 
            spacing={[4, 6, 8]} 
            w="full"
          >
            {[
              { icon: FaUtensils, title: "Fresh Food" },
              { icon: FaMotorcycle, title: "Quick Delivery" },
              { icon: FaGift, title: "Special Offers" },
              { icon: FaHeart, title: "Quality" },
              { icon: FaShoppingBag, title: "Easy Order" }
            ].map((item, index) => (
              <Flex 
                key={index}
                flexDirection="column"
                alignItems="center"
                color="white"
                opacity={0.9}
                transition="all 0.3s"
                _hover={{
                  transform: "scale(1.1)",
                  opacity: 1
                }}
              >
                <Icon 
                  as={item.icon} 
                  boxSize={[5, 6, 7]} 
                  mb={2}
                />
                <Text 
                  fontSize={["xs", "sm"]} 
                  display={["none", "block"]}
                >
                  {item.title}
                </Text>
              </Flex>
            ))}
          </HStack>
          <Text 
            mt={4} 
            fontSize="sm" 
            opacity={0.8}
            textAlign="center"
          >
            © {new Date().getFullYear()} FOST. All Rights Reserved.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default Footer;