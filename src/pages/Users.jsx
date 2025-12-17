import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Mail, Phone, LogIn, Loader2 } from "lucide-react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth/get-users`;
  const TOGGLE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth/toggle-ban`;

  // ✅ Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?page=${page}&limit=8`);
      const data = await res.json();

      if (data.success) {
        setUsers(
          data.users.map((u) => ({
            raw: u, // ✅ store full backend user
            id: u.id,
            name: u.name || "Unknown",
            email: u.email || "-",
            phone: u.phone || "-",
            image:
              u.image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                u.name || "User"
              )}&background=random`,
            googleLogin: u.is_google === 1,
            banned: u.is_banned === 1 || false,
          }))
        );

        setTotalPages(data.totalPages || 1);
      }
      else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  // ✅ Toggle ban/unban
  const handleToggleBan = async (id) => {
    const user = users.find((u) => u.id === id);
    const newStatus = !user.banned;
    setUpdating(id);

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, banned: newStatus } : u))
    );

    try {
      const res = await fetch(TOGGLE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, banned: newStatus }),
      });

      const data = await res.json();
      if (!data.success) throw new Error();

      toast.success(
        `${user.name} has been ${newStatus ? "banned" : "unbanned"}`
      );
    } catch {
      toast.error("Failed to update status");
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, banned: !newStatus } : u))
      );
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-950">
      <ToastContainer />

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-3">
          <Loader2 className="animate-spin w-8 h-8" />
          <span>Loading users...</span>
        </div>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : (
        <>
          {/* ✅ Users Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover"
                  />

                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                    {user.name}
                  </h3>

                  {/* 📞 ✉️ Clickable Icons */}
                  <div className="flex items-center gap-4">
                    <a
                      href={`tel:${user.phone}`}
                      title="Call User"
                      className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition"
                    >
                      <Phone
                        size={18}
                        className="text-green-500 dark:text-green-400"
                      />
                    </a>

                    <a
                      href={`mailto:${user.email}`}
                      title="Send Email"
                      className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                    >
                      <Mail
                        size={18}
                        className="text-blue-500 dark:text-blue-400"
                      />
                    </a>
                    <button
                      onClick={() => {
                        setSelectedUser(user.raw);
                        setShowInfo(true);
                      }}
                      className="mt-2 px-3 py-1 text-xs rounded-full bg-purple-600 text-white hover:bg-purple-700 transition"
                    >
                      AIl  Info
                    </button>

                  </div>

                  {/* 🔐 Login Type */}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${user.googleLogin
                      ? "bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-400"
                      }`}
                  >
                    <LogIn size={12} />{" "}
                    {user.googleLogin ? "Google Login" : "Mobile Login"}
                  </span>

                  {/* 🚫 Toggle Ban/Unban */}
                  <div className="flex items-center gap-2 mt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={user.banned}
                        onChange={() => handleToggleBan(user.id)}
                        disabled={updating === user.id}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-green-300 rounded-full peer-checked:bg-red-500 dark:bg-gray-700 transition-all duration-300"></div>
                      <div
                        className={`absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full shadow transition-transform duration-300 ${user.banned ? "translate-x-5" : ""
                          }`}
                      ></div>
                    </label>

                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {updating === user.id ? (
                        <Loader2 className="animate-spin w-4 h-4 inline" />
                      ) : user.banned ? (
                        "Banned"
                      ) : (
                        "Active"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ Pagination */}
          <div className="flex justify-center mt-8 space-x-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-800 disabled:opacity-40"
            >
              ←
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded-md text-sm ${page === i + 1
                  ? "bg-black text-white dark:bg-gray-700"
                  : "bg-gray-200 dark:bg-gray-800"
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-800 disabled:opacity-40"
            >
              →
            </button>
          </div>
        </>
      )}
      {showInfo && selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                 AIl User Intelligence
              </h2>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-500 hover:text-red-500 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                {JSON.stringify(selectedUser, null, 2)}
              </pre>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t dark:border-gray-800 text-right">
              <button
                onClick={() => setShowInfo(false)}
                className="px-4 py-1 rounded-md bg-black text-white dark:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
