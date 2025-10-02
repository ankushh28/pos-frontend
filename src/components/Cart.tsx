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
        <div className="bg-surface border-b border-gray-100 sticky top-0 z-30">
          <div className="px-5 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-gray-900">Cart</h1>
              <p className="text-accent-400 text-sm mt-1">{cartItems.reduce((s,i)=>s+i.cartQuantity,0)} items</p>
            </div>
            {/* Desktop quick total */}
            <div className="hidden lg:flex items-center gap-6 pr-2">
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-accent-400 font-medium">Total</p>
                <p className="font-display text-xl font-semibold text-primary">₹{totalAmount}</p>
              </div>
              <button
                onClick={handleConfirmSale}
                disabled={totalAmount <= 0}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-5 w-5" />
                <span>{paymentMethod === 'UPI' ? 'Show UPI QR' : 'Complete Sale'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 lg:px-8 py-6 pb-40 lg:pb-24">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Items List */}
            <div className="space-y-4 xl:col-span-7">
              {cartItems.map(item => {
                const lineProfit = (item.retailPrice - item.wholesalePrice) * item.cartQuantity;
                return (
                  <div key={item._id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-medium text-gray-900 text-lg truncate">{item.name}</h3>
                        <p className="text-accent-400 text-sm mt-0.5">Size: {item.selectedSize}</p>
                        <p className="text-primary font-semibold mt-1 text-sm">₹{item.retailPrice}</p>
                      </div>
                      <button
                        onClick={() => setConfirmRemoveId(item._id)}
                        className="p-2 text-accent-400 hover:text-primary hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center bg-gray-50 rounded-xl p-1">
                        <button
                          onClick={() => onUpdateQuantity(item._id, item.cartQuantity - 1)}
                          disabled={item.cartQuantity <= 1}
                          className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-semibold text-base w-10 text-center tabular-nums">{item.cartQuantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item._id, item.cartQuantity + 1)}
                          disabled={item.cartQuantity >= item.quantity}
                          className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right ml-auto">
                        <p className="font-display font-semibold text-lg text-gray-900">₹{item.retailPrice * item.cartQuantity}</p>
                        <p className="text-emerald-600 text-xs font-medium mt-0.5">+₹{lineProfit} profit</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Side Panel */}
            <div className="space-y-6 xl:col-span-5">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Customer */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone (optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-400 h-5 w-5" />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Phone number"
                        className="input-fieldIcon pl-12"
                      />
                    </div>
                  </div>
                  {/* Payment Method */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent-400 mb-2">Payment Method</p>
                    <div className="flex gap-2">
                      {[
                        { label: 'Cash', value: 'CASH' as const, icon: <Banknote className="h-4 w-4" /> },
                        { label: 'UPI', value: 'UPI' as const, icon: <CreditCard className="h-4 w-4" /> }
                      ].map(btn => {
                        const active = paymentMethod === btn.value;
                        return (
                          <button
                            key={btn.value}
                            onClick={() => setPaymentMethod(btn.value)}
                            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all ${active ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-gray-200 hover:border-gray-300 text-accent-600'}`}
                            aria-pressed={active}
                          >{btn.icon}{btn.label}</button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Payment Status */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent-400 mb-2">Payment Status</p>
                    <div className="flex gap-2">
                      {[
                        { label: 'Pending', value: 'PENDING' as const },
                        { label: 'Paid', value: 'PAID' as const }
                      ].map(btn => {
                        const active = paymentStatus === btn.value;
                        return (
                          <button
                            key={btn.value}
                            onClick={() => setPaymentStatus(btn.value)}
                            className={`flex-1 px-3 py-3 rounded-xl border text-sm font-medium transition-all ${active ? (btn.value==='PENDING' ? 'border-secondary bg-secondary/10 text-secondary/80' : 'border-green-500 bg-green-50 text-green-700') : 'border-gray-200 hover:border-gray-300 text-accent-600'}`}
                            aria-pressed={active}
                          >{btn.label}</button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount (₹)</label>
                    <div className="relative">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-400 h-5 w-5" />
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0"
                        min={0}
                        max={subtotal}
                        className="input-fieldIcon pl-12"
                      />
                    </div>
                  </div>
                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
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
                {/* Summary Inline (desktop hidden footer elsewhere on mobile) */}
                <div className="mt-4 rounded-2xl bg-gray-50 p-5 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-accent-500">Subtotal</span><span className="font-medium">₹{subtotal}</span></div>
                  {discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-accent-500">Discount</span><span className="font-medium text-primary">-₹{discountAmount}</span></div>}
                  <div className="flex justify-between text-sm"><span className="text-accent-500">Profit</span><span className="font-medium text-green-600">₹{Math.max(0,totalProfit)}</span></div>
                  <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-display text-xl font-semibold text-primary">₹{totalAmount}</span>
                  </div>
                  <button
                    onClick={handleConfirmSale}
                    disabled={totalAmount <= 0}
                    className="hidden lg:flex w-full mt-2 items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-medium shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="h-5 w-5" />
                    <span>{paymentMethod === 'UPI' ? 'Show UPI QR' : 'Complete Sale'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Floating Checkout Bar */}
        <div className="fixed bottom-16 left-0 right-0 px-4 md:px-6 lg:hidden z-40">
          <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-accent-400 font-medium">Total</p>
              <p className="font-display text-lg font-semibold text-primary">₹{totalAmount}</p>
            </div>
            <button
              onClick={handleConfirmSale}
              disabled={totalAmount <= 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-medium shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-5 w-5" />
              <span>{paymentMethod === 'UPI' ? 'UPI QR' : 'Complete'}</span>
            </button>
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