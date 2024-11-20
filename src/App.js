import React, { useState, useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Home from './pages/home/Home';
import Navbar from './Components/navbar/Navbar';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';
import Main from './pages/main/Main';
import Shop from './pages/shop/Shop';
import AdminShops from './pages/vendors/AdminShops';
import VendorItems from './pages/vendors/VendorItems';
import Cart from './pages/cart/Cart';
import VendorOrders from './pages/vendors/VendorOrders';
import UserOrders from './pages/orders/UserOrders';
import { getCurrentUser } from './Components/firebase/Firebase';
import OrderWaitingPage from './pages/utils/WaitingPage';
import Footer from './Components/footer/Footer';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ChakraProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/order-waiting" element={<OrderWaitingPage />} />
          
          <Route
            path="/main"
            element={
              <ProtectedRoute>
                <Main />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop/:shopId"
            element={
              <ProtectedRoute>
                <Shop />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <UserOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shops"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminShops />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/items"
            element={
              <ProtectedRoute requiredRole="vendor">
                <VendorItems />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/orders"
            element={
              <ProtectedRoute requiredRole="vendor">
                <VendorOrders />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Footer/>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;