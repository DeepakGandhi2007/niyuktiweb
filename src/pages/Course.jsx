import React, { useEffect, useState } from "react";
import { FaEdit, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_BASE_URL; // e.g. http://localhost:5000

export default function Course() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch all courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_URL}/api/course/list`);
        const data = await res.json();
        console.log(data, "data")


        if (!res.ok) throw new Error(data?.error || "Failed to fetch courses");

        setCourses(Array.isArray(data.courses) ? data.courses : []);
      } catch (err) {
        console.error("Error loading courses:", err);
        setCourses([]);
        console.log(courses, "data")

      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEdit = (courseId) => {
    navigate(`/course/edit/${courseId}`);
  };

  const handleAddCourse = () => {
    navigate("/course/add");
  };
const handleCopy = async (courseId) => {
  const newName = prompt("Enter new course name:");
  if (!newName) return;

  const res = await fetch(`${API_URL}/api/course/copy/${courseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newName }),
  });

  const data = await res.json();
  if (data.success) {
    alert("Course copied successfully!");
    window.location.reload();
  } else {
    alert("Copy failed");
  }
};

  return (
    <div className="relative p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Courses</h1>

      {loading ? (
        <div className="text-center text-gray-500 text-lg">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="text-center text-gray-500 text-lg">No courses found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 relative"
            >
              {/* Edit button */}
              <button
                onClick={() => handleEdit(course.id)}
                className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-blue-600 hover:text-white transition"
              >
                <FaEdit size={16} />
              </button>
                  <button
                    onClick={() => handleCopy(course.id)}
                    className="absolute top-2 left-2 bg-white p-2 rounded-full shadow-md hover:bg-green-600 hover:text-white transition"
                  >
                    ⧉
                  </button>

              <img
                src={course.thumbnail_url || "https://via.placeholder.com/400x200?text=No+Image"}
                alt={course.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-1">{course.name}</h2>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {course.shortDesc || "No description available."}
                </p>

                {/* ✅ Price section */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    {course.discountPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold text-lg">
                          ₹{course.discountPrice}
                        </span>
                        <span className="text-gray-400 line-through text-sm">
                          ₹{course.price}
                        </span>
                      </div>
                    ) : (
                      <span className="text-blue-600 font-bold text-lg">
                        ₹{course.price}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={handleAddCourse}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 flex items-center justify-center"
      >
        <FaPlus size={20} />
      </button>
    </div>
  );
}

