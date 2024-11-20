// VendorOrders.js
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
  HStack
} from '@chakra-ui/react';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// Helper functions defined outside the component
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
    cancelled: 'red'
  };
  return colors[status] || 'gray';
};

// Define OrderCard component separately
const OrderCard = ({ order, updateOrderStatus }) => (
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
          {order.status.toUpperCase()}
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

      {order.status !== 'completed' && order.status !== 'cancelled' && (
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
            <Button
              colorScheme="green"
              onClick={() => updateOrderStatus(order.id, 'completed')}
              flex={1}
            >
              Mark Completed
            </Button>
          )}
          <Button
            colorScheme="red"
            variant="outline"
            onClick={() => updateOrderStatus(order.id, 'cancelled')}
            flex={1}
          >
            Cancel Order
          </Button>
        </HStack>
      )}
    </Stack>
  </Box>
);

// Main component
const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(firestore, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
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

  const filteredOrders = orders.filter(order => 
    filter === 'all' ? true : order.status === filter
  );

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
              />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
};

export default VendorOrders;