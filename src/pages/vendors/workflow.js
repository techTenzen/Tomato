import React, { useState, useEffect } from 'react';
import {
  Container,
  VStack,
  HStack,
  Heading,
  Box,
  Text,
  Flex,
  Badge,
  Button,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Collapse,
} from '@chakra-ui/react';
import { 
  AiOutlineClockCircle, 
  AiOutlineCheckCircle, 
  AiOutlineExclamationCircle,
  AiOutlineSearch,
  AiOutlinePlayCircle,
  AiOutlineDown,
  AiOutlineUp,
  AiOutlineStop
} from 'react-icons/ai';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { OrderDetailsModal, calculatePriority } from './modal';

const OrderCard = ({ order, onViewDetails, onUpdateStatus, expandedOrders, toggleOrderExpansion }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box 
      borderWidth={1} 
      borderRadius="lg" 
      p={4} 
      bg={bgColor} 
      borderColor={
        order.priority === 'high' ? 'red.500' :
        order.priority === 'medium' ? 'yellow.500' : 
        borderColor
      }
      borderLeftWidth={4}
      shadow="md"
      mb={4}
      width="100%"
    >
      <Flex justifyContent="space-between" alignItems="center">
        <HStack spacing={4}>
          <Text fontWeight="bold">Order #{order.id.slice(-6)}</Text>
          <Badge 
            colorScheme={
              order.priority === 'high' ? 'red' :
              order.priority === 'medium' ? 'yellow' : 'green'
            }
          >
            {order.priority.toUpperCase()} PRIORITY
          </Badge>
          <Text fontSize="sm" color="gray.500">
            {order.createdAt?.toLocaleString()}
          </Text>
        </HStack>
        <HStack>
          <Button 
            size="sm" 
            onClick={() => onViewDetails(order)}
          >
            View Details
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleOrderExpansion(order.id)}
          >
            {expandedOrders[order.id] ? <AiOutlineUp /> : <AiOutlineDown />}
          </Button>
        </HStack>
      </Flex>

      <Flex mt={2} justifyContent="space-between">
        <Text>Customer: {order.customer?.name || 'Anonymous'}</Text>
        <Text fontWeight="bold">Total: ${order.total?.toFixed(2) || 'N/A'}</Text>
      </Flex>

      <Collapse in={expandedOrders[order.id]} animateOpacity>
        <Box mt={4}>
          <Divider mb={4} />
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Item</Th>
                <Th isNumeric>Quantity</Th>
                <Th isNumeric>Price</Th>
                <Th isNumeric>Subtotal</Th>
              </Tr>
            </Thead>
            <Tbody>
              {order.items?.map((item, index) => (
                <Tr key={index}>
                  <Td>{item.name}</Td>
                  <Td isNumeric>{item.quantity}</Td>
                  <Td isNumeric>${item.price?.toFixed(2)}</Td>
                  <Td isNumeric>${(item.quantity * item.price)?.toFixed(2)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          <HStack mt={4} spacing={2} justifyContent="flex-end">
            {order.status === 'pending' && (
              <Button 
                size="sm" 
                colorScheme="green"
                onClick={() => onUpdateStatus(order.id, 'processing')}
                leftIcon={<AiOutlinePlayCircle />}
              >
                Start Processing
              </Button>
            )}
            {order.status === 'processing' && (
              <>
                <Button 
                  size="sm" 
                  colorScheme="green"
                  onClick={() => onUpdateStatus(order.id, 'completed')}
                  leftIcon={<AiOutlineCheckCircle />}
                >
                  Complete
                </Button>
                <Button 
                  size="sm" 
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onUpdateStatus(order.id, 'cancelled')}
                  leftIcon={<AiOutlineStop />}
                >
                  Cancel
                </Button>
              </>
            )}
          </HStack>
        </Box>
      </Collapse>
    </Box>
  );
};

const OrderSection = ({ title, icon: Icon, orders, onViewDetails, onUpdateStatus, expandedOrders, toggleOrderExpansion }) => (
  <Box>
    <Heading size="md" mb={4}>
      <HStack>
        <Icon />
        <Text>{title}</Text>
        <Badge ml={2} colorScheme="gray">{orders.length}</Badge>
      </HStack>
    </Heading>
    <VStack spacing={4} align="stretch">
      {orders.map(order => (
        <OrderCard 
          key={order.id} 
          order={order}
          onViewDetails={onViewDetails}
          onUpdateStatus={onUpdateStatus}
          expandedOrders={expandedOrders}
          toggleOrderExpansion={toggleOrderExpansion}
        />
      ))}
    </VStack>
  </Box>
);

const VendorOrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({});

  const firestore = getFirestore();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const ordersRef = collection(firestore, 'orders');
        const q = query(ordersRef, where('shopId', '==', user.shopId));
        const snapshot = await getDocs(q);
        
        const ordersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          priority: calculatePriority(doc.data())
        })).sort((a, b) => b.createdAt - a.createdAt);
        
        setOrders(ordersList);
        setFilteredOrders(ordersList);
      } catch (error) {
        console.error('Failed to fetch orders', error);
      }
    };

    fetchOrders();
  }, [firestore]);

  useEffect(() => {
    let result = orders;

    if (searchTerm) {
      result = result.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priorityFilter !== 'all') {
      result = result.filter(order => order.priority === priorityFilter);
    }

    setFilteredOrders(result);
  }, [orders, searchTerm, priorityFilter]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(firestore, 'orders', orderId), { 
        status: newStatus,
        updatedAt: new Date()
      });
      
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date() } 
          : order
      ));
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus, updatedAt: new Date() }));
      }
    } catch (error) {
      console.error('Failed to update order status', error);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack spacing={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <AiOutlineSearch />
            </InputLeftElement>
            <Input 
              placeholder="Search orders..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            width="200px"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </Select>
        </HStack>

        <OrderSection
          title="Pending Orders"
          icon={AiOutlineClockCircle}
          orders={filteredOrders.filter(order => order.status === 'pending')}
          onViewDetails={setSelectedOrder}
          onUpdateStatus={updateOrderStatus}
          expandedOrders={expandedOrders}
          toggleOrderExpansion={toggleOrderExpansion}
        />

        <OrderSection
          title="Processing Orders"
          icon={AiOutlinePlayCircle}
          orders={filteredOrders.filter(order => order.status === 'processing')}
          onViewDetails={setSelectedOrder}
          onUpdateStatus={updateOrderStatus}
          expandedOrders={expandedOrders}
          toggleOrderExpansion={toggleOrderExpansion}
        />

        <OrderSection
          title="High Priority Orders"
          icon={AiOutlineExclamationCircle}
          orders={filteredOrders.filter(order => 
            order.status === 'processing' && order.priority === 'high'
          )}
          onViewDetails={setSelectedOrder}
          onUpdateStatus={updateOrderStatus}
          expandedOrders={expandedOrders}
          toggleOrderExpansion={toggleOrderExpansion}
        />

        <OrderSection
          title="Completed Orders"
          icon={AiOutlineCheckCircle}
          orders={filteredOrders.filter(order => order.status === 'completed')}
          onViewDetails={setSelectedOrder}
          onUpdateStatus={updateOrderStatus}
          expandedOrders={expandedOrders}
          toggleOrderExpansion={toggleOrderExpansion}
        />

        <OrderSection
          title="Cancelled Orders"
          icon={AiOutlineStop}
          orders={filteredOrders.filter(order => order.status === 'cancelled')}
          onViewDetails={setSelectedOrder}
          onUpdateStatus={updateOrderStatus}
          expandedOrders={expandedOrders}
          toggleOrderExpansion={toggleOrderExpansion}
        />

        <OrderDetailsModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          onUpdateStatus={updateOrderStatus}
        />
      </VStack>
    </Container>
  );
};

export default VendorOrderDashboard;