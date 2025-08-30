import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { ApiService } from '../services/api';

interface BulkUploadProps {
  onUploadComplete: () => void;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');

    try {
      const response = await ApiService.bulkUploadProducts(selectedFile);
      
      if (response.success) {
        setUploadResult(response);
        onUploadComplete();
      } else {
        setError(response.message || 'Upload failed');
      }
    } catch (error) {
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Upload Instructions */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
        <h3 className="font-semibold text-blue-900 mb-3">Excel Upload Instructions</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>Your Excel file should have the following columns:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>name</strong> - Product name (required)</li>
            <li><strong>category</strong> - Product category (required)</li>
            <li><strong>wholesalePrice</strong> - Wholesale price (required)</li>
            <li><strong>retailPrice</strong> - Retail price (required)</li>
            <li><strong>sizes</strong> - JSON format: {`[{"size":"M","quantity":10}]`}</li>
            <li><strong>description</strong> - Product description (optional)</li>
            <li><strong>brand</strong> - Brand name (optional)</li>
            <li><strong>barcode</strong> - Product barcode (optional)</li>
          </ul>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {!uploadResult ? (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Excel File</h3>
              <p className="text-gray-600">Select an Excel file to bulk upload products</p>
            </div>

            {/* File Input */}
            <div className="mb-6">
              <label className="block w-full">
                <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  selectedFile 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">
                    {selectedFile ? selectedFile.name : 'Click to select Excel file'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports .xlsx and .xls files
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
                !selectedFile || isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                'Upload Products'
              )}
            </button>
          </>
        ) : (
          /* Upload Success */
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Successful!</h3>
            
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-green-800 space-y-1">
                <p><strong>File:</strong> {selectedFile?.name}</p>
                <p><strong>Products Inserted:</strong> {uploadResult.inserted}</p>
                <p><strong>Products Updated:</strong> {uploadResult.updated}</p>
                <p><strong>Upload ID:</strong> {uploadResult.uploadId}</p>
              </div>
            </div>

            <button
              onClick={resetUpload}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Upload Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};