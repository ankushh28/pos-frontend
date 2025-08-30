import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { VerifyOTP } from './components/VerifyOTP';
import { ProductsDashboard } from './components/ProductsDashboard';
import { Cart } from './components/Cart';
import { SalesHistory } from './components/SalesHistory';
import { AddProduct } from './components/AddProduct';
import { ManageProducts } from './components/ManageProducts';
import { Navigation } from './components/Navigation';
import { ApiService } from './services/api';
import { Product, CartItem, Order, ActiveTab } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    // Check if user was previously authenticated
    const token = ApiService.getToken();
    if (token) {
      setIsAuthenticated(true);
      loadProducts();
    }
    
    setIsLoading(false);
  }, []);

  const loadProducts = async () => {
    try {
      const response = await ApiService.getAllProducts();
      console.log('API Response:', response);
      if (response.success) {
        const data = response.data;
        console.log('Products data:', data);
        setProducts(data);
      } else {
        console.error('API response not successful:', response);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleOTPRequired = (email: string) => {
    setLoginEmail(email);
    setShowOTPVerification(true);
  };

  const handleOTPVerified = (token: string) => {
    setIsAuthenticated(true);
    setShowOTPVerification(false);
    setLoginEmail('');
    loadProducts();
  };

  const handleBackToLogin = () => {
    setShowOTPVerification(false);
    setLoginEmail('');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowOTPVerification(false);
    setLoginEmail('');
    ApiService.clearToken();
    setCartItems([]); // Clear cart on logout
    setActiveTab('products'); // Reset to products tab
  };

  const handleAddToCart = (product: Product, size: string) => {
    const sizeStock = product.sizes.find(s => s.size === size)?.quantity || 0;
    if (sizeStock === 0) return;
    
    setCartItems(prev => {
      const existingItem = prev.find(item => item._id === product._id && item.selectedSize === size);
      
      if (existingItem) {
        if (existingItem.cartQuantity < sizeStock) {
          return prev.map(item =>
            item._id === product._id && item.selectedSize === size
              ? { ...item, cartQuantity: item.cartQuantity + 1 }
              : item
          );
        }
        return prev;
      } else {
        return [...prev, { ...product, cartQuantity: 1, selectedSize: size, quantity: sizeStock }];
      }
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item._id === id ? { ...item, cartQuantity: quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item._id !== id));
  };

  const handleConfirmSale = async (orderData: {
    customerPhone?: string;
    paymentMethod: 'CASH' | 'UPI';
    paymentStatus: 'PENDING' | 'PAID';
    discount?: number;
    notes?: string;
  }) => {
    if (cartItems.length === 0) return;

    // Create order items for API
    const orderItems = cartItems.map(item => ({
      product: item._id,
      size: item.selectedSize,
      qty: item.cartQuantity,
      price: item.retailPrice
    }));

    const apiOrderData = {
      items: orderItems,
      ...orderData
    };

    try {
      const response = await ApiService.createOrder(apiOrderData);
      
      if (response._id) {
        // Reload products to get updated inventory
        await loadProducts();
        
        // Clear cart
        setCartItems([]);
        
        // Switch to history tab to show the completed sale
        setActiveTab('history');
        
        // Show success feedback
        alert('Order created successfully!');
      } else {
        alert('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    }
  };


  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.cartQuantity, 0);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show OTP verification screen
  if (showOTPVerification) {
    return (
      <VerifyOTP
        email={loginEmail}
        onVerified={handleOTPVerified}
        onBack={handleBackToLogin}
      />
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <Login
        onLogin={handleOTPVerified}
        onOTPRequired={handleOTPRequired}
      />
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'products':
        return (
          <ProductsDashboard 
            products={products} 
            onAddToCart={handleAddToCart}
            onNavigate={setActiveTab}
            onLogout={handleLogout}
          />
        );
      case 'cart':
        return (
          <Cart
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onConfirmSale={handleConfirmSale}
          />
        );
      case 'history':
        return <SalesHistory />;
      case 'manage-products':
        return (
          <ManageProducts
            products={products}
            onProductsChange={loadProducts}
          />
        );
      default:
        return (
          <ProductsDashboard 
            products={products} 
            onAddToCart={handleAddToCart}
            onNavigate={setActiveTab}
            onLogout={handleLogout}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md lg:max-w-[100%] mx-auto lg:flex-col lg:flex lg:justify-between bg-white min-h-screen lg:shadow-lg">
        {renderActiveTab()}
        
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          cartItemsCount={cartItemsCount}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}

export default App;