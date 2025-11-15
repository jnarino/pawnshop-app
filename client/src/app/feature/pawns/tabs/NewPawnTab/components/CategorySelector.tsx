import { useState, useMemo, useCallback } from 'react';
import { useInventoryCategories } from '@/app/shared/hooks/useInventoryCategories';

interface Props {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

// ✅ Single Responsibility: Category selection UI and logic
export function CategorySelector({ selectedType, onTypeChange }: Props) {
  const [query, setQuery] = useState(selectedType);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const categoriesHook = useInventoryCategories();
  const categories = categoriesHook?.categories || [];
  const isLoading = categoriesHook?.loading || false;
  const error = categoriesHook?.error;

  // ✅ Single Responsibility: Filter categories based on query
  const suggestions = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    
    if (!query.trim()) {
      return categories.slice(0, 10);
    }

    const queryLower = query.toLowerCase();
    return categories
      .filter(cat => cat?.name?.toLowerCase().includes(queryLower))
      .slice(0, 10);
  }, [query, categories]);

  // ✅ Single Responsibility: Handle category selection
  const handleSelect = useCallback((categoryName: string) => {
    onTypeChange(categoryName);
    setQuery(categoryName);
    setShowDropdown(false);
    setSelectedIndex(-1);
  }, [onTypeChange]);

  // ✅ Single Responsibility: Handle input changes
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    onTypeChange(value);
    setShowDropdown(value.length > 0);
    setSelectedIndex(-1);
  }, [onTypeChange]);

  // ✅ Single Responsibility: Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]?.name) {
          handleSelect(suggestions[selectedIndex].name);
        } else if (suggestions[0]?.name) {
          handleSelect(suggestions[0].name);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showDropdown, suggestions, selectedIndex, handleSelect]);

  if (error) {
    return (
      <div className="form-group">
        <label>Type *</label>
        <div className="error-message">Failed to load categories: {error}</div>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label>Type *</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={isLoading ? "Loading..." : "Type to search categories..."}
          disabled={isLoading}
          required
        />

        {showDropdown && suggestions.length > 0 && (
          <div className="category-dropdown" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {suggestions.map((cat, index) => (
              cat?.name ? (
                <div
                  key={cat.id || index}
                  className={`dropdown-item ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => handleSelect(cat.name)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    fontSize: '14px',
                    backgroundColor: selectedIndex === index ? '#e3f2fd' : '#fff'
                  }}
                >
                  {cat.name}
                </div>
              ) : null
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
