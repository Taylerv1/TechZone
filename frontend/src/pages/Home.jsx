import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import ProductCard from '../components/ProductCard.jsx';
import { getCategories, getProducts } from '../api/client.js';
import { getHeroImage } from '../utils/productImages.js';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      try {
        const [categoryData, productData] = await Promise.all([
          getCategories(),
          getProducts({ sort: 'newest' }),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoryData);
        setProducts(productData.results || []);
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

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredProducts = useMemo(() => {
    const featured = products.filter((product) => product.is_featured);
    return (featured.length ? featured : products).slice(0, 4);
  }, [products]);

  const heroImage = getHeroImage(products);

  return (
    <>
      <section
        className="hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="hero-content">
          <p className="eyebrow">New electronics</p>
          <h1>Better tech, ready today.</h1>
          <p>
            Shop practical devices and accessories selected for daily use.
          </p>
          <Link to="/products" className="primary-button">
            Shop products
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Categories</p>
            <h2>Shop by category</h2>
          </div>
          <Link to="/products" className="text-link">View all</Link>
        </div>

        {isLoading && <p className="muted">Loading categories...</p>}
        {error && <p className="error-message">{error}</p>}
        {!isLoading && !error && (
          <div className="category-row">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="category-pill"
              >
                <span>{category.name}</span>
                <small>{category.products_count} products</small>
              </Link>
            ))}
            {categories.length === 0 && (
              <p className="muted">No categories yet.</p>
            )}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured products</p>
            <h2>Fresh picks</h2>
          </div>
          <Link to="/products" className="text-link">Browse catalog</Link>
        </div>

        {isLoading && <p className="muted">Loading products...</p>}
        {!isLoading && !error && (
          <div className="product-grid">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
            {featuredProducts.length === 0 && (
              <p className="muted">No products available yet.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
