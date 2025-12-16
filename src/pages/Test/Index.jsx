import React, { useEffect, useState } from "react";
import { FaEdit, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function Test() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleAddCourse = () => navigate("/Test/add");

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`${API_URL}/api/test/list`);
        const data = await res.json();
        if (res.ok) setTests(data || []);
      } catch (err) {
        console.error("Error loading test list:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  return (
    <div className="relative p-8 min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Page Title */}
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">
        📘 Our Tests
      </h1>

      {loading ? (
        <p className="text-center text-gray-500">Loading tests...</p>
      ) : tests.length === 0 ? (
        <p className="text-center text-gray-500">No tests found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tests.map((test) => (
            <div
              key={test.id}
              className="rounded-xl shadow-xl bg-white/70 backdrop-blur-md border border-gray-200 overflow-hidden transform hover:scale-[1.03] transition-all duration-300 hover:shadow-2xl"
            >
              {/* Image */}
              <div className="overflow-hidden">
                <img
                  src={test.thumbnail}
                  alt="Test Thumbnail"
                  className="w-full h-44 object-cover transition duration-300 hover:scale-105"
                />
              </div>

              <div className="p-5">
                {/* Course Name */}
                <h2 className="font-semibold text-xl text-gray-800 mb-1">
                  {test.course_name || "Unknown Course"}
                </h2>

                {/* Question Count */}
                <p className="text-gray-600 text-sm">
                  📝 Questions:{" "}
                  <span className="font-semibold text-gray-800">
                    {test.question_count}
                  </span>
                </p>

                {/* Edit Button */}
                <button
                  onClick={() => navigate(`/Test/edit/${test.id}`)}
                  className="mt-5 w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-300"
                >
                  <FaEdit /> Edit Test
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={handleAddCourse}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-5 shadow-xl transition-all duration-300 flex items-center justify-center active:scale-90"
        style={{ boxShadow: "0 8px 25px rgba(0,0,0,0.25)" }}
      >
        <FaPlus size={22} />
      </button>
    </div>
  );
}
