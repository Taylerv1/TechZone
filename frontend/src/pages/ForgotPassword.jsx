import { useState } from 'react';
import { Link } from 'react-router-dom';

import { requestPasswordReset } from '../api/client.js';
import AuthScene from '../components/AuthScene.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset({ email });
      setMessage(response.detail);
      setEmail('');
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
          <h1>Reset password</h1>
          <p className="muted">
            Enter your account email and we will send you a reset link in the backend console.
          </p>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>
        <p className="muted">
          Back to <Link to="/login" className="text-link">Login</Link>
        </p>
      </div>
    </section>
  );
}
