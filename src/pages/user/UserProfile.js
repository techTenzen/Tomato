import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
  Container,
  VStack,
  Heading,
  Box,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  SimpleGrid,
  Skeleton,
  Alert,
  AlertIcon,
  Divider,
  useToast,
  SkeletonText,
  Stack,
  useColorModeValue,
  Link,
  Button,
  Center
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';

const UserProfile = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [indexError, setIndexError] = useState(null);
  const toast = useToast();
  const firestore = getFirestore();

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverShadow = useColorModeValue('lg', 'dark-lg');
  const tabBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) throw new Error('No user found');

      const ordersRef = collection(firestore, 'orders');
      
      // First try to fetch with ordering
      try {
        const q = query(
          ordersRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const ordersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          completedAt: doc.data().completedAt?.toDate(),
          pickedUpAt: doc.data().pickedUpAt?.toDate()
        }));

        setOrders(ordersList);
        setLoading(false);
        setIndexError(null);
      } catch (indexErr) {
        if (indexErr.code === 'failed-precondition') {
          // Fallback to unordered query
          const fallbackQuery = query(
            ordersRef,
            where('userId', '==', user.uid)
          );
          
          const snapshot = await getDocs(fallbackQuery);
          const ordersList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            completedAt: doc.data().completedAt?.toDate(),
            pickedUpAt: doc.data().pickedUpAt?.toDate()
          }))
          .sort((a, b) => b.createdAt - a.createdAt);

          setOrders(ordersList);
          setLoading(false);
          
          setIndexError({
            message: 'For better performance, please create the required index.',
            link: 'https://console.firebase.google.com/v1/r/project/rentals-5085c/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9yZW50YWxzLTUwODVjL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9vcmRlcnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXR'
          });
        } else {
          throw indexErr;
        }
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to fetch your orders',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'yellow',
      processing: 'blue',
      completed: 'green',
      picked_up: 'purple',
      cancelled: 'red'
    };
    return statusColors[status] || 'gray';
  };

  const OrderCard = ({ order }) => {
    const statusColor = getStatusColor(order.status);

    return (
      <Box
        bg={cardBg}
        p={6}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
        _hover={{ shadow: hoverShadow }}
        transition="all 0.2s"
      >
        <VStack align="stretch" spacing={4}>
          <Box display="flex" justifyContent="space-between" alignItems="start">
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold" fontSize="lg">
                Order #{order.id.slice(-6)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {format(order.createdAt, 'PPp')}
              </Text>
            </VStack>
            <Badge
              colorScheme={statusColor}
              px={3}
              py={1}
              borderRadius="full"
              textTransform="capitalize"
            >
              {order.status.replace('_', ' ')}
            </Badge>
          </Box>

          <Divider />

          <Box>
            <Text fontWeight="medium" mb={2}>
              Items:
            </Text>
            <VStack align="stretch" spacing={1}>
              {order.items.map((item, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent="space-between"
                  fontSize="sm"
                >
                  <Text>
                    {item.quantity}x {item.name}
                  </Text>
                  <Text>${(item.price * item.quantity).toFixed(2)}</Text>
                </Box>
              ))}
            </VStack>
          </Box>

          <Divider />

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold">Total:</Text>
            <Text fontWeight="bold" fontSize="lg" color={useColorModeValue('green.600', 'green.300')}>
              ${order.total.toFixed(2)}
            </Text>
          </Box>

          {order.status === 'completed' && order.pickupCode && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text>
                Pickup Code: <Text as="span" fontWeight="bold">{order.pickupCode}</Text>
              </Text>
            </Alert>
          )}

          {order.completedAt && (
            <Text fontSize="sm" color="gray.500">
              Completed: {format(order.completedAt, 'PPp')}
            </Text>
          )}

          {order.pickedUpAt && (
            <Text fontSize="sm" color="gray.500">
              Picked up: {format(order.pickedUpAt, 'PPp')}
            </Text>
          )}

          {order.shopName && (
            <Text fontSize="sm" color="gray.500">
              Shop: {order.shopName}
            </Text>
          )}
        </VStack>
      </Box>
    );
  };

  const OrderSkeleton = () => (
    <Box
      p={6}
      borderWidth="1px"
      borderRadius="lg"
      bg={cardBg}
    >
      <Stack spacing={4}>
        <Box display="flex" justifyContent="space-between">
          <Skeleton height="24px" width="150px" />
          <Skeleton height="24px" width="100px" />
        </Box>
        <Divider />
        <SkeletonText noOfLines={4} spacing={2} />
        <Divider />
        <Box display="flex" justifyContent="space-between">
          <Skeleton height="24px" width="80px" />
          <Skeleton height="24px" width="100px" />
        </Box>
      </Stack>
    </Box>
  );

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8}>
          <Skeleton height="40px" width="200px" />
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} width="full">
            {[1, 2, 3, 4].map(i => <OrderSkeleton key={i} />)}
          </SimpleGrid>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  const ongoingOrders = orders.filter(order => 
    ['pending', 'processing', 'completed'].includes(order.status)
  );

  const pastOrders = orders.filter(order => 
    ['picked_up', 'cancelled'].includes(order.status)
  );

  const NoOrdersMessage = ({ message }) => (
    <Center p={8}>
      <VStack spacing={4}>
        <Text color="gray.500" fontSize="lg">{message}</Text>
      </VStack>
    </Center>
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>My Orders</Heading>
          <Text color="gray.500">View and track all your orders</Text>
        </Box>

        {indexError && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text>{indexError.message}</Text>
              <Link href={indexError.link} isExternal color="blue.500">
                Create Index <ExternalLinkIcon mx="2px" />
              </Link>
            </Box>
          </Alert>
        )}

        <Tabs variant="enclosed-colored" colorScheme="blue">
          <TabList>
            <Tab _selected={{ bg: tabBg, borderBottom: "none" }}>
              Ongoing Orders ({ongoingOrders.length})
            </Tab>
            <Tab _selected={{ bg: tabBg, borderBottom: "none" }}>
              Order History ({pastOrders.length})
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              {ongoingOrders.length === 0 ? (
                <NoOrdersMessage message="You don't have any ongoing orders at the moment." />
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
                  {ongoingOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>

            <TabPanel>
              {pastOrders.length === 0 ? (
                <NoOrdersMessage message="You don't have any past orders." />
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
                  {pastOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default UserProfile;