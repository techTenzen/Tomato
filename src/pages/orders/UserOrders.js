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
  Spinner,
  Alert,
  AlertIcon,
  HStack,
} from '@chakra-ui/react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) throw new Error('No user found');

      const firestore = getFirestore();
      const ordersRef = collection(firestore, 'orders');
      const q = query(ordersRef, where('customerEmail', '==', user.email));
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
    }
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
        <Heading size="xl">My Orders</Heading>

        {orders.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            You haven't placed any orders yet.
          </Alert>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {orders.map((order) => (
              <Box
                key={order.id}
                borderWidth="1px"
                borderRadius="lg"
                p={6}
                bg="white"
                shadow="sm"
              >
                <VStack spacing={4} align="stretch">
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
                      {format(order.createdAt, 'PPp')}
                    </Text>
                  </HStack>

                  <Box>
                    <Text fontWeight="bold" mb={2}>Shop</Text>
                    <Text>{order.shopName}</Text>
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
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
};

export default UserOrders;