import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Button,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { 
  AiOutlinePlayCircle, 
  AiOutlineCheckCircle,
  AiOutlineStop
} from 'react-icons/ai';

// Utility function to calculate order priority
export const calculatePriority = (orderData) => {
  const now = new Date();
  const orderTime = orderData.createdAt?.toDate() || now;
  const minutesSinceOrder = (now - orderTime) / (1000 * 60);

  if (orderData.status === 'processing') {
    if (minutesSinceOrder > 45) return 'high';
    if (minutesSinceOrder > 30) return 'medium';
  }
  return 'low';
};

// Modal component for order details
export const OrderDetailsModal = ({ isOpen, onClose, order, onUpdateStatus }) => {
  if (!order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Order Details #{order.id.slice(-6)}
          <Badge
            ml={2}
            colorScheme={
              order.priority === 'high' ? 'red' :
              order.priority === 'medium' ? 'yellow' : 'green'
            }
          >
            {order.priority.toUpperCase()} PRIORITY
          </Badge>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontWeight="bold">Customer Information</Text>
              <Text>Name: {order.customer?.name || 'Anonymous'}</Text>
              <Text>Email: {order.customer?.email || 'N/A'}</Text>
              <Text>Phone: {order.customer?.phone || 'N/A'}</Text>
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="bold" mb={2}>Order Items</Text>
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
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="bold">Order Status</Text>
              <Text>Current Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Text>
              <Text>Created: {order.createdAt?.toLocaleString()}</Text>
              <Text>Last Updated: {order.updatedAt?.toLocaleString()}</Text>
            </Box>

            <Box>
              <Text fontWeight="bold">Order Total</Text>
              <Text fontSize="xl">${order.total?.toFixed(2) || 'N/A'}</Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={2}>
            {order.status === 'pending' && (
              <Button
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
                  colorScheme="green"
                  onClick={() => onUpdateStatus(order.id, 'completed')}
                  leftIcon={<AiOutlineCheckCircle />}
                >
                  Complete
                </Button>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onUpdateStatus(order.id, 'cancelled')}
                  leftIcon={<AiOutlineStop />}
                >
                  Cancel
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};