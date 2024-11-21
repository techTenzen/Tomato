import React, { useState, useEffect } from 'react';
import { 
  Container,
  VStack,
  Heading,
  Text,
  Box,
  Progress,
  Button,
  Alert,
  AlertIcon,
  Flex,
  Icon,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody
} from '@chakra-ui/react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  getDoc 
} from 'firebase/firestore';
import { 
  CheckCircle, 
  Clock, 
  ShoppingBag,
  XCircle 
} from 'lucide-react';
import { getAuth } from 'firebase/auth';

const OrderWaitingPage = () => {
  const [orderStatus, setOrderStatus] = useState('pending');
  const [isReadyForPickup, setIsReadyForPickup] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  
  const navigate = useNavigate();
  const { orderid } = useParams();
  const firestore = getFirestore();
  const auth = getAuth();

  // Responsive sizing
  const headingSize = useBreakpointValue({ base: 'lg', md: 'xl' });
  const containerPadding = useBreakpointValue({ base: 4, md: 8 });
  const iconSize = useBreakpointValue({ base: 8, md: 10 });

  // Generate unique QR code value
  const qrCodeValue = `order-pickup:${orderid}`;

  useEffect(() => {
    const checkOrderAuthorization = async () => {
      if (!orderid || !auth.currentUser) {
        navigate('/');
        return;
      }

      try {
        const orderRef = doc(firestore, 'orders', orderid);
        const orderSnapshot = await getDoc(orderRef);

        if (orderSnapshot.exists()) {
          const orderData = orderSnapshot.data();
          
          // Strict user authorization check
          if (orderData.userId !== auth.currentUser.uid) {
            setIsAuthorized(false);
            return;
          }

          // Set authorized and store order details
          setIsAuthorized(true);
          setOrderDetails(orderData);

          // Real-time listener for order updates
          const unsubscribe = onSnapshot(orderRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const updatedOrderData = docSnapshot.data();
              
              // Only update if the current user is the order owner
              if (updatedOrderData.userId === auth.currentUser.uid) {
                setOrderStatus(updatedOrderData.status || 'pending');
                setIsReadyForPickup(updatedOrderData.status === 'completed');
                setIsCancelled(updatedOrderData.status === 'cancelled');
                setOrderDetails(updatedOrderData);
              }
            }
          });

          return () => unsubscribe();
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking order authorization:', error);
        navigate('/');
      }
    };

    checkOrderAuthorization();
  }, [orderid, firestore, navigate, auth]);

  const handlePickup = () => {
    navigate('/order-confirmation', { state: { orderId: orderid } });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleOpenQRModal = () => {
    setIsQRModalOpen(true);
  };

  const handleCloseQRModal = () => {
    setIsQRModalOpen(false);
  };

  const getStatusDetails = () => {
    if (isCancelled) {
      return {
        description: 'Order Cancelled',
        progressValue: 0,
        message: 'Unfortunately, this order has been cancelled by the vendor.',
        icon: XCircle,
        color: 'red'
      };
    }

    switch(orderStatus) {
      case 'pending':
        return {
          description: 'Order Accepted by Store',
          progressValue: 30,
          message: 'Your order has been received and is being reviewed by the store',
          icon: Clock,
          color: 'blue'
        };
      case 'processing':
        return {
          description: 'Order Being Prepared',
          progressValue: 70,
          message: 'Your order is currently being prepared by our staff',
          icon: ShoppingBag,
          color: 'orange'
        };
      case 'completed':
        return {
          description: 'Order Ready for Pickup',
          progressValue: 100,
          message: 'Your order is complete and ready to collect',
          icon: CheckCircle,
          color: 'green'
        };
      default:
        navigate('/order-confirmation', { state: { orderId: orderid } });
      return {
        description: 'Processing Order',
        progressValue: 50,
        message: 'Your order is being processed',
        icon: Clock,
        color: 'gray'
      };
    }
  };

  // If not authorized, show unauthorized message
  if (!isAuthorized) {
    return (
      <Container 
        maxW="container.sm"
        py={containerPadding} 
        bg="gray.50" 
        minHeight="100vh"
        px={containerPadding}
      >
        <Alert status="error" variant="subtle">
          <AlertIcon />
          <Text>You are not authorized to view this order.</Text>
        </Alert>
      </Container>
    );
  }

  const statusDetails = getStatusDetails();

  return (
    <Container 
      maxW="container.sm"
      py={containerPadding} 
      bg="gray.50" 
      minHeight="100vh"
      px={containerPadding}
    >
      <VStack spacing={6} align="stretch">
        <Heading textAlign="center" size={headingSize}>
          Order Status
        </Heading>

        <Box 
          bg="white" 
          p={6} 
          borderRadius="lg" 
          boxShadow="md"
        >
          <Flex alignItems="center" mb={4}>
            <Icon 
              as={statusDetails.icon} 
              color={`${statusDetails.color}.500`} 
              w={iconSize} 
              h={iconSize} 
              mr={4} 
            />
            <Text fontWeight="bold" fontSize="lg">
              {statusDetails.description}
            </Text>
          </Flex>
          
          <Progress 
            value={statusDetails.progressValue} 
            colorScheme={statusDetails.color} 
            size="lg" 
            borderRadius="md" 
            mb={4} 
          />
          
          <Text textAlign="center" color="gray.600">
            {statusDetails.message}
          </Text>
        </Box>

        {/* {isReadyForPickup && (
          // <Button 
          //   colorScheme="green" 
          //   size="lg" 
          //   onClick={handlePickup}
          //   width="full"
          // >
          //   Proceed to Pickup
          // </Button>
        )} */}

        {isCancelled && (
          <Button 
            colorScheme="red" 
            size="lg" 
            onClick={handleBackToHome}
            width="full"
          >
            Back to Home
          </Button>
        )}

        <Button 
          variant="outline" 
          colorScheme="blue" 
          onClick={handleOpenQRModal}
          width="full"
          isDisabled={!isReadyForPickup}
        >
          Show Order QR Code
        </Button>

        <Modal isOpen={isQRModalOpen} onClose={handleCloseQRModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Order QR Code</ModalHeader>
            <ModalCloseButton />
            <ModalBody display="flex" justifyContent="center" py={6}>
              <QRCodeSVG value={qrCodeValue} size={256} />
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default OrderWaitingPage;