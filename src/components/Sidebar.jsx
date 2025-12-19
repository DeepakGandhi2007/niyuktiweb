import { Link, useLocation } from "react-router-dom";
import { FaHome, FaUsers, FaCog, FaImage, FaTimes, FaBook, FaFolder, FaTags } from "react-icons/fa";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();

  const links = [
    { to: "/", icon: <FaHome />, label: "Dashboard" },
    { to: "/users", icon: <FaUsers />, label: "Users" },
    { to: "/category", icon: <FaTags />, label: "Category" },
    { to: "/test-category", icon: <FaTags />, label: "Test Category" },
    { to: "/banner", icon: <FaImage />, label: "Banner" },
    { to: "/course", icon: <FaBook />, label: "Course" },
    { to: "/mock-test", icon: <FaBook />, label: "Mock Test" },
    { to: "/file-manager", icon: <FaFolder />, label: "File Manager" },
    { to: "/settings", icon: <FaCog />, label: "Settings" },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity ${sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar itself */}
      <div
        className={`fixed z-50 lg:static lg:translate-x-0 transform transition-transform duration-300 bg-black text-white w-64 h-full flex flex-col justify-between shadow-xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wide">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col space-y-1 px-4 flex-grow">
          {links.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors duration-200 ${location.pathname === to
                ? "bg-gray-800"
                : "hover:bg-gray-900 text-gray-300 hover:text-white"
                }`}
            >
              <span className="text-lg">{icon}</span>
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-500">
          © 2025 Admin Panel
        </div>
      </div>
    </>
  );
}
