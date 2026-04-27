import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { addCartItem, createWishlistItem, deleteWishlistItem } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getProductImage } from '../utils/productImages.js';

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM4.4 4H2V2h3.8l2.1 11h8.7l2-7H8.2l-.4-2H21l-3.2 11H6.2L4.4 4Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21.1 10.6 20C5.4 15.6 2 12.8 2 8.5 2 5.5 4.4 3 7.4 3c1.7 0 3.3.8 4.3 2.1C12.7 3.8 14.3 3 16 3c3 0 5.4 2.5 5.4 5.5 0 4.3-3.4 7.1-8.6 11.5L12 21.1Zm0-2.7.3-.3c4.8-4.1 7.1-6.2 7.1-9.6 0-1.9-1.5-3.5-3.4-3.5-1.5 0-2.9.9-3.5 2.2h-1.6C10.3 5.9 8.9 5 7.4 5 5.5 5 4 6.6 4 8.5c0 3.4 2.3 5.5 7.1 9.6l.9.3Z" />
    </svg>
  );
}

export default function ProductCard({ product, index, wishlistItem, onWishlistChanged }) {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const imageUrl = getProductImage(product, index);
  const isOutOfStock = product.stock <= 0;
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const [message, setMessage] = useState('');
  const isLoved = Boolean(wishlistItem);

  async function handleLovedToggle() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    setIsUpdatingWishlist(true);
    setMessage('');

    try {
      if (wishlistItem) {
        await deleteWishlistItem(accessToken, wishlistItem.id);
        setMessage('Removed from wishlist.');
      } else {
        await createWishlistItem(accessToken, { product_id: product.id });
        setMessage('Saved to wishlist.');
      }
      onWishlistChanged?.();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsUpdatingWishlist(false);
    }
  }

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    setIsAdding(true);
    setMessage('');

    try {
      await addCartItem(accessToken, {
        product_id: product.id,
        quantity: 1,
      });
      window.dispatchEvent(new Event('cart-updated'));
      setMessage('Added to cart.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-image-link">
        <img src={imageUrl} alt={product.name} className="product-image" />
      </Link>
      <div className="product-card-body">
        <p className="eyebrow">{product.category_name}</p>
        <h3>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="product-meta">
          <span className="price">${product.price}</span>
          <span className={isOutOfStock ? 'stock out' : 'stock'}>
            {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
          </span>
        </div>
        <div className="product-card-actions">
          <button
            type="button"
            className={isLoved ? 'love-button active' : 'love-button'}
            aria-label={isLoved ? 'Remove from wishlist' : 'Add to wishlist'}
            disabled={isUpdatingWishlist}
            onClick={handleLovedToggle}
          >
            <HeartIcon />
          </button>
          <button
            type="button"
            className="add-cart-button"
            disabled={isOutOfStock || isAdding}
            onClick={handleAddToCart}
          >
            <CartIcon />
            <span>{isAdding ? 'Adding...' : 'Add to cart'}</span>
          </button>
        </div>
        {message && <p className="card-message">{message}</p>}
      </div>
    </article>
  );
}
