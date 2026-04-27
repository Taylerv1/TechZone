import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import AuthScene from '../components/AuthScene.jsx';
import { confirmEmail } from '../api/client.js';

export default function ConfirmEmail() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Confirming your account...');

  useEffect(() => {
    let isMounted = true;

    async function runConfirmation() {
      try {
        await confirmEmail({ uid, token });
        if (isMounted) {
          setStatus('success');
          setMessage('Your account is confirmed. You can sign in now.');
          setTimeout(() => {
            navigate('/login', {
              replace: true,
              state: { message: 'Your account is confirmed. You can sign in now.' },
            });
          }, 1200);
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setMessage(err.message);
        }
      }
    }

    runConfirmation();

    return () => {
      isMounted = false;
    };
  }, [navigate, token, uid]);

  return (
    <section className="auth-page">
      <AuthScene />
      <div className="auth-panel">
        <Link to="/" className="auth-brand">TechZone</Link>
        <div className="auth-copy">
          <h1>Email confirmation</h1>
          <p className={status === 'error' ? 'error-message' : 'success-message'}>
            {message}
          </p>
        </div>
        <Link to="/login" className="primary-button">Go to login</Link>
      </div>
    </section>
  );
}
