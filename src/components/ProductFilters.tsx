import React, { useState } from 'react';
import { SlidersHorizontal, X, RotateCcw, ChevronDown, ChevronUp, Check, Search } from 'lucide-react';

export interface FilterState {
  category: string;
  madeWith: string;
  priceRange: [number, number];
  inStockOnly: boolean;
  searchQuery: string;
  sortBy: string;
}

export interface CategoryOption {
  label: string;
  value: string;
  count?: number | string;
}

interface ProductFiltersProps {
  categories: (string | CategoryOption)[];
  madeWithOptions: string[];
  maxPrice: number;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  activeFilterCount: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  madeWithOptions,
  maxPrice,
  filters,
  onFilterChange,
  onReset,
  activeFilterCount,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  // Accordion section states
  const [openSections, setOpenSections] = useState({
    categories: true,
    madeWith: true,
    price: true,
    availability: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Active Filter Count & Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-orange-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#7d4b0e]" />
          <span className="font-bold text-slate-800 text-sm">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-amber-100 text-[#7d4b0e] text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Search Products</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search flavor, ingredient..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7d4b0e] focus:bg-white"
          />
          {filters.searchQuery ? (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          )}
        </div>
      </div>

      {/* Category Accordion */}
      <div className="border-b border-orange-100 pb-4 space-y-3">
        <button
          onClick={() => toggleSection('categories')}
          className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-slate-700 hover:text-[#7d4b0e]"
        >
          <span>Category / Collection</span>
          {openSections.categories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {openSections.categories && (
          <div className="space-y-1.5 pt-1">
            {categories
              .filter((cat) => {
                if (typeof cat === 'object') {
                  const item = cat as any;
                  if (item.is_display === false || item.is_display === 'false' || item.is_display === 0) {
                    return false;
                  }
                }
                return true;
              })
              .map((cat, idx) => {
                const label = typeof cat === 'string' ? cat : cat.label;
                const value = typeof cat === 'string' ? cat : cat.value;
                const count = typeof cat === 'string' ? undefined : cat.count;
                const isSelected =
                  filters.category.toLowerCase() === value.toLowerCase() ||
                  filters.category.toLowerCase() === label.toLowerCase();

                return (
                  <button
                    key={`${value}-${idx}`}
                    onClick={() => onFilterChange({ ...filters, category: value })}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${isSelected
                        ? 'bg-amber-100 text-[#7d4b0e] font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <span className="truncate pr-1">{label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {count !== undefined && Number(count) > 0 && (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-full">
                          {count}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#7d4b0e]" />}
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Made With / Oil Preference Accordion */}
      {madeWithOptions.length > 0 && (
        <div className="border-b border-orange-100 pb-4 space-y-3">
          <button
            onClick={() => toggleSection('madeWith')}
            className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-slate-700 hover:text-[#7d4b0e]"
          >
            <span>Made With / Oil</span>
            {openSections.madeWith ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {openSections.madeWith && (
            <div className="space-y-1.5 pt-1">
              {['All', ...madeWithOptions].map((opt) => {
                const isSelected = filters.madeWith === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => onFilterChange({ ...filters, madeWith: opt })}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${isSelected
                        ? 'bg-amber-100 text-[#7d4b0e] font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#7d4b0e]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Price Range Accordion */}
      <div className="border-b border-orange-100 pb-4 space-y-3">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-slate-700 hover:text-[#7d4b0e]"
        >
          <span>Price Range (₹)</span>
          {openSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {openSections.price && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>₹{filters.priceRange[0]}</span>
              <span>₹{filters.priceRange[1]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxPrice || 1000}
              step={10}
              value={filters.priceRange[1]}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  priceRange: [filters.priceRange[0], Number(e.target.value)],
                })
              }
              className="w-full accent-[#7d4b0e] cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Availability Accordion */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('availability')}
          className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-slate-700 hover:text-[#7d4b0e]"
        >
          <span>Availability</span>
          {openSections.availability ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {openSections.availability && (
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium pt-1">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => onFilterChange({ ...filters, inStockOnly: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-[#7d4b0e] focus:ring-[#7d4b0e]"
            />
            <span>In Stock Only</span>
          </label>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block bg-white border border-orange-100 rounded-3xl p-5 shadow-sm w-full max-h-[calc(100vh-9rem)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-amber-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-300">
        {filterContent}
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h3 className="font-bold text-base text-[#7d4b0e]">Filter Products</h3>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {filterContent}
            </div>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="w-full bg-[#7d4b0e] text-white text-xs font-bold py-3 rounded-full shadow-md hover:bg-[#6b400c] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductFilters;
