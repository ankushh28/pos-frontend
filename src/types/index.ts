export interface Product {
  _id: string;
  id?: number; // For backward compatibility
  name: string;
  category: string;
  wholesalePrice: number;
  retailPrice: number;
  sizes: ProductSize[];
  description?: string;
  brand?: string;
  barcode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSize {
  size: string;
  quantity: number;
}

export interface ProductFormData {
  name: string;
  category: string;
  wholesalePrice: number;
  retailPrice: number;
  sizes: ProductSize[];
  description?: string;
  brand?: string;
  barcode?: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
  quantity: number; // Total quantity for cart display
  selectedSize: string;
}

export interface OrderItem {
  product: string | Product; // Product ID for API or populated Product object
  size: string;
  qty: number;
  price: number;
  subtotal?: number;
}

export interface Order {
  _id: string;
  date: string;
  items: OrderItem[];
  total: number;
  profit: number;
  customerPhone?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  paymentMethod: 'CASH' | 'UPI';
  discount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderResponse {
  orders: Order[];
  analytics: {
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
    avgOrderPrice: number;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UploadBatch {
  _id: string;
  uploadId: string;
  fileName: string;
  fileHash: string;
  productIds: string[];
  quantityChanges: QuantityChange[];
  uploadedAt: string;
}

export interface QuantityChange {
  productId: string;
  size: string;
  oldQuantity: number;
  newQuantity: number;
}

export type ActiveTab = 'products' | 'cart' | 'history' | 'manage-products' | 'settings';

export interface AuthResponse {
  success: boolean;
  message: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  token: string;
}