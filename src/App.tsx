import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { VerifyOTP } from './components/VerifyOTP';
import { ProductsDashboard } from './components/ProductsDashboard';
import { Cart } from './components/Cart';
import { SalesHistory } from './components/SalesHistory';
// import { AddProduct } from './components/AddProduct';
import { ManageProducts } from './components/ManageProducts';
import { Navigation } from './components/Navigation';
import { ApiService } from './services/api';
import { Product, CartItem, ActiveTab } from './types';
import { Loader } from './components/ui/Loader';
import { ErrorBanner } from './components/ui/ErrorBanner';
import { useToast } from './components/ui/Toast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  const { show } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch products when navigating to Manage Products and list is empty
  useEffect(() => {
    if (isAuthenticated && activeTab === 'manage-products' && products.length === 0) {
      loadProducts();
    }
  }, [isAuthenticated, activeTab]);

  const loadProducts = async () => {
    try {
      const response = await ApiService.getAllProducts();
      // Normalize possible response shapes
      let list: Product[] = [];
      if (Array.isArray(response)) {
        list = response as Product[];
      } else if (Array.isArray((response as any)?.data)) {
        list = (response as any).data as Product[];
      } else if (Array.isArray((response as any)?.products)) {
        list = (response as any).products as Product[];
      } else if ((response as any)?.success && Array.isArray((response as any)?.data?.products)) {
        list = (response as any).data.products as Product[];
      }
      setProducts(list);
    } catch (error) {
      console.error('Failed to load products:', error);
  setError((error as any)?.message || 'Failed to load products');
    }
  };

  const handleOTPRequired = (email: string) => {
    setLoginEmail(email);
    setShowOTPVerification(true);
  };

  const handleOTPVerified = (_token: string) => {
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
    if (sizeStock === 0) {
      show('Selected size is out of stock', { type: 'warning' });
      return;
    }
    
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
        show('No more stock available for this size', { type: 'warning' });
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
    if (cartItems.length === 0) {
      show('Cart is empty. Add items before checkout.', { type: 'warning' });
      return;
    }

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
        show('Order created successfully', { type: 'success' });
      } else {
        show('Failed to create order', { type: 'error' });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      show('Error creating order. Please try again.', { type: 'error' });
    }
  };


  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.cartQuantity, 0);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <Loader fullScreen label="Loading..." />;
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
        return (
          <ProtectedRoute fallback={<Login onLogin={handleOTPVerified} onOTPRequired={handleOTPRequired} />}>
            <SalesHistory />
          </ProtectedRoute>
        );
      case 'manage-products':
        return (
          <ProtectedRoute fallback={<Login onLogin={handleOTPVerified} onOTPRequired={handleOTPRequired} />}>
            <ManageProducts
              products={products}
              onProductsChange={loadProducts}
            />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute fallback={<Login onLogin={handleOTPVerified} onOTPRequired={handleOTPRequired} />}>
            <ProductsDashboard 
              products={products} 
              onAddToCart={handleAddToCart}
              onNavigate={setActiveTab}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md lg:max-w-[100%] mx-auto lg:flex-col lg:flex lg:justify-between bg-surface min-h-screen lg:shadow-strong">
        {error && (
          <div className="p-4"><ErrorBanner message={error} onRetry={() => { setError(null); loadProducts(); }} /></div>
        )}
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