import React, { useState, useEffect } from 'react';
import {
  Container,
  VStack,
  Heading,
  Box,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Stack,
  Select,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter
} from '@chakra-ui/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// Helper functions
const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'yellow',
    processing: 'blue',
    completed: 'green',
    cancelled: 'red',
    picked_up: 'purple'
  };
  return colors[status] || 'gray';
};

// OrderCard component
const OrderCard = ({ order, updateOrderStatus, onCompleteOrder }) => (
  <Box
    borderWidth="1px"
    borderRadius="lg"
    p={6}
    bg="white"
    shadow="sm"
  >
    <Stack spacing={4}>
      <HStack justify="space-between">
        <Badge
          colorScheme={getStatusColor(order.status)}
          fontSize="0.9em"
          p={2}
          borderRadius="md"
        >
          {order.status.toUpperCase().replace('_', ' ')}
        </Badge>
        <Text fontSize="sm" color="gray.600">
          {formatDate(order.createdAt)}
        </Text>
      </HStack>

      <Box>
        <Text fontWeight="bold" mb={2}>Customer Details</Text>
        <Text>Email: {order.customerEmail}</Text>
      </Box>

      <Divider />

      <Box>
        <Text fontWeight="bold" mb={2}>Order Items</Text>
        <VStack align="stretch" spacing={2}>
          {order.items.map((item, index) => (
            <HStack key={index} justify="space-between">
              <Text>{item.name} x{item.quantity}</Text>
              <Text>${(item.price * item.quantity).toFixed(2)}</Text>
            </HStack>
          ))}
        </VStack>
      </Box>

      <Divider />

      <HStack justify="space-between">
        <Text fontWeight="bold">Total Amount:</Text>
        <Text fontWeight="bold" color="green.600">
          ${order.total.toFixed(2)}
        </Text>
      </HStack>

      {order.status === 'completed' && (
        <Box>
          <Text fontWeight="bold" color="blue.600">
            Pickup Code: {order.pickupCode}
          </Text>
        </Box>
      )}

      {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'picked_up' && (
        <HStack spacing={4}>
          {order.status === 'pending' && (
            <Button
              colorScheme="blue"
              onClick={() => updateOrderStatus(order.id, 'processing')}
              flex={1}
            >
              Start Processing
            </Button>
          )}
          {order.status === 'processing' && (
            <>
              <Button
                colorScheme="green"
                onClick={() => onCompleteOrder(order)}
                flex={1}
              >
                Mark as Ready
              </Button>
              <Button
                colorScheme="red"
                variant="outline"
                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                flex={1}
              >
                Cancel Order
              </Button>
            </>
          )}
        </HStack>
      )}
    </Stack>
  </Box>
);

// Main Vendor Orders Component
const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const toast = useToast();
  const firestore = getFirestore();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) throw new Error('No user found');

      const ordersRef = collection(firestore, 'orders');
      const q = query(ordersRef, where('shopId', '==', user.shopId));
      const snapshot = await getDocs(q);

      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      setOrders(ordersList.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const generatePickupCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
      };

      // Add pickup code when marking as completed
      if (newStatus === 'completed') {
        updateData.pickupCode = generatePickupCode();
        updateData.completedAt = new Date();
      }

      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: newStatus,
              ...(newStatus === 'completed' && { 
                pickupCode: updateData.pickupCode,
                completedAt: updateData.completedAt 
              })
            } 
          : order
      ));

      toast({
        title: 'Status Updated',
        description: `Order status updated to ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCompleteOrder = (order) => {
    setCurrentOrder(order);
    setIsConfirmModalOpen(true);
  };

  const confirmCompleteOrder = async () => {
    if (!currentOrder) return;

    try {
      await updateOrderStatus(currentOrder.id, 'completed');
      setIsConfirmModalOpen(false);
      setIsQRScannerOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark order as ready',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleQRScan = async (result) => {
    if (!currentOrder) return;
  
    try {
      // Extract the full scanned value
      const scannedValue = result[0]?.rawValue;
  
      // Check if the scanned value matches the expected format
      const expectedPrefix = `order-pickup:${currentOrder.id}`;
      
      if (scannedValue === expectedPrefix) {
        await updateDoc(doc(firestore, 'orders', currentOrder.id), {
          status: 'picked_up',
          pickedUpAt: new Date()
        });
  
        setOrders(orders.map(order => 
          order.id === currentOrder.id 
            ? { 
                ...order, 
                status: 'picked_up',
                pickedUpAt: new Date()
              } 
            : order
        ));
  
        toast({
          title: 'Order Confirmed',
          description: 'Order has been successfully picked up.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
  
        setIsQRScannerOpen(false);
        setCurrentOrder(null);
      } else {
        toast({
          title: 'Invalid QR Code',
          description: 'The scanned QR code does not match this order.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify order pickup',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Filtering logic
  const filteredOrders = orders.filter(order => 
    filter === 'all' ? true : order.status === filter
  );

  // Loading and error states
  if (loading) {
    return (
      <Container maxW="container.xl" centerContent py={8}>
        <Spinner size="xl" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={4}>Order Management</Heading>
          <HStack spacing={4}>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              width="200px"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="picked_up">Picked Up</option>
            </Select>
            <Text color="gray.600">
              Showing {filteredOrders.length} orders
            </Text>
          </HStack>
        </Box>

        {filteredOrders.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No orders found for the selected filter.
          </Alert>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                updateOrderStatus={updateOrderStatus}
                onCompleteOrder={handleCompleteOrder}
              />
            ))}
          </SimpleGrid>
        )}

        {/* Confirmation Modal for Completing Order */}
        <Modal 
          isOpen={isConfirmModalOpen} 
          onClose={() => setIsConfirmModalOpen(false)}
          size="md"
          isCentered
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirm Order Ready</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Are you sure you want to mark this order as ready for pickup?</Text>
              {currentOrder && (
                <Box mt={4}>
                  <Text fontWeight="bold">Order Details:</Text>
                  <Text>Order ID: {currentOrder.id}</Text>
                  <Text>Total: ${currentOrder.total.toFixed(2)}</Text>
                </Box>
              )}
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="ghost" 
                mr={3} 
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="green" 
                onClick={confirmCompleteOrder}
              >
                Confirm Ready
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* QR Scanner Modal */}
        <Modal 
          isOpen={isQRScannerOpen} 
          onClose={() => setIsQRScannerOpen(false)}
          size="md"
          isCentered
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Scan Pickup Code</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4}>
                Scan the QR code to confirm order pickup. 
                Pickup Code: {currentOrder?.pickupCode}
              </Text>
              <Scanner
                onScan={handleQRScan}
                onError={(error) => console.error(error?.message)}
              />
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="ghost" 
                onClick={() => setIsQRScannerOpen(false)}
              >
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default VendorOrders;