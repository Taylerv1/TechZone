import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { getCategories } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

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
                <NavLink to="/cart">Cart</NavLink>
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
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
            >
              <span className="theme-toggle-mark" />
              <span>{isLight ? 'Dark' : 'Light'}</span>
            </button>
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
