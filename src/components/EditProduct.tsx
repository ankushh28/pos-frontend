import React, { useState, useEffect } from 'react';
import { Save, Plus, Minus, Package, DollarSign, Tag, FileText, Barcode } from 'lucide-react';
import { Product, ProductSize } from '../types';
import { ApiService } from '../services/api';

interface EditProductProps {
  product?: Product;
  onProductUpdated: () => void;
  onCancel: () => void;
}

export const EditProduct: React.FC<EditProductProps> = ({
  product,
  onProductUpdated,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    wholesalePrice: '',
    retailPrice: '',
    description: '',
    brand: '',
    barcode: ''
  });
  
  const [sizes, setSizes] = useState<ProductSize[]>([{ size: '', quantity: 0 }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Get existing categories from all products
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    loadAllProducts();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        wholesalePrice: product.wholesalePrice?.toString() || '',
        retailPrice: product.retailPrice?.toString() || '',
        description: product.description || '',
        brand: product.brand || '',
        barcode: product.barcode || ''
      });
      
      setSizes(product.sizes && product.sizes.length > 0 
        ? product.sizes 
        : [{ size: '', quantity: 0 }]
      );
    }
  }, [product]);

  const loadAllProducts = async () => {
    try {
      const response = await ApiService.getAllProducts();
      if (response.success) {
        setAllProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const existingCategories = Array.from(new Set(allProducts.map(p => p.category)));

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setIsCustomCategory(false);
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  const handleSizeChange = (index: number, field: 'size' | 'quantity', value: string | number) => {
    setSizes(prev => prev.map((size, i) => 
      i === index ? { ...size, [field]: value } : size
    ));
  };

  const addSize = () => {
    setSizes(prev => [...prev, { size: '', quantity: 0 }]);
  };

  const removeSize = (index: number) => {
    if (sizes.length > 1) {
      setSizes(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!formData.name || !formData.category || !formData.wholesalePrice || !formData.retailPrice) {
      alert('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    const wholesalePrice = parseFloat(formData.wholesalePrice);
    const retailPrice = parseFloat(formData.retailPrice);

    if (wholesalePrice <= 0 || retailPrice <= 0) {
      alert('Please enter valid positive prices');
      setIsLoading(false);
      return;
    }

    if (retailPrice <= wholesalePrice) {
      alert('Retail price must be higher than wholesale price');
      setIsLoading(false);
      return;
    }

    // Validate sizes
    const validSizes = sizes.filter(size => size.size.trim() && size.quantity >= 0);
    if (validSizes.length === 0) {
      alert('Please add at least one size with valid data');
      setIsLoading(false);
      return;
    }

    const productData = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      wholesalePrice,
      retailPrice,
      sizes: validSizes,
      description: formData.description.trim(),
      brand: formData.brand.trim(),
      barcode: formData.barcode.trim()
    };

    try {
      let response;
      if (product) {
        response = await ApiService.updateProduct(product._id, productData);
      } else {
        response = await ApiService.addProduct(productData);
      }

      if (response.success) {
        alert(`Product ${product ? 'updated' : 'added'} successfully!`);
        onProductUpdated();
      } else {
        alert(`Failed to ${product ? 'update' : 'add'} product`);
      }
    } catch (error) {
      alert(`Error ${product ? 'updating' : 'adding'} product`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="inline h-4 w-4 mr-1" />
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="Enter brand name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Category *
              </label>
              
              {!isCustomCategory ? (
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  required
                >
                  <option value="">Select a category</option>
                  {existingCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="custom">+ Add New Category</option>
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Enter new category name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(false);
                      setFormData(prev => ({ ...prev, category: '' }));
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    ← Back to existing categories
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Barcode className="inline h-4 w-4 mr-1" />
                Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                placeholder="Enter barcode"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter product description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Wholesale Price (₹) *
              </label>
              <input
                type="number"
                value={formData.wholesalePrice}
                onChange={(e) => handleInputChange('wholesalePrice', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Retail Price (₹) *
              </label>
              <input
                type="number"
                value={formData.retailPrice}
                onChange={(e) => handleInputChange('retailPrice', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Profit Preview */}
          {formData.wholesalePrice && formData.retailPrice && (
            <div className="mt-4 bg-green-50 rounded-lg border border-green-200 p-4">
              <h4 className="font-medium text-green-800 mb-2">Profit Preview</h4>
              <div className="text-sm text-green-700">
                <p>Profit per unit: ₹{(parseFloat(formData.retailPrice) - parseFloat(formData.wholesalePrice)).toFixed(2)}</p>
                <p>Profit margin: {(((parseFloat(formData.retailPrice) - parseFloat(formData.wholesalePrice)) / parseFloat(formData.retailPrice)) * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Sizes and Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sizes & Stock</h3>
            <button
              type="button"
              onClick={addSize}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add Size</span>
            </button>
          </div>

          <div className="space-y-3">
            {sizes.map((size, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={size.size}
                    onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                    placeholder="Size (e.g., S, M, L, XL)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={size.quantity}
                    onChange={(e) => handleSizeChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Quantity"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {sizes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSize(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Total Stock:</strong> {sizes.reduce((sum, size) => sum + size.quantity, 0)} units
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-colors flex items-center justify-center space-x-2 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            <Save className="h-5 w-5" />
            <span>{isLoading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};