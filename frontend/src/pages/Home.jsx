import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import ProductCard from '../components/ProductCard.jsx';
import { getCategories, getProducts } from '../api/client.js';
import { getHeroImage, getProductImage } from '../utils/productImages.js';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      try {
        const categoryData = await getCategories();
        const [productData, categoryProductData] = await Promise.all([
          getProducts({ sort: 'newest' }),
          Promise.all(
            categoryData.map((category) => (
              getProducts({ category: category.id, sort: 'newest' })
            )),
          ),
        ]);

        if (!isMounted) {
          return;
        }

        const productsByCategory = {};
        categoryData.forEach((category, index) => {
          productsByCategory[category.id] = categoryProductData[index]?.results?.[0] || null;
        });

        setCategories(categoryData);
        setProducts(productData.results || []);
        setCategoryProducts(productsByCategory);
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
    return (featured.length ? featured : products).slice(0, 8);
  }, [products]);

  const categoryHighlights = useMemo(() => categories.map((category) => {
    const product = categoryProducts[category.id];
    return { ...category, product };
  }), [categories, categoryProducts]);

  const promoProducts = products.slice(0, 3);
  const heroImage = getHeroImage(products);

  return (
    <>
      <section
        className="hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="hero-content">
          <p className="eyebrow light">New electronics</p>
          <h1>Better tech for everyday life.</h1>
          <p>
            Shop practical devices, accessories, and smart essentials selected for daily use.
          </p>
          <Link to="/products" className="primary-button">
            Explore products
          </Link>
        </div>
      </section>

      <section className="service-strip" aria-label="Store benefits">
        <div className="service-item">
          <span className="service-icon">OK</span>
          <div>
            <strong>Real orders</strong>
            <small>Checkout creates saved orders.</small>
          </div>
        </div>
        <div className="service-item">
          <span className="service-icon">ST</span>
          <div>
            <strong>Stock checked</strong>
            <small>Cart quantity follows inventory.</small>
          </div>
        </div>
        <div className="service-item">
          <span className="service-icon">$</span>
          <div>
            <strong>Mock payment</strong>
            <small>No external payment gateway.</small>
          </div>
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
            {categoryHighlights.map((category, index) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="category-pill"
              >
                <span className="category-image-wrap">
                  {category.product && (
                    <img
                      src={getProductImage(category.product, index)}
                      alt={category.name}
                      className="category-image"
                    />
                  )}
                  {!category.product && <span>{category.name.slice(0, 1).toUpperCase()}</span>}
                </span>
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

      {promoProducts.length > 0 && (
        <section className="section promo-section">
          <div className="promo-grid">
            {promoProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="promo-tile"
              >
                <img src={getProductImage(product)} alt={product.name} />
                <span>{product.category_name}</span>
                <strong>{product.name}</strong>
                <small>Shop now</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured products</p>
            <h2>Fresh arrivals</h2>
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
