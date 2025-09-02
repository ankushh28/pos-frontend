import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="bg-surface rounded-2xl shadow-strong w-full max-w-sm p-6">
        <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-accent-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200 text-accent-600 hover:bg-gray-50">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg btn-primary">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
