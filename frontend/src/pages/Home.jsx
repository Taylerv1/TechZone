import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import ProductCard from '../components/ProductCard.jsx';
import { getCategories, getProducts } from '../api/client.js';
import { getProductImage } from '../utils/productImages.js';

const categoryImages = {
  headphones: '/categories/headphones.jpg',
  laptops: '/categories/laptops.jpg',
  lighting: '/categories/lighting.jpg',
  phones: '/categories/phones.jpg',
  smartwatches: '/categories/smartwatches.jpg',
  speakers: '/categories/speakers.jpg',
};

const heroSlides = [
  {
    eyebrow: 'New electronics',
    title: 'Best tech picks for 2026',
    text: 'Find practical electronics, smart devices, and everyday accessories in one simple store.',
    ctaLabel: 'Explore products',
    ctaTo: '/products',
  },
  {
    eyebrow: 'Fresh arrivals',
    title: 'Upgrade your daily setup',
    text: 'Browse laptops, phones, audio gear, lights, and watches selected for work and home.',
    ctaLabel: 'Shop arrivals',
    ctaTo: '/products?sort=newest',
  },
  {
    eyebrow: 'Mock payment only',
    title: 'Checkout safely in demo mode',
    text: 'Add items to your cart, place a real order, and track it from your dashboard.',
    ctaLabel: 'View cart',
    ctaTo: '/cart',
  },
];

function getCategoryImage(categoryName) {
  return categoryImages[categoryName] || '';
}

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
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
    return (featured.length ? featured : products).slice(0, 8);
  }, [products]);

  const promoProducts = products.slice(0, 3);
  const currentSlide = heroSlides[activeSlide];

  function showPreviousSlide() {
    setActiveSlide((current) => (
      current === 0 ? heroSlides.length - 1 : current - 1
    ));
  }

  function showNextSlide() {
    setActiveSlide((current) => (
      current === heroSlides.length - 1 ? 0 : current + 1
    ));
  }

  return (
    <>
      <section
        className="hero"
        style={{ backgroundImage: "url('/banner.png')" }}
      >
        <button
          type="button"
          className="hero-arrow hero-arrow-left"
          aria-label="Previous banner"
          onClick={showPreviousSlide}
        >
          ‹
        </button>
        <button
          type="button"
          className="hero-arrow hero-arrow-right"
          aria-label="Next banner"
          onClick={showNextSlide}
        >
          ›
        </button>

        <div className="hero-content" key={activeSlide}>
          <p className="eyebrow light">{currentSlide.eyebrow}</p>
          <h1>{currentSlide.title}</h1>
          <p>{currentSlide.text}</p>
          <Link to={currentSlide.ctaTo} className="primary-button">
            {currentSlide.ctaLabel}
          </Link>
        </div>

        <div className="hero-indicators" aria-label="Banner slides">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={activeSlide === index ? 'hero-indicator active' : 'hero-indicator'}
              aria-label={`Show ${slide.title}`}
              onClick={() => setActiveSlide(index)}
            />
          ))}
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
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="category-pill"
              >
                <span className="category-image-wrap">
                  {getCategoryImage(category.name) && (
                    <img
                      src={getCategoryImage(category.name)}
                      alt={category.name}
                      className="category-image"
                    />
                  )}
                  {!getCategoryImage(category.name) && (
                    <span>{category.name.slice(0, 1).toUpperCase()}</span>
                  )}
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
