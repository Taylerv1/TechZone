import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import AuthScene from '../components/AuthScene.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successMessage = location.state?.message || '';

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

    try {
      await login(form);
      const destination = location.state?.from?.pathname || '/account';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <AuthScene />
      <div className="auth-panel">
        <Link to="/" className="auth-brand">TechZone</Link>
        <div className="auth-copy">
          <h1>Welcome back</h1>
          <p className="muted">Sign in to continue shopping and manage your orders.</p>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
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
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </label>

          {error && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="muted auth-helper-row">
          Forgot your password? <Link to="/forgot-password" className="text-link">Reset it</Link>
        </p>
        <p className="muted">
          New here? <Link to="/register" className="text-link">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
