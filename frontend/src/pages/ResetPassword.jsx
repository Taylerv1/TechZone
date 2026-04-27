import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { confirmPasswordReset } from '../api/client.js';
import AuthScene from '../components/AuthScene.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ResetPassword() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { uid, token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await confirmPasswordReset({ uid, token, password });
      navigate('/login', {
        replace: true,
        state: { message: response.detail },
      });
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
          <h1>Create a new password</h1>
          <p className="muted">Choose a new password for your account.</p>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            New password
            <input
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
            />
          </label>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Updating password...' : 'Update password'}
          </button>
        </form>
        <p className="muted">
          Back to <Link to="/login" className="text-link">Login</Link>
        </p>
      </div>
    </section>
  );
}
