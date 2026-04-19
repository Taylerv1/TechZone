import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { deleteCartItem, getCart, updateCartItem } from '../api/client.js';
import CartItem from '../components/CartItem.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Cart() {
  const { accessToken } = useAuth();
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  async function loadCart() {
    setIsLoading(true);
    setError('');
    try {
      const data = await getCart(accessToken);
      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, [accessToken]);

  async function handleUpdateQuantity(itemId, quantity) {
    if (!quantity || quantity < 1) {
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      await updateCartItem(accessToken, itemId, { quantity });
      const data = await getCart(accessToken);
      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRemove(itemId) {
    setIsUpdating(true);
    setError('');

    try {
      await deleteCartItem(accessToken, itemId);
      const data = await getCart(accessToken);
      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }

  const items = cart?.items || [];

  return (
    <section className="cart-page">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">Cart</p>
          <h1>Shopping cart</h1>
        </div>
        <Link to="/products" className="text-link">Continue shopping</Link>
      </div>

      {isLoading && <p className="muted">Loading cart...</p>}
      {error && <p className="error-message">{error}</p>}

      {!isLoading && items.length === 0 && (
        <div className="empty-state">
          <div>
            <h2>Your cart is empty</h2>
            <p className="muted">Add products before checkout.</p>
            <Link to="/products" className="primary-button">Browse products</Link>
          </div>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                isUpdating={isUpdating}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
              />
            ))}
          </div>

          <aside className="summary-panel">
            <h2>Order summary</h2>
            <div className="summary-row">
              <span>Total</span>
              <strong>${cart.total_price}</strong>
            </div>
            <Link to="/checkout" className="primary-button">
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
