import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  checkoutOrder,
  getAddresses,
  getCart,
  validateCoupon,
} from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyShipping = {
  full_name: '',
  phone: '',
  address_line: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  payment_method: 'mock',
};

export default function Checkout() {
  const { accessToken } = useAuth();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [shipping, setShipping] = useState(emptyShipping);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCouponChecking, setIsCouponChecking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadCheckoutData() {
      setIsLoading(true);
      setError('');

      try {
        const [cartData, addressData] = await Promise.all([
          getCart(accessToken),
          getAddresses(accessToken),
        ]);

        if (!isMounted) {
          return;
        }

        const savedAddresses = addressData.results || addressData;
        const defaultAddress = (
          savedAddresses.find((address) => address.is_default) || savedAddresses[0]
        );

        setCart(cartData);
        setAddresses(savedAddresses);

        if (defaultAddress) {
          setShipping({
            full_name: defaultAddress.full_name,
            phone: defaultAddress.phone,
            address_line: defaultAddress.address_line,
            city: defaultAddress.city,
            state: defaultAddress.state,
            postal_code: defaultAddress.postal_code,
            country: defaultAddress.country,
            payment_method: 'mock',
          });
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

    loadCheckoutData();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const items = cart?.items || [];
  const hasItems = items.length > 0;
  const subtotal = Number(cart?.total_price || 0);
  const discountAmount = Number(appliedCoupon?.discount_amount || 0);
  const finalTotal = appliedCoupon
    ? Number(appliedCoupon.total_price || 0)
    : subtotal;

  const addressOptions = useMemo(() => addresses.map((address) => ({
    id: address.id,
    label: `${address.full_name} - ${address.city}, ${address.country}`,
  })), [addresses]);

  function handleShippingChange(event) {
    const { name, value } = event.target;
    setShipping((current) => ({ ...current, [name]: value }));
  }

  function handleSavedAddressChange(event) {
    const id = Number(event.target.value);
    const address = addresses.find((item) => item.id === id);
    if (!address) {
      return;
    }

    setShipping({
      full_name: address.full_name,
      phone: address.phone,
      address_line: address.address_line,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      payment_method: 'mock',
    });
  }

  async function handleApplyCoupon() {
    const code = couponCode.trim();
    setError('');
    setCouponMessage('');

    if (!code) {
      setAppliedCoupon(null);
      setCouponMessage('Coupon removed.');
      return;
    }

    setIsCouponChecking(true);

    try {
      const coupon = await validateCoupon(accessToken, { code });
      setAppliedCoupon(coupon);
      setCouponCode(coupon.code);
      setCouponMessage('Coupon applied.');
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage('');
      setError(err.message);
    } finally {
      setIsCouponChecking(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const order = await checkoutOrder(accessToken, {
        ...shipping,
        coupon_code: appliedCoupon?.code || couponCode.trim(),
      });
      setCreatedOrder(order);
      setCart({ ...cart, items: [], total_price: '0.00' });
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponMessage('');
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdOrder) {
    return (
      <section className="checkout-page">
        <div className="success-panel">
          <div className="success-visual" aria-hidden="true">
            <span className="success-ring" />
            <span className="success-check">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
            </span>
            <span className="success-spark spark-one" />
            <span className="success-spark spark-two" />
            <span className="success-spark spark-three" />
          </div>
          <p className="eyebrow">Order placed</p>
          <h1>Thank you for your order.</h1>
          <p className="muted">
            Order #{createdOrder.id} was placed successfully.
          </p>
          {Number(createdOrder.discount_amount) > 0 && (
            <div className="summary-row">
              <span>Discount</span>
              <strong>-${createdOrder.discount_amount}</strong>
            </div>
          )}
          <div className="summary-row">
            <span>Total</span>
            <strong>${createdOrder.total_price}</strong>
          </div>
          <div className="button-row">
            <Link to="/account" className="primary-button">View orders</Link>
            <Link to="/products" className="secondary-button">Keep shopping</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Place order</h1>
        </div>
        <Link to="/cart" className="text-link">Back to cart</Link>
      </div>

      {isLoading && <p className="muted">Loading checkout...</p>}
      {error && <p className="error-message">{error}</p>}

      {!isLoading && !hasItems && (
        <div className="empty-state">
          <div>
            <h2>Your cart is empty</h2>
            <p className="muted">Add products before checkout.</p>
            <Link to="/products" className="primary-button">Browse products</Link>
          </div>
        </div>
      )}

      {!isLoading && hasItems && (
        <div className="checkout-layout">
          <form className="account-section checkout-form" onSubmit={handleSubmit}>
            <h2>Shipping information</h2>

            {addressOptions.length > 0 && (
              <label>
                Use saved address
                <select onChange={handleSavedAddressChange} defaultValue="">
                  <option value="">Choose an address</option>
                  {addressOptions.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="form-grid two-column">
              <label>
                Full name
                <input
                  name="full_name"
                  value={shipping.full_name}
                  onChange={handleShippingChange}
                  required
                />
              </label>
              <label>
                Phone
                <input
                  name="phone"
                  value={shipping.phone}
                  onChange={handleShippingChange}
                  required
                />
              </label>
              <label className="full-span">
                Address line
                <input
                  name="address_line"
                  value={shipping.address_line}
                  onChange={handleShippingChange}
                  required
                />
              </label>
              <label>
                City
                <input
                  name="city"
                  value={shipping.city}
                  onChange={handleShippingChange}
                  required
                />
              </label>
              <label>
                State
                <input
                  name="state"
                  value={shipping.state}
                  onChange={handleShippingChange}
                />
              </label>
              <label>
                Postal code
                <input
                  name="postal_code"
                  value={shipping.postal_code}
                  onChange={handleShippingChange}
                  required
                />
              </label>
              <label>
                Country
                <input
                  name="country"
                  value={shipping.country}
                  onChange={handleShippingChange}
                  required
                />
              </label>
              <label className="full-span">
                Payment method
                <input value="Standard payment" disabled />
              </label>
            </div>

            <div className="coupon-panel">
              <label>
                Coupon code
                <div className="coupon-row">
                  <input
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value);
                      setAppliedCoupon(null);
                      setCouponMessage('');
                    }}
                    placeholder="Enter coupon code"
                  />
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={isCouponChecking}
                    onClick={handleApplyCoupon}
                  >
                    {isCouponChecking ? 'Checking...' : 'Apply'}
                  </button>
                </div>
              </label>
              {couponMessage && <p className="success-message">{couponMessage}</p>}
            </div>

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Placing order...' : 'Place order'}
            </button>
          </form>

          <aside className="summary-panel">
            <h2>Order summary</h2>
            {items.map((item) => (
              <div key={item.id} className="summary-item">
                <span>{item.product.name} x {item.quantity}</span>
                <strong>${item.item_total}</strong>
              </div>
            ))}
            {appliedCoupon && (
              <div className="summary-row">
                <span>Discount ({appliedCoupon.code})</span>
                <strong>-${appliedCoupon.discount_amount}</strong>
              </div>
            )}
            <div className="summary-row">
              <span>Total</span>
              <strong>${finalTotal.toFixed(2)}</strong>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
