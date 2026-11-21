import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ArrowUpDown, ArrowLeft } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductFilters, type CategoryOption } from '../components/ProductFilters';
import type { FilterState } from '../components/ProductFilters';
import { Pagination } from '../components/Pagination';
import { productService } from '../services/products';
import type { Product } from '../types';

export const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCollections, setAvailableCollections] = useState<any[]>([]);
  const [activeCollectionTitle, setActiveCollectionTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [gridCols] = useState<3 | 4>(3);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  // Extract query parameters from URL
  const initialSearch = searchParams.get('search') || '';
  const collectionParam = searchParams.get('collection') || searchParams.get('category') || '';

  // Master Filter State
  const [filters, setFilters] = useState<FilterState>({
    category: collectionParam || 'All',
    madeWith: 'All',
    priceRange: [0, 1000],
    inStockOnly: false,
    searchQuery: initialSearch,
    sortBy: 'featured',
  });

  // Load available collections for the sidebar filters
  useEffect(() => {
    productService.getCollections().then((cols) => {
      if (Array.isArray(cols) && cols.length > 0) {
        setAvailableCollections(cols);
      }
    });
  }, []);

  // Load products based on collectionParam
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    if (collectionParam && collectionParam !== 'All') {
      productService.getCollectionByHandle(collectionParam).then((res) => {
        if (!mounted) return;
        if (res && Array.isArray(res.products)) {
          setProducts(res.products);
          const title = res.collection?.title || collectionParam.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          setActiveCollectionTitle(title);
          const maxP = Math.max(...res.products.map((p) => Number(p.price) || 0), 1000);
          setFilters((prev) => ({
            ...prev,
            category: collectionParam,
            priceRange: [0, maxP],
          }));
        } else {
          setProducts([]);
          setActiveCollectionTitle(collectionParam.replace(/-/g, ' '));
        }
        setLoading(false);
      });
    } else {
      productService.getAllProducts({ limit: 250 }).then((data) => {
        if (!mounted) return;
        setProducts(data);
        setActiveCollectionTitle('');
        const maxP = Math.max(...data.map((p) => Number(p.price) || 0), 1000);
        setFilters((prev) => ({
          ...prev,
          category: 'All',
          priceRange: [0, maxP],
        }));
        setLoading(false);
      });
    }

    return () => {
      mounted = false;
    };
  }, [collectionParam]);

  // Listen to search query parameter in URL
  useEffect(() => {
    const q = searchParams.get('search') || '';
    if (q !== filters.searchQuery) {
      setFilters((prev) => ({ ...prev, searchQuery: q }));
    }
  }, [searchParams]);

  // Construct Category / Collection options for sidebar
  const categoriesList: (string | CategoryOption)[] = useMemo(() => {
    const list: (string | CategoryOption)[] = [{ label: 'All Products', value: 'All' }];

    if (availableCollections.length > 0) {
      availableCollections
        .filter((c) => c.is_display !== false && c.is_display !== 'false' && c.is_display !== 0)
        .forEach((c) => {
          const count = c.product_count !== undefined ? Number(c.product_count) : c.products?.length;
          list.push({
            label: c.title,
            value: c.handle || c.title,
            count: count !== undefined ? count : undefined,
          });
        });
    } else {
      // Fallback to categories derived from current products
      const set = new Set<string>();
      products.forEach((p) => {
        if (p.category) set.add(p.category);
      });
      Array.from(set).forEach((cat) => {
        list.push({ label: cat, value: cat });
      });
    }

    return list;
  }, [availableCollections, products]);

  const madeWithOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const desc = (p.title + ' ' + (p.description || '')).toLowerCase();
      if (desc.includes('ghee')) set.add('Pure Desi Ghee');
      if (desc.includes('oil') || desc.includes('peanut')) set.add('Groundnut Oil');
      if (desc.includes('diet') || desc.includes('low oil')) set.add('Low Oil / Diet');
    });
    return Array.from(set);
  }, [products]);

  const maxPossiblePrice = useMemo(() => {
    if (products.length === 0) return 1000;
    return Math.max(...products.map((p) => Number(p.price) || 0), 1000);
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Made With
    if (filters.madeWith !== 'All') {
      const mw = filters.madeWith.toLowerCase();
      list = list.filter((p) => {
        const text = (p.title + ' ' + (p.description || '')).toLowerCase();
        if (mw.includes('ghee')) return text.includes('ghee');
        if (mw.includes('oil') || mw.includes('groundnut')) return text.includes('oil') || text.includes('peanut');
        if (mw.includes('diet') || mw.includes('low')) return text.includes('diet') || text.includes('low');
        return true;
      });
    }

    // Price Range
    list = list.filter((p) => {
      const price = Number(p.price) || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // In Stock
    if (filters.inStockOnly) {
      list = list.filter((p) => {
        if (p.total_inventory !== undefined && (p.total_inventory === 0 || (p.total_inventory as any) === '0')) {
          return false;
        }
        if (p.availableForSale === false) return false;
        if (p.variants && p.variants.length > 0) {
          return p.variants.some((v) => v.availableForSale);
        }
        return true;
      });
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price-low-high':
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-high-low':
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'name-a-z':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-z-a':
        list.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }

    return list;
  }, [products, filters]);

  // Reset page whenever filters or collection change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, collectionParam]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // When filter changes, synchronize URL if category/collection changes
  const handleFilterChange = (newFilters: FilterState) => {
    if (newFilters.category !== filters.category) {
      const nextParams = new URLSearchParams(searchParams);
      if (newFilters.category === 'All') {
        nextParams.delete('collection');
        nextParams.delete('category');
      } else {
        nextParams.set('collection', newFilters.category);
      }
      setSearchParams(nextParams);
    }
    setFilters(newFilters);
  };

  const handleClearCollection = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('collection');
    nextParams.delete('category');
    setSearchParams(nextParams);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All' && !activeCollectionTitle) count++;
    if (filters.madeWith !== 'All') count++;
    if (filters.priceRange[1] < maxPossiblePrice) count++;
    if (filters.inStockOnly) count++;
    if (filters.searchQuery.trim()) count++;
    return count;
  }, [filters, maxPossiblePrice, activeCollectionTitle]);

  const handleResetFilters = () => {
    setFilters({
      category: 'All',
      madeWith: 'All',
      priceRange: [0, maxPossiblePrice],
      inStockOnly: false,
      searchQuery: '',
      sortBy: 'featured',
    });
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Header Title & Sorting Bar */}
        <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {activeCollectionTitle && (
                <Link
                  to="/shop"
                  onClick={handleClearCollection}
                  className="text-xs font-bold text-amber-800 hover:text-[#7d4b0e] flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  All Products
                </Link>
              )}
              {activeCollectionTitle && (
                <span className="text-xs text-slate-400">/</span>
              )}
              {activeCollectionTitle && (
                <span className="text-xs font-bold text-[#7d4b0e]">Collection</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#7d4b0e] font-serif">
              {activeCollectionTitle || 'Shop All Products'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Showing {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} {activeCollectionTitle ? 'products in this collection' : 'handcrafted Khakhra varieties'}
            </p>
          </div>

          {/* Controls: Mobile Filter Button, Sorting, Grid Switcher */}
          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-amber-100 text-[#7d4b0e] px-4 py-2 rounded-full text-xs font-bold"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-[#7d4b0e] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="featured">Featured / Recommended</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="name-a-z">Name: A to Z</option>
                <option value="name-z-a">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Collection Banner or Filters Bar */}
        {(activeCollectionTitle || activeFilterCount > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400 font-medium mr-1">Active Filter:</span>
            {activeCollectionTitle && (
              <span className="bg-[#7d4b0e] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span>Collection: {activeCollectionTitle}</span>
                <button
                  onClick={handleClearCollection}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  title="Clear collection filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filters.madeWith !== 'All' && (
              <span className="bg-amber-100 text-[#7d4b0e] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                Made With: {filters.madeWith}
                <X
                  className="w-3.5 h-3.5 cursor-pointer hover:text-rose-600"
                  onClick={() => handleFilterChange({ ...filters, madeWith: 'All' })}
                />
              </span>
            )}
            {filters.searchQuery.trim() && (
              <span className="bg-amber-100 text-[#7d4b0e] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                Search: "{filters.searchQuery}"
                <X
                  className="w-3.5 h-3.5 cursor-pointer hover:text-rose-600"
                  onClick={() => handleFilterChange({ ...filters, searchQuery: '' })}
                />
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-amber-800 hover:underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop & Mobile Product Filters */}
          <div className="lg:col-span-1 lg:sticky lg:top-32 self-start">
            <ProductFilters
              categories={categoriesList}
              madeWithOptions={madeWithOptions}
              maxPrice={maxPossiblePrice}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              activeFilterCount={activeFilterCount}
              isMobileOpen={isMobileFiltersOpen}
              setIsMobileOpen={setIsMobileFiltersOpen}
            />
          </div>

          {/* Product Grid Area */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div
                className={`grid gap-3 sm:gap-6 ${gridCols === 3
                    ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                  }`}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-64 sm:h-80 bg-amber-50/50 rounded-2xl sm:rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white border border-amber-200/60 rounded-3xl p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-[#7d4b0e] flex items-center justify-center mx-auto">
                  <SlidersHorizontal className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#7d4b0e]">No Products Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No snacks match your active filters in this collection. Try adjusting your search query, price range, or clearing filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-[#7d4b0e] text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-[#6b400c] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`grid gap-3 sm:gap-6 ${gridCols === 3
                      ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                    }`}
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredProducts.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={(limit) => {
                    setItemsPerPage(limit);
                    setCurrentPage(1);
                  }}
                  itemsPerPageOptions={[9, 12, 18, 24]}
                />
              </>
            )}
          </div>
        </div>



      </div>
    </div>
  );
};

export default Shop;
