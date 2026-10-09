
function Navbar({ onMenuClick }) {
  return (
    <nav className="navbar">
      <button
        type="button"
        className="menu-toggle"
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      <div className="navbar-brand">
        <span className="brand-icon">🥗</span>
        <span>NutriAI</span>
      </div>
    </nav>
  );
}

export default Navbar;
