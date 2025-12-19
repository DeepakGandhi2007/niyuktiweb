import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Plus, Edit2, Trash2, Loader2, X } from "lucide-react";

export default function TestCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // ✅ new
  const [editId, setEditId] = useState(null); // ✅ new

  const [categoryForm, setCategoryForm] = useState({ name: "", icon: "" });

  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const GET_URL = `${API_BASE}/api/test-category/get-categories`;
  const ADD_URL = `${API_BASE}/api/test-category/add-category`;
  const DELETE_URL = `${API_BASE}/api/test-category/delete-category`;
  const UPDATE_URL = `${API_BASE}/api/test-category/update-category`;

  // ✅ Fetch all categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(GET_URL);
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        setError(data.message || "Failed to load categories");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ Delete category
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setUpdating(id);
    try {
      const res = await fetch(`${DELETE_URL}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error();
      toast.success("Category deleted successfully!");
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setUpdating(null);
    }
  };

  // ✅ Open modal for Add or Edit
  const openModal = (mode = "add", category = null) => {
    if (mode === "edit") {
      setIsEditing(true);
      setEditId(category.id);
      setCategoryForm({ name: category.name, icon: category.icon || "" });
    } else {
      setIsEditing(false);
      setEditId(null);
      setCategoryForm({ name: "", icon: "" });
    }
    setShowModal(true);
  };

  // ✅ Save category (Add or Edit)
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required!");
      return;
    }
    setAdding(true);
    try {
      const url = isEditing
        ? `${UPDATE_URL}/${editId}`
        : ADD_URL;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });

      const data = await res.json();
      if (!data.success) throw new Error();

      if (isEditing) {
        toast.success("Category updated successfully!");
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editId ? { ...cat, ...categoryForm } : cat
          )
        );
      } else {
        toast.success("Category added successfully!");
        setCategories((prev) => [
          ...prev,
          { id: Date.now(), ...categoryForm, totalCourses: 0 },
        ]);
      }

      setShowModal(false);
      setCategoryForm({ name: "", icon: "" });
    } catch {
      toast.error("Failed to save category");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="relative p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <ToastContainer />

      {/* ✅ Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-0">
          Test Categories
        </h1>
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          Total: {categories.length}
        </span>
      </div>

      {/* ✅ Loading or Error */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-3">
          <Loader2 className="animate-spin w-8 h-8" />
          <span>Loading categories...</span>
        </div>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : (
        <>
          {/* ✅ Table */}
          <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3 font-semibold">#</th>
                  <th className="px-6 py-3 font-semibold">Category Name</th>
                  <th className="px-6 py-3 font-semibold">Icon</th>
                  <th className="px-6 py-3 font-semibold">Tests</th>
                  <th className="px-6 py-3 font-semibold text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map((cat, index) => (
                    <tr
                      key={cat.id}
                      className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {cat.name}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {cat.icon || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {cat.totalCourses || 0}
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-3 text-center">
                        <button
                          onClick={() => openModal("edit", cat)}
                          className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={updating === cat.id}
                          className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition"
                        >
                          {updating === cat.id ? (
                            <Loader2 className="animate-spin w-4 h-4" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center text-gray-500 py-6 dark:text-gray-400"
                    >
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ✅ Floating Add Button */}
      <button
        onClick={() => openModal("add")}
        className="fixed bottom-8 right-8 z-[9999] bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
      >
        <Plus size={22} />
      </button>

      {/* ✅ Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[10000]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-11/12 sm:w-[400px] p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {isEditing ? "Edit Category" : "Add New Category"}
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter category name"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
                  Icon (optional)
                </label>
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      icon: e.target.value,
                    })
                  }
                  placeholder="e.g. FaBook"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent text-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={adding}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center min-w-[80px]"
              >
                {adding ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  isEditing ? "Update" : "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
