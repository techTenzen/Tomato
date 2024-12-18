# Campus Food Street App

A **React and Firebase-based web application** designed to streamline food ordering on campus. The platform caters to three distinct user roles: **Customer (Student)**, **Vendor (Café Owner)**, and **Admin**, each with tailored functionalities for a seamless experience.

---

## Features

### **Customer (Student)**  
- Browse a list of available cafés fetched dynamically from Firebase Firestore.  
- View detailed menus categorized by café.  
- Add items to a cart and place orders securely via **PayPal Integration**.  
- Receive a **QR Code** for order pickup upon readiness.

### **Vendor (Café Owner)**  
- Manage and update menus, including food items and prices.  
- View and update orders through various statuses: *Placed → Preparing → Ready*.  
- Scan **QR Codes** to confirm order pickups.

### **Admin**  
- Add and manage cafés in the system.  
- Assign **Store IDs** to link vendors to their respective cafés.

---

## Key Technologies

| Feature                | Technology          |
|------------------------|---------------------|
| **Frontend**           | React              |
| **Routing**            | React Router       |
| **Authentication**     | Firebase Auth      |
| **Database**           | Firebase Firestore |
| **Storage**            | Firebase Storage   |
| **Payments**           | PayPal API         |
| **Realtime Updates**   | Firebase Cloud Functions |

---

## How It Works

1. **Customer Workflow**:  
   - Log in using Firebase Authentication.  
   - Browse cafés, add food items to the cart, and place an order.  
   - Use the provided QR Code for order pickup when ready.

2. **Vendor Workflow**:  
   - Log in to view and manage orders.  
   - Update order statuses and scan QR codes for order confirmation.  
   - Edit menus and upload food images via Firebase Storage.

3. **Admin Workflow**:  
   - Log in to add/manage cafés and assign vendors.  

---

## Challenges Solved
- **Real-time updates** for orders via Firebase Firestore.  
- **Role-based access control** using Firebase Authentication and Firestore rules.  
- **QR Code integration** for secure and efficient order pickup.  
- **Scalable database design** for seamless functionality.  

---

## Future Improvements
- Add notifications for real-time updates.  
- Expand payment options.  
- Introduce analytics for vendors and admins.

---

## License
This project is open-source and available under the [MIT License](LICENSE).
