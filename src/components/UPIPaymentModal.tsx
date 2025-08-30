import React from 'react';
import { X, Check } from 'lucide-react';

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceived: () => void;
  amount: number;
}

export const UPIPaymentModal: React.FC<UPIPaymentModalProps> = ({
  isOpen,
  onClose,
  onReceived,
  amount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">UPI Payment</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-2xl font-bold text-gray-900 mb-2">₹{amount}</p>
            <p className="text-gray-600">Scan QR code to pay</p>
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-gray-100 rounded-xl p-8 mb-6 flex items-center justify-center">
            <div className="w-48 h-48 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <img 
                src="/qr-placeholder.png" 
                alt="UPI QR Code" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if image doesn't exist
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.classList.remove('hidden');
                }}
              />
              <div className="hidden text-gray-400 text-center">
                <div className="w-32 h-32 border-2 border-gray-300 rounded-lg mb-2 mx-auto"></div>
                <p className="text-sm">QR Code will appear here</p>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mb-6">
            Show this QR code to customer for payment
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onReceived}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors"
            >
              <Check className="h-5 w-5" />
              <span>Payment Received</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};