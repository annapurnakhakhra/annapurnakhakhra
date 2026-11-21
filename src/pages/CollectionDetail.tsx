import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, SlidersHorizontal, Grid, LayoutGrid, RotateCcw, X, ArrowUpDown } from 'lucide-react';
import { productService } from '../services/products';
import { ProductCard } from '../components/ProductCard';
import { ProductFilters, type CategoryOption, type FilterState } from '../components/ProductFilters';
import { Pagination } from '../components/Pagination';
import type { Product } from '../types';

export const CollectionDetail: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [collectionTitle, setCollectionTitle] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCollections, setAvailableCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(3);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  // Master Filter State for this collection
  const [filters, setFilters] = useState<FilterState>({
    category: handle || 'All',
    madeWith: 'All',
    priceRange: [0, 1000],
    inStockOnly: false,
    searchQuery: '',
    sortBy: 'featured',
  });

  // Load available collections for the sidebar filters (same as Shop page)
  useEffect(() => {
    productService.getCollections().then((cols) => {
      if (Array.isArray(cols) && cols.length > 0) {
        setAvailableCollections(cols);
      }
    });
  }, []);

  // Fetch current collection products
  useEffect(() => {
    if (handle) {
      setLoading(true);
      productService.getCollectionByHandle(handle).then((res) => {
        if (res) {
          setCollectionTitle(res.collection?.title || handle.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
          setProducts(res.products || []);
          const maxP = Math.max(...(res.products || []).map((p) => Number(p.price) || 0), 1000);
          setFilters((prev) => ({
            ...prev,
            category: handle,
            priceRange: [0, maxP],
          }));
        } else {
          setCollectionTitle(handle.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
          setFilters((prev) => ({ ...prev, category: handle }));
        }
        setLoading(false);
      });
    }
  }, [handle]);

  // Construct Category / Collection options for sidebar (identical to Shop page)
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

  const maxPossiblePrice = useMemo(() => {
    if (products.length === 0) return 1000;
    return Math.max(...products.map((p) => Number(p.price) || 0), 1000);
  }, [products]);

  // Filter & Sort Logic within the collection
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

    // Price range
    list = list.filter((p) => {
      const price = Number(p.price) || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // In Stock Only
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

  // Handle switching category / collection or filtering
  const handleFilterChange = (newFilters: FilterState) => {
    if (newFilters.category !== filters.category) {
      if (newFilters.category === 'All') {
        navigate('/shop');
        return;
      }
      if (newFilters.category !== handle) {
        navigate(`/shopbycollection/${newFilters.category}`);
        return;
      }
    }
    setFilters(newFilters);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, handle]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim()) count++;
    if (filters.priceRange[1] < maxPossiblePrice) count++;
    if (filters.inStockOnly) count++;
    return count;
  }, [filters, maxPossiblePrice]);

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [0, maxPossiblePrice],
      inStockOnly: false,
      searchQuery: '',
      sortBy: 'featured',
    }));
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Back Link */}
        <Link
          to="/shopbycollection"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#7d4b0e] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Collections</span>
        </Link>

        {/* Banner Header */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 md:p-8 text-center space-y-2 relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-[#7d4b0e] text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Collection</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#7d4b0e] font-serif">
            {collectionTitle || 'Collection'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Showing {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} items in this collection
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white border border-orange-100 rounded-3xl p-4 shadow-xs flex items-center justify-between gap-4">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-amber-100 text-[#7d4b0e] px-4 py-2 rounded-full text-xs font-bold cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-[#7d4b0e] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3 ml-auto">
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

            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
              <button
                onClick={() => setGridCols(3)}
                className={`p-1.5 rounded-full transition-all ${
                  gridCols === 3 ? 'bg-white text-[#7d4b0e] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="3 Columns"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`p-1.5 rounded-full transition-all ${
                  gridCols === 4 ? 'bg-white text-[#7d4b0e] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="4 Columns"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Active Filters:</span>
            {filters.searchQuery.trim() && (
              <span className="bg-amber-100 text-[#7d4b0e] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                Search: "{filters.searchQuery}"
                <X
                  className="w-3 h-3 cursor-pointer hover:text-amber-900"
                  onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                />
              </span>
            )}
            {filters.priceRange[1] < maxPossiblePrice && (
              <span className="bg-amber-100 text-[#7d4b0e] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                Under ₹{filters.priceRange[1]}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-amber-900"
                  onClick={() => setFilters((prev) => ({ ...prev, priceRange: [0, maxPossiblePrice] }))}
                />
              </span>
            )}
            {filters.inStockOnly && (
              <span className="bg-amber-100 text-[#7d4b0e] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                In Stock Only
                <X
                  className="w-3 h-3 cursor-pointer hover:text-amber-900"
                  onClick={() => setFilters((prev) => ({ ...prev, inStockOnly: false }))}
                />
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-amber-800 underline hover:text-amber-950 ml-2 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar + Product Grid (Identical structure to Shop page) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop & Mobile Product Filters */}
          <div className="lg:col-span-1 lg:sticky lg:top-32 self-start">
            <ProductFilters
              categories={categoriesList}
              madeWithOptions={[]}
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
                className={`grid grid-cols-2 sm:grid-cols-2 ${
                  gridCols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
                } gap-3 sm:gap-6`}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-64 sm:h-80 bg-amber-50/50 rounded-2xl sm:rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white border border-orange-100 rounded-3xl p-12 text-center space-y-3">
                <SlidersHorizontal className="w-8 h-8 text-amber-500 mx-auto" />
                <h3 className="text-lg font-bold text-[#7d4b0e]">No Products Found</h3>
                <p className="text-xs text-slate-500">Try changing your filters or searching another keyword.</p>
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 bg-[#7d4b0e] text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-[#6b400c] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear Collection Filters</span>
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`grid grid-cols-2 sm:grid-cols-2 ${
                    gridCols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
                  } gap-3 sm:gap-6`}
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

export default CollectionDetail;
