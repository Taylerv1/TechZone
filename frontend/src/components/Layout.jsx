import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="top-bar">
          <span>Support@example.com</span>
          <span>Mock payment only</span>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" className="brand" aria-label="Store home">
            <span className="brand-mark">E</span>
            <span>Tech Store</span>
          </NavLink>
          <div className="nav-links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/products">Products</NavLink>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div>
          <strong>Tech Store</strong>
          <p>Electronics, accessories, and everyday devices.</p>
        </div>
        <div>
          <strong>Contact</strong>
          <p>Support@example.com</p>
        </div>
      </footer>
    </div>
  );
}
