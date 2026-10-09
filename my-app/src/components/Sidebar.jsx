
function Sidebar({ activePage, setActivePage, sidebarOpen, setSidebarOpen }) {
  const menuItems = [
    { name: "Dashboard", icon: "🏠" },
    { name: "Food Tracker", icon: "🍎" },
    { name: "Nutrition", icon: "🥗" },
    { name: "Meal History", icon: "📅" },
  ];

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <h3>MENU</h3>

        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <button
                type="button"
                className={`sidebar-link ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setSidebarOpen(false);
                }}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}

export default Sidebar;
