import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Check, Trash2, Phone, CreditCard, Banknote, Percent, FileText } from 'lucide-react';
import { CartItem } from '../types';
import { UPIPaymentModal } from './UPIPaymentModal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useToast } from './ui/Toast';

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
  const { show } = useToast();
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID'>('PENDING');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  
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
    if (!cartItems.length) {
      show('Cart is empty. Add items before checkout.', { type: 'warning' });
      return;
    }
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
      paymentStatus: 'PAID' as const,
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
    setPaymentStatus('PAID');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-100 rounded-3xl mb-6">
            <ShoppingCart className="h-10 w-10 text-accent-400" />
          </div>
          <h2 className="font-display text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-accent-400">Add some products to get started</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-surface border-b border-gray-100 sticky top-0 z-10">
          <div className="px-6 py-4">
            <h1 className="font-display text-2xl font-semibold text-gray-900">Cart</h1>
            <p className="text-accent-400 text-sm mt-1">
              {cartItems.reduce((sum, item) => sum + item.cartQuantity, 0)} items
            </p>
          </div>
        </div>

        <div className="p-6 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cart Items */}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item._id} className="card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-display font-medium text-gray-900 text-lg">{item.name}</h3>
                      <p className="text-accent-400 text-sm">Size: {item.selectedSize}</p>
                      <p className="text-primary font-semibold mt-1">₹{item.retailPrice}</p>
                    </div>
                    
                    <button
                      onClick={() => setConfirmRemoveId(item._id)}
                      className="p-2 text-accent-400 hover:text-primary hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center bg-gray-50 rounded-xl p-1">
                      <button
                        onClick={() => onUpdateQuantity(item._id, item.cartQuantity - 1)}
                        disabled={item.cartQuantity <= 1}
                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      
                      <span className="font-semibold text-lg min-w-[3rem] text-center">
                        {item.cartQuantity}
                      </span>
                      
                      <button
                        onClick={() => onUpdateQuantity(item._id, item.cartQuantity + 1)}
                        disabled={item.cartQuantity >= item.quantity}
                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-display font-semibold text-xl text-gray-900">
                        ₹{item.retailPrice * item.cartQuantity}
                      </p>
                      <p className="text-green-600 text-sm">
                        +₹{(item.retailPrice - item.wholesalePrice) * item.cartQuantity} profit
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Customer Info */}
              <div className="card p-6">
                <h3 className="font-display font-medium text-gray-900 mb-4">Customer Details</h3>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-accent-400 h-5 w-5" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number (optional)"
                    className="input-fieldIcon pl-12"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="card p-6">
                <h3 className="font-display font-medium text-gray-900 mb-4">Payment Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex items-center justify-center space-x-2 py-4 px-4 rounded-xl border-2 transition-all duration-200 ${
                      paymentMethod === 'CASH'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300 text-accent-600'
                    }`}
                  >
                    <Banknote className="h-5 w-5" />
                    <span className="font-medium">Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`flex items-center justify-center space-x-2 py-4 px-4 rounded-xl border-2 transition-all duration-200 ${
                      paymentMethod === 'UPI'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300 text-accent-600'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">UPI</span>
                  </button>
                </div>
              </div>

              {/* Payment Status */}
              <div className="card p-6">
                <h3 className="font-display font-medium text-gray-900 mb-4">Payment Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('PENDING')}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                      paymentStatus === 'PENDING'
                        ? 'border-secondary bg-secondary/10 text-secondary/80'
                        : 'border-gray-200 hover:border-gray-300 text-accent-600'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('PAID')}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                      paymentStatus === 'PAID'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-accent-600'
                    }`}
                  >
                    Paid
                  </button>
                </div>
              </div>

              {/* Discount & Notes */}
              <div className="card p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (₹)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 transform -translate-y-1/2 text-accent-400 h-5 w-5" />
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      min="0"
                      max={subtotal}
                      className="input-fieldIcon pl-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 text-accent-400 h-5 w-5" />
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add order notes..."
                      rows={3}
                      className="input-fieldIcon pl-12 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="card p-6">
                <h3 className="font-display font-medium text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-accent-600">Subtotal</span>
                    <span className="font-medium">₹{subtotal}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-accent-600">Discount</span>
                      <span className="font-medium text-primary">-₹{discountAmount}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-accent-600">Profit</span>
                    <span className="font-medium text-green-600">₹{Math.max(0, totalProfit)}</span>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-display font-semibold text-gray-900">Total</span>
                      <span className="font-display text-2xl font-semibold text-primary">₹{totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleConfirmSale}
                disabled={totalAmount <= 0}
                className="w-full btn-primary py-4 px-6 rounded-2xl font-semibold flex items-center justify-center space-x-3 shadow-medium hover:shadow-strong disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Check className="h-5 w-5" />
                <span>{paymentMethod === 'UPI' ? 'Show UPI QR' : 'Complete Sale'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <UPIPaymentModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        onReceived={handleUPIPaymentReceived}
        amount={totalAmount}
      />

      <ConfirmDialog
        isOpen={!!confirmRemoveId}
        title="Remove item?"
        message="This will remove the item from the cart."
        confirmText="Remove"
        onCancel={() => setConfirmRemoveId(null)}
        onConfirm={() => {
          if (confirmRemoveId) onRemoveItem(confirmRemoveId);
          setConfirmRemoveId(null);
        }}
      />
    </>
  );
};