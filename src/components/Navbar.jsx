import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Bell, CalendarDays, LogOut, ChevronDown, Menu } from "lucide-react";

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Map path to page title
  const pageTitles = {
    "/": "Dashboard",
    "/users": "User Management",
    "/banner": "Banner Management",
    "/category": "Category Management",
    "/course": "Course Management",
    "/settings": "Settings",
    "/reports": "Reports",
  };

  const currentTitle = pageTitles[location.pathname] || "Page";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-md px-4 md:px-6 py-3 flex justify-between items-center border-b border-gray-700 sticky top-0 z-50 backdrop-blur-md">
      {/* Left: Sidebar toggle + Page Title */}
      <div className="flex items-center gap-3">
        {/* Hamburger for mobile */}
        <button
          className="lg:hidden p-2 rounded-md hover:bg-gray-800 transition"
          onClick={() => setSidebarOpen(!sidebarOpen)} // ✅ toggle instead of just open
        >
          <Menu size={22} />
        </button>

        <h2 className="text-lg md:text-xl font-semibold tracking-wide flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          {currentTitle}
        </h2>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Date */}
        <div className="hidden sm:flex items-center gap-2 text-gray-300 hover:text-white transition">
          <CalendarDays size={18} />
          <span className="text-sm font-medium">{today}</span>
        </div>

        {/* Notifications */}
        <button
          title="Notifications"
          className="relative hover:text-blue-400 transition"
        >
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-2 md:px-3 py-2 rounded-lg transition"
          >
            <img
              src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff"
              alt="Profile"
              className="w-7 h-7 rounded-full"
            />
            <ChevronDown size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 md:w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-2 animate-fadeIn">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                Profile
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                Settings
              </button>
              <div className="border-t border-gray-700 my-1"></div>
              <button className="w-full text-left px-4 py-2 flex items-center gap-2 text-sm text-red-400 hover:bg-red-500 hover:text-white transition">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
