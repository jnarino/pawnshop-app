import { useState, useEffect, useMemo, useCallback } from 'react';
import { useInventoryCategories } from '@/app/shared/hooks/useInventoryCategories';
import { Modal } from '@/app/shared/components/Modal';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

// ✅ Default form values to prevent controlled/uncontrolled switches
const defaultForm = {
  categoryId: '',
  brand: '',
  model: '',
  serialNumber: '',
  colorId: '',
  itemCondition: '',
  quantity: 1,
  priceAmount: '',
  resale: '',
  minResale: '',
  itemReplace: '',
  ownerMark: '',
  itemDescription: '',
  attributes: {}
};

export default function InventoryItemModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialData = null 
}: InventoryItemModalProps) {
  // ✅ Initialize with default values to prevent controlled/uncontrolled issues
  const [form, setForm] = useState(defaultForm);

  const { 
    categories,
    leafCategories, 
    getCategoryById,
    buildCategoryTree,
    loading: categoriesLoading, 
    error: categoriesError 
  } = useInventoryCategories();

  // ✅ Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          ...defaultForm,
          ...initialData,
          // ✅ Ensure all string fields have string values
          categoryId: initialData.categoryId || '',
          brand: initialData.brand || '',
          model: initialData.model || '',
          serialNumber: initialData.serialNumber || '',
          colorId: initialData.colorId || '',
          itemCondition: initialData.itemCondition || '',
          priceAmount: initialData.priceAmount || '',
          resale: initialData.resale || '',
          minResale: initialData.minResale || '',
          itemReplace: initialData.itemReplace || '',
          ownerMark: initialData.ownerMark || '',
          itemDescription: initialData.itemDescription || '',
          quantity: initialData.quantity || 1,
          attributes: initialData.attributes || {}
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [isOpen, initialData]);

  // ✅ Safe category lookup with error handling
  const selectedCategory = useMemo(() => {
    if (!form.categoryId) {
      return null;
    }
    
    try {
      return getCategoryById(form.categoryId) || null;
    } catch (error) {
      console.error('[InventoryItemModal] Error getting category:', error);
      return null;
    }
  }, [form.categoryId, getCategoryById]);

  // ✅ Safe leaf categories with validation
  const safeLeafCategories = useMemo(() => {
    if (!Array.isArray(leafCategories)) {
      console.warn('[InventoryItemModal] leafCategories is not an array:', leafCategories);
      return [];
    }
    
    return leafCategories.filter(cat => cat && cat.id && cat.name);
  }, [leafCategories]);

  // ✅ Handle form submission
  const handleSave = useCallback(async () => {
    try {
      if (!form.categoryId.trim()) {
        alert('Please select a category');
        return;
      }

      // ✅ Convert string numbers to numbers where needed
      const formData = {
        ...form,
        quantity: Number(form.quantity) || 1,
        priceAmount: form.priceAmount ? Number(form.priceAmount) : undefined,
        resale: form.resale ? Number(form.resale) : undefined,
        minResale: form.minResale ? Number(form.minResale) : undefined,
        itemReplace: form.itemReplace ? Number(form.itemReplace) : undefined,
      };

      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('[InventoryItemModal] Error saving:', error);
      alert('Failed to save item: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [form, onSave, onClose]);

  // ✅ Show loading state while categories load
  if (categoriesLoading) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        title="Loading Categories..."
        description="Loading inventory categories, please wait..."
      >
        <div className="loading-spinner">Loading inventory categories...</div>
      </Modal>
    );
  }

  // ✅ Show error state if categories failed to load
  if (categoriesError) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        title="Error Loading Categories"
        description="Failed to load categories from the server"
      >
        <div className="error-message">
          Failed to load categories: {categoriesError}
        </div>
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={`${initialData ? 'Edit' : 'Add'} Inventory Item`}
      description="Fill out the form below to add or edit an inventory item"
    >
      <div className="inventory-modal">
        <div className="modal-body">
          <div className="form-grid">
            {/* Category Selection */}
            <div className="form-group">
              <label>Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm(prev => ({ ...prev, categoryId: e.target.value }))}
                required
              >
                <option value="">Select category...</option>
                {safeLeafCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {selectedCategory && (
                <small className="category-path">
                  Path: {selectedCategory.path || 'Unknown'}
                </small>
              )}
            </div>

            {/* Basic Item Info */}
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="e.g., Apple, Samsung"
              />
            </div>

            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm(prev => ({ ...prev, model: e.target.value }))}
                placeholder="e.g., iPhone 13, Galaxy S21"
              />
            </div>

            <div className="form-group">
              <label>Serial Number</label>
              <input
                type="text"
                value={form.serialNumber}
                onChange={(e) => setForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                placeholder="Serial or IMEI number"
              />
            </div>

            <div className="form-group">
              <label>Condition</label>
              <select
                value={form.itemCondition}
                onChange={(e) => setForm(prev => ({ ...prev, itemCondition: e.target.value }))}
              >
                <option value="">Select condition...</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>

            {/* Financial Fields */}
            <div className="form-group">
              <label>Price Amount</label>
              <input
                type="number"
                step="0.01"
                value={form.priceAmount}
                onChange={(e) => setForm(prev => ({ ...prev, priceAmount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Resale Price</label>
              <input
                type="number"
                step="0.01"
                value={form.resale}
                onChange={(e) => setForm(prev => ({ ...prev, resale: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Min Resale</label>
              <input
                type="number"
                step="0.01"
                value={form.minResale}
                onChange={(e) => setForm(prev => ({ ...prev, minResale: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Replacement Value</label>
              <input
                type="number"
                step="0.01"
                value={form.itemReplace}
                onChange={(e) => setForm(prev => ({ ...prev, itemReplace: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Owner Mark</label>
              <input
                type="text"
                value={form.ownerMark}
                onChange={(e) => setForm(prev => ({ ...prev, ownerMark: e.target.value }))}
                placeholder="Owner identification marks"
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={form.itemDescription}
                onChange={(e) => setForm(prev => ({ ...prev, itemDescription: e.target.value }))}
                placeholder="Detailed description of the item"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={!form.categoryId.trim()}>
            {initialData ? 'Update' : 'Add'} Item
          </button>
        </div>
      </div>
    </Modal>
  );
}
