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
import { QRCodeSVG } from 'qrcode.react'; // Updated import
import { useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { 
  CheckCircle, 
  Clock, 
  ShoppingBag,
  XCircle 
} from 'lucide-react';

const OrderWaitingPage = () => {
  const [orderStatus, setOrderStatus] = useState('pending');
  const [isReadyForPickup, setIsReadyForPickup] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const firestore = getFirestore();

  // Responsive sizing
  const headingSize = useBreakpointValue({ base: 'lg', md: 'xl' });
  const containerPadding = useBreakpointValue({ base: 4, md: 8 });
  const iconSize = useBreakpointValue({ base: 8, md: 10 });

  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    const orderRef = doc(firestore, 'orders', orderId);
    const unsubscribe = onSnapshot(orderRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const orderData = docSnapshot.data();
        setOrderStatus(orderData.status);
        setIsReadyForPickup(orderData.status === 'completed');
        setIsCancelled(orderData.status === 'cancelled');
      }
    });

    return () => unsubscribe();
  }, [orderId, firestore, navigate]);

  const handlePickup = () => {
    navigate('/order-confirmation', { state: { orderId } });
  };

  const handleBackToHome = () => {
    navigate('/'); // or wherever you want to redirect after cancellation
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
        return {
          description: 'Processing Order',
          progressValue: 50,
          message: 'Your order is being processed',
          icon: Clock,
          color: 'gray'
        };
    }
  };

  const statusDetails = getStatusDetails();

  return (
    <Container 
      maxW="container.sm"
      py={containerPadding} 
      bg="gray.50" 
      minHeight="100vh"
      px={containerPadding}
    >
      <VStack 
        spacing={{ base: 6, md: 8 }}
        align="stretch" 
        bg="white" 
        p={{ base: 4, md: 8 }}
        borderRadius="xl" 
        boxShadow="xl"
      >
        <Flex 
          alignItems="center" 
          justifyContent="center" 
          mb={{ base: 2, md: 4 }}
        >
          <Icon 
            as={statusDetails.icon} 
            w={iconSize} 
            h={iconSize} 
            color={`${statusDetails.color}.500`} 
            mr={{ base: 2, md: 4 }}
          />
          <Heading 
            textAlign="center" 
            color="gray.700"
            size={headingSize}
          >
            Order Status
          </Heading>
        </Flex>

        {isCancelled ? (
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height={{ base: "200px", md: "250px" }}
            borderRadius="xl"
          >
            <AlertIcon boxSize={{ base: "40px", md: "50px" }} mr={0} />
            <Heading 
              size={{ base: "md", md: "lg" }} 
              mb={4} 
              color="red.600"
            >
              Order Cancelled
            </Heading>
            <Text 
              fontSize={{ base: "sm", md: "md" }} 
              mb={6} 
              color="gray.600"
            >
              Unfortunately, this order has been cancelled by the vendor.
            </Text>
            <Button
              colorScheme="red"
              size={{ base: "md", md: "lg" }}
              borderRadius="full"
              px={{ base: 6, md: 8 }}
              boxShadow="md"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
              onClick={handleBackToHome}
            >
              Back to Home
            </Button>
          </Alert>
        ) : isReadyForPickup ? (
          <>
            <Alert
              status="success"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height={{ base: "200px", md: "250px" }}
              borderRadius="xl"
            >
              <AlertIcon boxSize={{ base: "40px", md: "50px" }} mr={0} />
              <Heading 
                size={{ base: "md", md: "lg" }} 
                mb={4} 
                color="green.600"
              >
                Order is Ready for Pickup!
              </Heading>
              <Text 
                fontSize={{ base: "sm", md: "md" }} 
                mb={6} 
                color="gray.600"
              >
                Your order from the vendor is now complete and ready to be collected.
              </Text>
              <Flex gap={4}>
                <Button
                  colorScheme="green"
                  size={{ base: "md", md: "lg" }}
                  borderRadius="full"
                  px={{ base: 6, md: 8 }}
                  boxShadow="md"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
                  }}
                  onClick={handlePickup}
                >
                  Proceed to Pickup
                </Button>
                <Button
                  colorScheme="blue"
                  size={{ base: "md", md: "lg" }}
                  borderRadius="full"
                  px={{ base: 6, md: 8 }}
                  boxShadow="md"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
                  }}
                  onClick={handleOpenQRModal}
                >
                  View QR Code
                </Button>
              </Flex>
            </Alert>

            <Modal 
              isOpen={isQRModalOpen} 
              onClose={handleCloseQRModal} 
              size={{ base: "sm", md: "md" }}
              isCentered
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Order Pickup QR Code</ModalHeader>
                <ModalCloseButton />
                <ModalBody 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center" 
                  p={6}
                >
                  <QRCodeSVG
                    value={`order-pickup:${orderId}`} 
                    size={256} 
                    level={'H'} 
                    includeMargin={true}
                  />
                  <Text 
                    mt={4} 
                    textAlign="center" 
                    color="gray.600" 
                    fontSize="sm"
                  >
                    Show this QR code to the staff for order pickup
                  </Text>
                </ModalBody>
              </ModalContent>
            </Modal>
          </>
        ) : (
          <>
            <Flex 
              flexDirection="column" 
              alignItems="center" 
              textAlign="center" 
              mb={{ base: 4, md: 6 }}
            >
              <Spinner 
                size={{ base: "lg", md: "xl" }}
                color={`${statusDetails.color}.500`} 
                thickness="4px"
                speed="0.8s"
                emptyColor="gray.200"
              />
              <Text 
                mt={{ base: 2, md: 4 }}
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="semibold" 
                color="gray.700"
              >
                {statusDetails.description}
              </Text>
            </Flex>

            <Progress
              value={statusDetails.progressValue}
              size="lg"
              colorScheme={statusDetails.color}
              hasStripe
              isAnimated
              borderRadius="full"
            />

            <Box textAlign="center" mt={{ base: 2, md: 4 }}>
              <Text 
                fontSize={{ base: "sm", md: "md" }}
                color="gray.500" 
                fontStyle="italic"
              >
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