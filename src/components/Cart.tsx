import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Check, Trash2, Phone, CreditCard, Banknote, Percent, FileText } from 'lucide-react';
import { CartItem } from '../types';
import { UPIPaymentModal } from './UPIPaymentModal';

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onConfirmSale: (orderData: {
    customerPhone?: string;
    paymentMethod: 'CASH' | 'UPI';
    paymentStatus: 'PENDING' | 'PAID';
    discount?: number;
    notes?: string;
  }) => void;
}

export const Cart: React.FC<CartProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmSale
}) => {
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID'>('PENDING');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [showUPIModal, setShowUPIModal] = useState(false);
  
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.retailPrice * item.cartQuantity,
    0
  );

  const discountAmount = discount ? parseFloat(discount) : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const totalProfit = cartItems.reduce(
    (sum, item) => sum + (item.retailPrice - item.wholesalePrice) * item.cartQuantity,
    0
  ) - discountAmount;

  const handleConfirmSale = () => {
    const orderData = {
      customerPhone: customerPhone.trim() || undefined,
      paymentMethod,
      paymentStatus,
      discount: discountAmount || undefined,
      notes: notes.trim() || undefined,
    };

    if (paymentMethod === 'UPI') {
      setShowUPIModal(true);
    } else {
      onConfirmSale(orderData);
      resetForm();
    }
  };

  const handleUPIPaymentReceived = () => {
    const orderData = {
      customerPhone: customerPhone.trim() || undefined,
      paymentMethod: 'UPI' as const,
      paymentStatus,
      discount: discountAmount || undefined,
      notes: notes.trim() || undefined,
    };
    
    setShowUPIModal(false);
    onConfirmSale(orderData);
    resetForm();
  };

  const resetForm = () => {
    setCustomerPhone('');
    setDiscount('');
    setNotes('');
    setPaymentMethod('CASH');
    setPaymentStatus('PENDING');
  };

  if (cartItems.length === 0) {
    return (
      <div className="p-4 pb-20 lg:pb-4 lg:pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cart</h1>
        
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-2">Your cart is empty</p>
          <p className="text-gray-400">Add some products to get started</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 pb-20 lg:pb-4 lg:pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cart Items */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 lg:block hidden">Items</h2>
            {cartItems.map((item) => (
              <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>
                    <p className="text-blue-600 font-medium">₹{item.retailPrice} each</p>
                  </div>
                  
                  <button
                    onClick={() => onRemoveItem(item._id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onUpdateQuantity(item._id, item.cartQuantity - 1)}
                      disabled={item.cartQuantity <= 1}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    
                    <span className="font-semibold text-lg min-w-[2rem] text-center">
                      {item.cartQuantity}
                    </span>
                    
                    <button
                      onClick={() => onUpdateQuantity(item._id, item.cartQuantity + 1)}
                      disabled={item.cartQuantity >= item.quantity}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      ₹{item.retailPrice * item.cartQuantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      Profit: ₹{(item.retailPrice - item.wholesalePrice) * item.cartQuantity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 lg:block hidden">Order Details</h2>
            
            {/* Customer Phone */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Customer Phone (Optional)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter customer phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <CreditCard className="inline h-4 w-4 mr-1" />
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'CASH'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  <span className="font-medium">Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'UPI'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">UPI</span>
                </button>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PENDING')}
                  className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                    paymentStatus === 'PENDING'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PAID')}
                  className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                    paymentStatus === 'PAID'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>

            {/* Discount */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="inline h-4 w-4 mr-1" />
                Discount (₹)
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                min="0"
                max={subtotal}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add order notes..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">
                    {cartItems.reduce((sum, item) => sum + item.cartQuantity, 0)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{subtotal}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-red-600">-₹{discountAmount}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Profit:</span>
                  <span className="font-medium text-green-600">₹{Math.max(0, totalProfit)}</span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-blue-600">₹{totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleConfirmSale}
              disabled={totalAmount <= 0}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-5 w-5" />
              <span>{paymentMethod === 'UPI' ? 'Show UPI QR' : 'Confirm Sale'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* UPI Payment Modal */}
      <UPIPaymentModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        onReceived={handleUPIPaymentReceived}
        amount={totalAmount}
      />
    </>
  );
};