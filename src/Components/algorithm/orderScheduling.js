// src/utils/orderScheduling.js
export class OrderScheduler {
  constructor(orders) {
    this.orders = orders;
  }

  // Prioritize orders based on multiple factors
  prioritizeOrders() {
    return this.orders.sort((a, b) => {
      // Calculate priority score for each order
      const getPriorityScore = (order) => {
        let score = 0;
        
        // Time-based priority
        const timeSinceCreation = new Date() - order.createdAt;
        const hoursSinceCreation = timeSinceCreation / (1000 * 60 * 60);
        
        // Prioritize older orders
        score += hoursSinceCreation * 2;
        
        // Higher priority for pending and processing orders
        switch(order.status) {
          case 'pending':
            score += 10;
            break;
          case 'processing':
            score += 5;
            break;
        }
        
        // Consider order total (optional complex weighting)
        score += order.total / 100;
        
        return score;
      };
      
      return getPriorityScore(b) - getPriorityScore(a);
    });
  }

  // Estimate preparation time based on order complexity
  estimatePreparationTime(order) {
    const basePreparationTime = 15; // minutes
    
    // Calculate complexity based on number and type of items
    const itemComplexity = order.items.reduce((total, item) => {
      // Example: Different items might have different preparation times
      const itemWeights = {
        'sandwich': 1,
        'coffee': 0.5,
        'salad': 1.5,
        'smoothie': 1
      };
      
      const itemWeight = itemWeights[item.name.toLowerCase()] || 1;
      return total + (item.quantity * itemWeight);
    }, 0);
    
    return Math.max(basePreparationTime * itemComplexity, 15);
  }

  // Calculate estimated pickup window
  calculatePickupWindow(order) {
    const preparationTime = this.estimatePreparationTime(order);
    const currentTime = new Date();
    
    const estimatedReadyTime = new Date(currentTime.getTime() + preparationTime * 60000);
    const latestPickupTime = new Date(estimatedReadyTime.getTime() + 30 * 60000); // 30 min pickup window
    
    return {
      estimatedReadyTime,
      latestPickupTime
    };
  }

  // Detect potential delays or bottlenecks
  detectPotentialDelays() {
    const delayedOrders = this.orders.filter(order => {
      const timeSinceCreation = new Date() - order.createdAt;
      const hoursSinceCreation = timeSinceCreation / (1000 * 60 * 60);
      
      // Orders pending for more than 1 hour or processing for more than 30 minutes
      return (order.status === 'pending' && hoursSinceCreation > 1) ||
             (order.status === 'processing' && hoursSinceCreation > 0.5);
    });
    
    return delayedOrders;
  }
}

// Utility function to generate notifications for delayed orders
export const generateDelayNotifications = (delayedOrders) => {
  return delayedOrders.map(order => ({
    orderId: order.id,
    message: `Order ${order.id} is experiencing delays. Consider prioritizing or addressing immediately.`,
    severity: 'warning'
  }));
};