import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { getCategories } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5h2l2 10h9.5l1.8-7H7.2" />
      <path d="M9.5 19.2h.1M17 19.2h.1" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 15.2A8.2 8.2 0 0 1 8.8 4a7 7 0 1 0 11.2 11.2Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </svg>
  );
}

export default function Layout() {
  const { isAuthenticated, logout, user } = useAuth();
  const { isLight, toggleTheme } = useTheme();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const data = await getCategories();
        if (isMounted) {
          setCategories(data);
        }
      } catch {
        if (isMounted) {
          setCategories([]);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="top-bar">
          <span>support@techzone.com</span>
          <span>Easy ordering for everyday tech</span>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" className="brand" aria-label="Store home">
            <span>TechZone</span>
          </NavLink>
          <div className="nav-links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/account">Dashboard</NavLink>
                <button type="button" className="nav-button" onClick={logout}>
                  Logout {user?.first_name || user?.username || ''}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/register">Register</NavLink>
              </>
            )}
            <div className="nav-icon-actions">
              {isAuthenticated && (
                <NavLink to="/cart" className="icon-nav-link" aria-label="Shopping cart">
                  <CartIcon />
                </NavLink>
              )}
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
              >
                {isLight ? <MoonIcon /> : <SunIcon />}
              </button>
            </div>
          </div>
        </nav>
        <nav className="category-nav" aria-label="Product categories">
          <div className="category-nav-inner">
            <Link to="/products">All products</Link>
            {categories.map((category) => (
              <Link key={category.id} to={`/products?category=${category.id}`}>
                {category.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-promo">
          <div>
            <strong>Stay close to new arrivals</strong>
            <p>Browse fresh devices, accessories, and useful tech picks for your daily setup.</p>
          </div>
          <NavLink to="/products" className="primary-button">Browse products</NavLink>
        </div>

        <div className="footer-main">
          <div className="footer-column footer-about">
            <NavLink to="/" className="footer-brand">
              <span>TechZone</span>
            </NavLink>
            <p>
              Practical electronics, accessories, and everyday devices selected for work,
              study, and home.
            </p>
            <div className="footer-social" aria-label="Social links">
              <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">f</a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">ig</a>
              <a href="https://x.com/" target="_blank" rel="noreferrer">x</a>
              <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">yt</a>
            </div>
          </div>

          <div className="footer-column">
            <strong>Shop</strong>
            <NavLink to="/products" className="footer-link">All products</NavLink>
            {categories.slice(0, 4).map((category) => (
              <NavLink
                key={category.id}
                to={`/products?category=${category.id}`}
                className="footer-link"
              >
                {category.name}
              </NavLink>
            ))}
          </div>

          <div className="footer-column">
            <strong>Account</strong>
            <NavLink to="/cart" className="footer-link">Shopping cart</NavLink>
            <NavLink to="/account" className="footer-link">Dashboard</NavLink>
            <NavLink to="/account" className="footer-link">Saved addresses</NavLink>
            <NavLink to="/account" className="footer-link">Order history</NavLink>
          </div>

          <div className="footer-column">
            <strong>Contact</strong>
            <p>support@techzone.com</p>
            <p>Saida, Lebanon</p>
            <NavLink to="/contact" className="footer-link">Send a message</NavLink>
          </div>
        </div>

        <div className="footer-bottom">
          <span>Copyright 2026 TechZone. All rights reserved.</span>
          <span>Built for simple online shopping.</span>
        </div>
      </footer>
    </div>
  );
}
