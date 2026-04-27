import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import ProductCard from '../components/ProductCard.jsx';
import { getCategories, getProducts, getWishlist } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
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
    eyebrow: 'Customer dashboard',
    title: 'Manage your shopping in one place',
    text: 'Save addresses, manage your wishlist, and follow your order history from your dashboard.',
    ctaLabel: 'Open dashboard',
    ctaTo: '/account',
  },
  {
    eyebrow: 'Easy ordering',
    title: 'From cart to order in minutes',
    text: 'Add items to your cart, place your order, and track every step from your dashboard.',
    ctaLabel: 'View cart',
    ctaTo: '/cart',
  },
];

function getCategoryImage(categoryName) {
  return categoryImages[categoryName] || '';
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Order receipt">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6" />
      <path d="M9 12h4" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Stock box">
      <path d="M4 7l8-4 8 4-8 4-8-4z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

function TrackingIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Delivery truck">
      <path d="M3 6h11v11H3z" />
      <path d="M14 10h4l3 4v3h-7z" />
      <path d="M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      <path d="M17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  );
}

export default function Home() {
  const { accessToken, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      try {
        const [categoryData, productData, featuredData] = await Promise.all([
          getCategories(),
          getProducts({ sort: 'newest' }),
          getProducts({ featured: 'true', page_size: 12 }),
        ]);

        if (!isMounted) {
          return;
        }

        const loadedProducts = productData.results || [];
        const loadedFeaturedProducts = featuredData.results || [];

        setCategories(categoryData);
        setProducts(loadedProducts);
        setFeaturedProducts(
          (loadedFeaturedProducts.length ? loadedFeaturedProducts : loadedProducts).slice(0, 8)
        );
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

  async function loadWishlist() {
    if (!isAuthenticated || !accessToken) {
      setWishlistItems([]);
      return;
    }

    try {
      const data = await getWishlist(accessToken);
      setWishlistItems(data.results || data);
    } catch {
      setWishlistItems([]);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, [accessToken, isAuthenticated]);

  const promoProducts = products.slice(0, 3);
  const currentSlide = heroSlides[activeSlide];
  const wishlistByProductId = new Map(
    wishlistItems.map((item) => [item.product.id, item])
  );

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
          &lsaquo;
        </button>
        <button
          type="button"
          className="hero-arrow hero-arrow-right"
          aria-label="Next banner"
          onClick={showNextSlide}
        >
          &rsaquo;
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
          <span className="service-icon">
            <ReceiptIcon />
          </span>
          <div>
            <strong>Real orders</strong>
            <small>Checkout creates saved orders.</small>
          </div>
        </div>
        <div className="service-item">
          <span className="service-icon">
            <BoxIcon />
          </span>
          <div>
            <strong>Stock checked</strong>
            <small>Cart quantity follows inventory.</small>
          </div>
        </div>
        <div className="service-item">
          <span className="service-icon">
            <TrackingIcon />
          </span>
          <div>
            <strong>Order tracking</strong>
            <small>Follow status from your dashboard.</small>
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
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                wishlistItem={wishlistByProductId.get(product.id)}
                onWishlistChanged={loadWishlist}
              />
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
