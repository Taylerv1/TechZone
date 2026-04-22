import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { getCategories } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { isAuthenticated, logout, user } = useAuth();
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
          <span>Support@example.com</span>
          <span>Secure checkout with mock payment</span>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" className="brand" aria-label="Store home">
            <span className="brand-mark">E</span>
            <span>Tech Store</span>
          </NavLink>
          <div className="nav-links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/cart">Cart</NavLink>
                <NavLink to="/account">Account</NavLink>
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
        <div className="footer-column footer-about">
          <NavLink to="/" className="footer-brand">
            <span className="brand-mark">E</span>
            <span>Tech Store</span>
          </NavLink>
          <p>Electronics, accessories, and everyday devices.</p>
        </div>
        <div className="footer-column">
          <strong>Shop</strong>
          <NavLink to="/products" className="footer-link">Products</NavLink>
          <NavLink to="/cart" className="footer-link">Cart</NavLink>
          <NavLink to="/account" className="footer-link">Account</NavLink>
        </div>
        <div className="footer-column">
          <strong>Contact</strong>
          <p>Support@example.com</p>
          <NavLink to="/contact" className="footer-link">Send a message</NavLink>
        </div>
      </footer>
    </div>
  );
}
