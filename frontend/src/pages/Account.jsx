import { useEffect, useState } from 'react';

import {
  createAddress,
  deleteAddress,
  getAddresses,
  getOrders,
  updateAddress,
  updateProfile,
} from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyAddress = {
  full_name: '',
  phone: '',
  address_line: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  is_default: false,
};

export default function Account() {
  const { accessToken, user, refreshProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setProfileForm({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    });
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function loadAccountData() {
      setIsLoading(true);
      setError('');

      try {
        const [addressData, orderData] = await Promise.all([
          getAddresses(accessToken),
          getOrders(accessToken),
        ]);

        if (isMounted) {
          setAddresses(addressData.results || addressData);
          setOrders(orderData.results || []);
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

    loadAccountData();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  }

  function handleAddressChange(event) {
    const { name, value, type, checked } = event.target;
    setAddressForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await updateProfile(accessToken, profileForm);
      await refreshProfile();
      setMessage('Profile updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddressSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      if (editingAddressId) {
        const updated = await updateAddress(accessToken, editingAddressId, addressForm);
        setAddresses((current) => current.map((address) => (
          address.id === updated.id ? updated : address
        )));
        setMessage('Address updated.');
      } else {
        const created = await createAddress(accessToken, addressForm);
        setAddresses((current) => [created, ...current]);
        setMessage('Address added.');
      }

      setAddressForm(emptyAddress);
      setEditingAddressId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditAddress(address) {
    setEditingAddressId(address.id);
    setAddressForm({
      full_name: address.full_name,
      phone: address.phone,
      address_line: address.address_line,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
  }

  async function handleDeleteAddress(id) {
    setMessage('');
    setError('');

    try {
      await deleteAddress(accessToken, id);
      setAddresses((current) => current.filter((address) => address.id !== id));
      if (editingAddressId === id) {
        setEditingAddressId(null);
        setAddressForm(emptyAddress);
      }
      setMessage('Address deleted.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="account-page">
      <div className="account-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>My account</h1>
        </div>
        <p className="muted">Signed in as {user?.username}</p>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="account-grid">
        <section className="account-section">
          <h2>Profile</h2>
          <form className="form-grid two-column" onSubmit={handleProfileSubmit}>
            <label>
              First name
              <input
                name="first_name"
                value={profileForm.first_name}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              Last name
              <input
                name="last_name"
                value={profileForm.last_name}
                onChange={handleProfileChange}
              />
            </label>

            <label className="full-span">
              Email
              <input
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
              />
            </label>

            <button type="submit" className="primary-button full-span">
              Save profile
            </button>
          </form>
        </section>

        <section className="account-section">
          <h2>{editingAddressId ? 'Edit address' : 'Add address'}</h2>
          <form className="form-grid two-column" onSubmit={handleAddressSubmit}>
            <label>
              Full name
              <input
                name="full_name"
                value={addressForm.full_name}
                onChange={handleAddressChange}
                required
              />
            </label>

            <label>
              Phone
              <input
                name="phone"
                value={addressForm.phone}
                onChange={handleAddressChange}
                required
              />
            </label>

            <label className="full-span">
              Address line
              <input
                name="address_line"
                value={addressForm.address_line}
                onChange={handleAddressChange}
                required
              />
            </label>

            <label>
              City
              <input
                name="city"
                value={addressForm.city}
                onChange={handleAddressChange}
                required
              />
            </label>

            <label>
              State
              <input
                name="state"
                value={addressForm.state}
                onChange={handleAddressChange}
              />
            </label>

            <label>
              Postal code
              <input
                name="postal_code"
                value={addressForm.postal_code}
                onChange={handleAddressChange}
                required
              />
            </label>

            <label>
              Country
              <input
                name="country"
                value={addressForm.country}
                onChange={handleAddressChange}
                required
              />
            </label>

            <label className="checkbox-label full-span">
              <input
                name="is_default"
                type="checkbox"
                checked={addressForm.is_default}
                onChange={handleAddressChange}
              />
              Default address
            </label>

            <button type="submit" className="primary-button">
              {editingAddressId ? 'Update address' : 'Add address'}
            </button>
            {editingAddressId && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditingAddressId(null);
                  setAddressForm(emptyAddress);
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </section>
      </div>

      <section className="account-section">
        <h2>Saved addresses</h2>
        {isLoading && <p className="muted">Loading addresses...</p>}
        {!isLoading && addresses.length === 0 && (
          <p className="muted">No saved addresses yet.</p>
        )}
        <div className="address-list">
          {addresses.map((address) => (
            <article key={address.id} className="list-card">
              <div>
                <strong>{address.full_name}</strong>
                <p>
                  {address.address_line}, {address.city}, {address.country}
                </p>
                <p className="muted">{address.phone}</p>
              </div>
              <div className="list-actions">
                {address.is_default && <span className="status-pill">Default</span>}
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => startEditAddress(address)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleDeleteAddress(address.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="account-section">
        <h2>Order history</h2>
        {isLoading && <p className="muted">Loading orders...</p>}
        {!isLoading && orders.length === 0 && (
          <p className="muted">No orders yet.</p>
        )}
        <div className="order-list">
          {orders.map((order) => (
            <article key={order.id} className="list-card">
              <div>
                <strong>Order #{order.id}</strong>
                <p className="muted">
                  {new Date(order.created_at).toLocaleDateString()} - {order.items.length} item(s)
                </p>
              </div>
              <div className="order-summary">
                <span className="status-pill">{order.status}</span>
                <strong>${order.total_price}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
