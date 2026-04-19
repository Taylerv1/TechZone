import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import ProductCard from '../components/ProductCard.jsx';
import { getCategories, getProducts } from '../api/client.js';

const initialFilters = {
  search: '',
  category: '',
  min_price: '',
  max_price: '',
  availability: '',
  sort: 'newest',
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [productsData, setProductsData] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    availability: searchParams.get('availability') || '',
    sort: searchParams.get('sort') || 'newest',
  }));
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const data = await getCategories();
        if (isMounted) {
          setCategories(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getProducts({ ...filters, page });
        if (isMounted) {
          setProductsData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [filters, page]);

  const canGoNext = Boolean(productsData.next);
  const canGoPrevious = Boolean(productsData.previous);

  const activeParams = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    if (page > 1) {
      params.set('page', String(page));
    }
    return params;
  }, [filters, page]);

  useEffect(() => {
    setSearchParams(activeParams, { replace: true });
  }, [activeParams, setSearchParams]);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(initialFilters);
    setPage(1);
  }

  return (
    <section className="catalog-page">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>All products</h1>
        </div>
        <p className="muted">{productsData.count} products found</p>
      </div>

      <div className="catalog-layout">
        <aside className="filters-panel" aria-label="Product filters">
          <label>
            Search
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search products"
            />
          </label>

          <label>
            Category
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="price-row">
            <label>
              Min price
              <input
                name="min_price"
                type="number"
                min="0"
                value={filters.min_price}
                onChange={handleFilterChange}
                placeholder="0"
              />
            </label>
            <label>
              Max price
              <input
                name="max_price"
                type="number"
                min="0"
                value={filters.max_price}
                onChange={handleFilterChange}
                placeholder="1000"
              />
            </label>
          </div>

          <label>
            Availability
            <select
              name="availability"
              value={filters.availability}
              onChange={handleFilterChange}
            >
              <option value="">Any</option>
              <option value="in_stock">In stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </label>

          <label>
            Sort
            <select name="sort" value={filters.sort} onChange={handleFilterChange}>
              <option value="newest">Newest</option>
              <option value="price">Price: low to high</option>
              <option value="-price">Price: high to low</option>
            </select>
          </label>

          <button type="button" className="secondary-button" onClick={resetFilters}>
            Reset filters
          </button>
        </aside>

        <div className="catalog-results">
          {isLoading && <p className="muted">Loading products...</p>}
          {error && <p className="error-message">{error}</p>}
          {!isLoading && !error && (
            <>
              <div className="product-grid">
                {productsData.results.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>

              {productsData.results.length === 0 && (
                <div className="empty-state">
                  <h2>No products found</h2>
                  <p>Try a different search or remove some filters.</p>
                </div>
              )}

              <div className="pagination-row">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!canGoPrevious}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </button>
                <span>Page {page}</span>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!canGoNext}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
