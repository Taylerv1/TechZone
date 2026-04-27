import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  addCartItem,
  createProductReview,
  createWishlistItem,
  deleteWishlistItem,
  getProduct,
  getProductReviews,
  getWishlist,
} from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getProductImage } from '../utils/productImages.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [wishlistItem, setWishlistItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: '5', comment: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getProduct(id);
        const reviewData = await getProductReviews(id);
        if (isMounted) {
          setProduct(data);
          setReviews(reviewData.results || reviewData);
          setSelectedImage(getProductImage(data, Number(id)));
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

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function loadWishlistItem(productId) {
    if (!isAuthenticated || !accessToken) {
      setWishlistItem(null);
      return;
    }

    try {
      const data = await getWishlist(accessToken);
      const items = data.results || data;
      setWishlistItem(items.find((item) => item.product.id === productId) || null);
    } catch {
      setWishlistItem(null);
    }
  }

  useEffect(() => {
    if (product) {
      loadWishlistItem(product.id);
    }
  }, [accessToken, isAuthenticated, product?.id]);

  if (isLoading) {
    return <p className="page-message">Loading product...</p>;
  }

  if (error) {
    return <p className="page-message error-message">{error}</p>;
  }

  if (!product) {
    return <p className="page-message">Product not found.</p>;
  }

  const images = product.images?.length ? product.images : [];
  const isOutOfStock = product.stock <= 0;

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    setIsAdding(true);
    setError('');
    setMessage('');

    try {
      await addCartItem(accessToken, {
        product_id: product.id,
        quantity,
      });
      window.dispatchEvent(new Event('cart-updated'));
      setMessage('Product added to cart.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleWishlistToggle() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    setError('');
    setMessage('');

    try {
      if (wishlistItem) {
        await deleteWishlistItem(accessToken, wishlistItem.id);
        setWishlistItem(null);
        setMessage('Removed from wishlist.');
      } else {
        const created = await createWishlistItem(accessToken, { product_id: product.id });
        setWishlistItem(created);
        setMessage('Saved to wishlist.');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleReviewChange(event) {
    const { name, value } = event.target;
    setReviewForm((current) => ({ ...current, [name]: value }));
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    setIsReviewSubmitting(true);
    setError('');
    setMessage('');

    try {
      const created = await createProductReview(accessToken, product.id, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setReviews((current) => [created, ...current]);
      setReviewForm({ rating: '5', comment: '' });
      setMessage('Review submitted.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  return (
    <section className="product-detail-page">
      <Link to="/products" className="text-link">Back to products</Link>

      <div className="product-detail">
        <div className="detail-gallery">
          <img src={selectedImage} alt={product.name} className="detail-image" />
          {images.length > 1 && (
            <div className="thumbnail-row">
              {images.map((image) => (
                <button
                  type="button"
                  key={image.id}
                  className={selectedImage === image.image ? 'thumbnail active' : 'thumbnail'}
                  onClick={() => setSelectedImage(image.image)}
                >
                  <img src={image.image} alt={image.alt_text || product.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-content">
          <p className="eyebrow">{product.category_name}</p>
          <h1>{product.name}</h1>
          <p className="detail-description">{product.description}</p>

          <div className="detail-price-row">
            <span className="price large">${product.price}</span>
            <span className={isOutOfStock ? 'stock out' : 'stock'}>
              {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
            </span>
          </div>
          <p className="muted">
            {product.average_rating
              ? `${product.average_rating}/5 from ${product.reviews_count} review(s)`
              : 'No reviews yet.'}
          </p>

          <div className="purchase-panel">
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                disabled={isOutOfStock || isAdding}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              className="primary-button"
              disabled={isOutOfStock || isAdding}
              onClick={handleAddToCart}
            >
              {isAdding ? 'Adding...' : 'Add to cart'}
            </button>
            <Link to="/cart" className="secondary-button">View cart</Link>
            <button
              type="button"
              className={wishlistItem ? 'secondary-button active-soft' : 'secondary-button'}
              onClick={handleWishlistToggle}
            >
              {wishlistItem ? 'Saved to wishlist' : 'Add to wishlist'}
            </button>
          </div>

          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>

      <section className="reviews-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2>Customer ratings</h2>
          </div>
        </div>

        <form className="review-form" onSubmit={handleReviewSubmit}>
          <label>
            Rating
            <select
              name="rating"
              value={reviewForm.rating}
              onChange={handleReviewChange}
            >
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Average</option>
              <option value="2">2 - Fair</option>
              <option value="1">1 - Poor</option>
            </select>
          </label>
          <label className="full-span">
            Comment
            <textarea
              name="comment"
              value={reviewForm.comment}
              onChange={handleReviewChange}
              required
            />
          </label>
          <button type="submit" className="primary-button" disabled={isReviewSubmitting}>
            {isReviewSubmitting ? 'Submitting...' : 'Submit review'}
          </button>
        </form>

        <div className="review-list">
          {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
          {reviews.map((review) => (
            <article key={review.id} className="review-card">
              <div>
                <strong>{review.user_name}</strong>
                <span className="status-pill">{review.rating}/5</span>
              </div>
              <p>{review.comment}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
