import React from 'react';
import { X, Check, QrCode } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-surface rounded-3xl shadow-strong max-w-md w-full animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-display text-xl font-semibold text-gray-900">UPI Payment</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-accent-400 hover:text-accent-600 hover:bg-gray-50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-8">
            <p className="font-display text-3xl font-semibold text-primary mb-2">₹{amount}</p>
            <p className="text-accent-400">Show QR code to customer</p>
          </div>

          {/* QR Code Area */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-8 flex items-center justify-center">
            <div className="w-48 h-48 bg-surface rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center">
              <div className="text-center text-accent-400">
                <QrCode className="h-16 w-16 mx-auto mb-3" />
                <p className="text-sm">QR Code</p>
                <p className="text-xs">₹{amount}</p>
              </div>
            </div>
          </div>

          <p className="text-center text-accent-400 text-sm mb-8">
            Customer can scan this code with any UPI app
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 border border-gray-200 rounded-2xl font-medium text-accent-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onReceived}
              className="flex-1 btn-primary py-4 px-6 rounded-2xl font-medium flex items-center justify-center space-x-2 shadow-medium hover:shadow-strong"
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