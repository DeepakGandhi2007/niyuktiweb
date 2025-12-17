import React, { useEffect, useState } from "react";
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaSearch,
  FaBookOpen,
  FaListUl,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function Test() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 1;

  const handleAddCourse = () => navigate("/Test/add");

  const fetchTests = async (query = search, pageNum = page) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/test/list?search=${encodeURIComponent(
          query
        )}&page=${pageNum}&limit=${limit}`
      );
      const result = await res.json();

      if (res.ok) {
        setTests(result.data || []);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (err) {
      console.error("Error loading test list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests(search, page);
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;

    try {
      const res = await fetch(`${API_URL}/api/test/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setTests((prev) => prev.filter((t) => t.id !== id));
      alert("Test deleted successfully");
    } catch {
      alert("Failed to delete test");
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 px-6 py-10">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-10 text-center">
        <h1 className="flex items-center justify-center gap-3 text-4xl font-extrabold text-gray-800">
          <FaBookOpen /> Test Management
        </h1>
        <p className="text-gray-600 mt-2">
          Create, manage and organize your tests beautifully
        </p>
      </div>

      {/* SEARCH */}
      <div className="max-w-xl mx-auto mb-10 relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search test by name..."
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            setPage(1);
            fetchTests(value, 1);
          }}
          className="w-full pl-12 pr-4 py-3 rounded-full border shadow-md focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <p className="text-center text-gray-500">Loading tests...</p>
        ) : tests.length === 0 ? (
          <p className="text-center text-gray-500">No tests found.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className="group rounded-2xl bg-white/80 backdrop-blur-md border
                           shadow-lg hover:shadow-2xl transition-all duration-300
                           hover:-translate-y-1 overflow-hidden"
              >
                {/* IMAGE */}
                <div className="relative overflow-hidden">
                  <img
                    src={test.thumbnail}
                    alt="Test"
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                    <FaListUl size={12} />
                    {test.question_count}
                  </span>
                </div>

                {/* BODY */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 truncate">
                    {test.name || "Unnamed Test"}
                  </h2>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => navigate(`/Test/edit/${test.id}`)}
                      className="flex-1 flex items-center justify-center gap-2
                                 bg-yellow-500 hover:bg-yellow-600 text-white
                                 px-4 py-2 rounded-xl shadow-md transition"
                    >
                      <FaEdit /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(test.id)}
                      className="flex-1 flex items-center justify-center gap-2
                                 bg-red-500 hover:bg-red-600 text-white
                                 px-4 py-2 rounded-xl shadow-md transition"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center gap-1"
          >
            <FaChevronLeft /> Prev
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-4 py-2 rounded-lg ${
                  page === pageNum
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center gap-1"
          >
            Next <FaChevronRight />
          </button>
        </div>
      )}

      {/* FLOATING ADD BUTTON */}
      <button
        onClick={handleAddCourse}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700
                   text-white rounded-full p-5 shadow-2xl
                   transition active:scale-90"
        title="Add New Test"
      >
        <FaPlus size={22} />
      </button>
    </div>
  );
}
