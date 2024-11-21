import React, { useState, useEffect } from 'react';
import {
  Container,
  VStack,
  Heading,
  Box,
  Text,
  SimpleGrid,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
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
import OrderCard from '../../Components/order/OrderCard';
import { generatePickupCode } from '../utils/helpers';
import { OrderScheduler, generateDelayNotifications } from '../../Components/algorithm/orderScheduling';

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [delayNotifications, setDelayNotifications] = useState([]);
  const [qrScannerState, setQRScannerState] = useState({ isOpen: false, order: null });
  
  const toast = useToast();
  const firestore = getFirestore();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      const scheduler = new OrderScheduler(orders);
      const delayedOrders = scheduler.detectPotentialDelays();
      const notifications = generateDelayNotifications(delayedOrders);
      setDelayNotifications(notifications);
    }
  }, [orders]);

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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
      };
      if (newStatus === 'completed') {
        updateData.pickupCode = generatePickupCode();
        updateData.completedAt = new Date();
      }
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      
      // Update local state for orders
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus, ...(newStatus === 'completed' && { pickupCode: updateData.pickupCode, completedAt: updateData.completedAt }) } : order
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
      
      // Open the QR Scanner after marking as ready
      openQRScanner(currentOrder);

      setIsConfirmModalOpen(false);
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

  const openQRScanner = (order) => {
    setQRScannerState({ isOpen: true, order });
  };

  const closeQRScanner = () => {
    setQRScannerState({ isOpen: false, order: null });
  };

  const handleQRScan = async (result) => {
    const scanningOrder = qrScannerState.order;
    if (!scanningOrder) return;
    
    try {
      const scannedValue = result[0]?.rawValue;
      const expectedValue = `order-pickup:${scanningOrder.id}`;
      
      if (scannedValue === expectedValue) {
        await updateDoc(doc(firestore, 'orders', scanningOrder.id), { status: 'picked_up', pickedUpAt: new Date() });
        
        // Update local state for orders
        setOrders(orders.map(order =>
          order.id === scanningOrder.id ? { ...order, status: 'picked_up', pickedUpAt: new Date() } : order
        ));
        
        toast({
          title: 'Order Confirmed',
          description: 'Order has been successfully picked up.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        closeQRScanner();
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

  const filteredOrders = orders.filter(order => filter === 'all' ? true : order.status === filter);

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
        {delayNotifications.length > 0 && (
          <Box>
            {delayNotifications.map((notification, index) => (
              <Alert status="warning" key={index} mb={2}>
                <AlertIcon />
                {notification.message}
              </Alert>
            ))}
          </Box>
        )}
        
        <Box>
          <Heading size="xl" mb={4}>Order Management</Heading>
          <HStack spacing={4}>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} width="200px">
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="picked_up">Picked Up</option>
            </Select>
            <Text color="gray.600"> Showing {filteredOrders.length} orders </Text>
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
                onScanQR={() => openQRScanner(order)} 
              />
            ))}
          </SimpleGrid>
        )}

        {/* Confirmation Modal */}
        <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} size="md" isCentered>
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
              <Button variant="ghost" mr={3} onClick={() => setIsConfirmModalOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={confirmCompleteOrder}>
                Confirm Ready
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* QR Scanner Modal */}
        <Modal isOpen={qrScannerState.isOpen} onClose={closeQRScanner} size="md" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Scan Pickup Code</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4}>
                Scan the QR code to confirm order pickup. Pickup Code: {qrScannerState.order?.pickupCode}
              </Text>
              <Scanner onScan={handleQRScan} onError={(error) => console.error(error?.message)} />
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={closeQRScanner}>
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