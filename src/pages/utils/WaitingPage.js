import React, { useState, useEffect } from 'react';
import { 
  Container,
  VStack,
  Heading,
  Text,
  Box,
  Spinner,
  Progress,
  Button,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

const OrderWaitingPage = () => {
  const [orderStatus, setOrderStatus] = useState('pending');
  const [isReadyForPickup, setIsReadyForPickup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const firestore = getFirestore();

  // Get order ID from location state or previous navigation
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate('/'); // Redirect if no order ID
      return;
    }

    // Set up real-time listener for order status
    const orderRef = doc(firestore, 'orders', orderId);
    const unsubscribe = onSnapshot(orderRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const orderData = docSnapshot.data();
        setOrderStatus(orderData.status);
        setIsReadyForPickup(orderData.status === 'completed');
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [orderId, firestore, navigate]);

  const handlePickup = () => {
    navigate('/order-confirmation', { state: { orderId } });
  };

  const getStatusDetails = () => {
    switch(orderStatus) {
      case 'pending':
        return {
          description: 'Order Accepted by Store',
          progressValue: 30,
          message: 'Your order has been received and is being reviewed by the store'
        };
      case 'processing':
        return {
          description: 'Order Being Prepared',
          progressValue: 70,
          message: 'Your order is currently being prepared by our staff'
        };
      case 'completed':
        return {
          description: 'Order Ready for Pickup',
          progressValue: 100,
          message: 'Your order is complete and ready to collect'
        };
      default:
        return {
          description: 'Processing Order',
          progressValue: 50,
          message: 'Your order is being processed'
        };
    }
  };

  const statusDetails = getStatusDetails();

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading textAlign="center">Order Status</Heading>

        {isReadyForPickup ? (
          <Alert
            status="success"
            variant="solid"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <Heading size="lg" mb={4}>
              Order is Ready for Pickup!
            </Heading>
            <Text fontSize="md" mb={4}>
              Your order from the vendor is now complete and ready to be collected.
            </Text>
            <Button
              colorScheme="green"
              size="lg"
              onClick={handlePickup}
            >
              Proceed to Pickup
            </Button>
          </Alert>
        ) : (
          <>
            <Box textAlign="center">
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text mt={4} fontSize="lg">
                {statusDetails.description}
              </Text>
            </Box>

            <Progress
              value={statusDetails.progressValue}
              size="lg"
              colorScheme="blue"
              hasStripe
              isAnimated
            />

            <Box textAlign="center">
              <Text fontSize="md" color="gray.600">
                {statusDetails.message}
              </Text>
            </Box>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default OrderWaitingPage;