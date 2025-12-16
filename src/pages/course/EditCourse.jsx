// src/pages/EditCourse.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FaImage } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import CourseStructureModal from "../../components/CourseStructureModal.jsx";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  // NOTE: all hooks must be declared before any conditional return
  const [loading, setLoading] = useState(true);

  // course fields
  const [courseName, setCourseName] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [structureOpen, setStructureOpen] = useState(false);

  const [oldThumb, setOldThumb] = useState("");
  const [thumbFile, setThumbFile] = useState(null);

  const thumbPreview = useMemo(
    () => (thumbFile ? URL.createObjectURL(thumbFile) : oldThumb),
    [thumbFile, oldThumb]
  );

  const [categories, setCategories] = useState([]);

  // load categories
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/category/get-categories`);
        const d = await r.json();
        if (d.success) setCategories(d.categories || []);
      } catch (err) {
        console.error("Category load failed", err);
      }
    })();
  }, []);

  // load course
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/course/details/${id}`);
        const data = await res.json();
        if (!data.success) throw new Error("Failed to load");
        const c = data.course;

        setCourseName(c.name ?? "");
        setPrice(c.price ?? "");
        setDiscountPrice(c.discountPrice ?? "");
        setShortDesc(c.shortDesc ?? "");
        setLongDesc(c.longDesc ?? "");
        // `startDate` and `endDate` from backend should be either a Date string (YYYY-MM-DD) or null
        setStartDate(c.startDate ? formatInputDate(c.startDate) : "");
        setEndDate(c.endDate ? formatInputDate(c.endDate) : "");
        setCategoryId(c.categoryId ?? "");
        setOldThumb(c.thumbnail ?? "");

        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Failed to load course");
      }
    };

    load();
  }, [id]);

  // helper to guarantee YYYY-MM-DD for input[type=date]
  const formatInputDate = (d) => {
    if (!d) return "";
    // if backend returned a Date object string, ensure YYYY-MM-DD
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d; // fallback (if already YYYY-MM-DD)
    return dt.toISOString().split("T")[0];
  };

  // upload to S3 (presigned)
const uploadToR2 = async (file) => {
  const res = await fetch(`${API_URL}/api/upload/presigned-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
    }),
  });

  const out = await res.json();

  await fetch(out.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  return out.fileUrl;
};


  // convert to YYYY-MM-DD or null
  const fmt = (dateStr) => {
    if (!dateStr) return null;
    const dt = new Date(dateStr);
    if (Number.isNaN(dt.getTime())) return dateStr;
    return dt.toISOString().split("T")[0];
  };

  const handleUpdate = async () => {
    try {
      let thumbUrl = oldThumb;

      if (thumbFile) {
        thumbUrl = await uploadToR2(thumbFile);
      }

      const payload = {
        name: courseName,
        price: price || 0,
        discountPrice: discountPrice || 0,
        shortDesc,
        longDesc,
        validity: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
        },
        categoryId: categoryId || null,
        thumbnail: thumbUrl,
      };

      const res = await fetch(`${API_URL}/api/course/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      alert("Course Updated Successfully!");
      navigate("/course");
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Course</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-xl bg-white p-4 shadow-sm">
          <div className="grid gap-4">
            <div>
              <label>Course Name</label>
              <input
                className="w-full border rounded p-2"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Price (₹)</label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div>
                <label>Discount Price (₹)</label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label>Category</label>
              <select
                className="w-full border rounded p-2"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Start Date</label>
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label>End Date</label>
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label>Short Description</label>
              <input
                className="w-full border rounded p-2"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
              />
            </div>

            <div>
              <label>Long Description</label>
              <textarea
                rows="5"
                className="w-full border rounded p-2"
                value={longDesc}
                onChange={(e) => setLongDesc(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleUpdate}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Update Course
            </button>
            <button
              onClick={() => setStructureOpen(true)}
              className="border px-4 py-2 rounded"
            >
              Edit Content
            </button>
          </div>
        </div>

        <div className="border rounded-xl bg-white p-4 shadow-sm">
          <label>Thumbnail</label>

          <img
            src={thumbPreview}
            className="w-full aspect-video border rounded mb-3 object-cover"
            alt="thumb"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbFile(e.target.files[0])}
          />
        </div>
      </div>

      <CourseStructureModal
        open={structureOpen}
        onClose={() => {
          setStructureOpen(false);
        }}
        courseId={id}
      />
    </div>
  );
}
