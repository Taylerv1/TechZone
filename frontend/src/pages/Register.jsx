import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import AuthScene from '../components/AuthScene.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const initialForm = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
};

export default function Register() {
  const { isAuthenticated, register } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await register(form);
      setForm(initialForm);
      setMessage('Account created. Please confirm your email before signing in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <AuthScene />
      <div className="auth-panel wide">
        <Link to="/" className="auth-brand">TechZone</Link>
        <div className="auth-copy">
          <h1>Create account</h1>
          <p className="muted">Save addresses, build your cart, and track your orders.</p>
        </div>
        <form className="form-grid two-column" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </label>

          <label>
            First name
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              autoComplete="given-name"
            />
          </label>

          <label>
            Last name
            <input
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              autoComplete="family-name"
            />
          </label>

          <label className="full-span">
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </label>

          {error && <p className="error-message full-span">{error}</p>}
          {message && <p className="success-message full-span">{message}</p>}

          <button type="submit" className="primary-button full-span" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="muted">
          Already have an account? <Link to="/login" className="text-link">Login</Link>
        </p>
      </div>
    </section>
  );
}
