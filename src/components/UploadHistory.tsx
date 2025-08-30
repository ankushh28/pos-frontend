import React, { useState, useEffect } from 'react';
import { History, FileSpreadsheet, RotateCcw, Calendar, Package, AlertTriangle } from 'lucide-react';
import { UploadBatch } from '../types';
import { ApiService } from '../services/api';

interface UploadHistoryProps {
  onRollbackComplete: () => void;
}

export const UploadHistory: React.FC<UploadHistoryProps> = ({ onRollbackComplete }) => {
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rollbackingId, setRollbackingId] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const response = await ApiService.getUploadBatches();
      if (response.success) {
        setBatches(response.data);
      }
    } catch (error) {
      console.error('Failed to load upload batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async (uploadId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to rollback the upload "${fileName}"? This will remove all products from this batch.`)) {
      return;
    }

    setRollbackingId(uploadId);
    try {
      const response = await ApiService.rollbackUpload(uploadId);
      if (response.success) {
        alert(`Successfully rolled back: ${response.message}`);
        loadBatches(); // Refresh the list
        onRollbackComplete(); // Refresh products in parent
      } else {
        alert('Failed to rollback upload');
      }
    } catch (error) {
      alert('Error during rollback');
    } finally {
      setRollbackingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {batches.length === 0 ? (
        <div className="text-center py-12">
          <History className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-2">No upload history</p>
          <p className="text-gray-400">Upload some products to see history here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div key={batch._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div style={{ position: 'relative' }}>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{batch.fileName}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(batch.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800 font-medium">Products Added</span>
                      </div>
                      <p className="text-xl font-bold text-blue-600">{batch.productIds.length}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800 font-medium">Quantity Updates</span>
                      </div>
                      <p className="text-xl font-bold text-green-600">{batch.quantityChanges.length}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-medium">Upload ID</span>
                      </div>
                      <p className="text-xs font-mono text-gray-500 truncate">{batch.uploadId}</p>
                    </div>
                  </div>

                  {/* Quantity Changes Details */}
                  {batch.quantityChanges.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Quantity Changes:</h4>
                      <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <div className="space-y-1 text-xs">
                          {batch.quantityChanges.slice(0, 5).map((change, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-gray-600">Size {change.size}:</span>
                              <span className="text-gray-800">
                                {change.oldQuantity} → {change.newQuantity}
                              </span>
                            </div>
                          ))}
                          {batch.quantityChanges.length > 5 && (
                            <p className="text-gray-500 text-center pt-1">
                              +{batch.quantityChanges.length - 5} more changes...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rollback Button */}
                <div style={{ position: 'absolute', top: '0px', right: '0px' }} className="ml-4">
                  <button
                    onClick={() => handleRollback(batch.uploadId, batch.fileName)}
                    disabled={rollbackingId === batch.uploadId}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      rollbackingId === batch.uploadId
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {rollbackingId === batch.uploadId ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Rolling back...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        <span>Rollback</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    <strong>Warning:</strong> Rollback will permanently delete all products from this upload and revert quantity changes. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};