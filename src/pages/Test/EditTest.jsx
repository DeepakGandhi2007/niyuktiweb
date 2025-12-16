import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JoditEditor from "jodit-react";
import MathRenderer from "../../util/MathRenderer.jsx";

const API_URL = import.meta.env.VITE_API_BASE_URL;

/* ---------- helpers ---------- */

const stripHtml = (html = "") =>
  html
    .replace(/<\/?(strong|b|em|i|p)>/gi, "")
    .replace(/<\/?span[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .trim();

const uploadImageToR2 = async (file) => {
  const res = await fetch(`${API_URL}/api/upload/presigned-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
    }),
  });

  const { uploadUrl, fileUrl } = await res.json();

  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  return fileUrl;
};

/* ================= COMPONENT ================= */

export default function EditTest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [courseId, setCourseId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [instructions, setInstructions] = useState("");

  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    const fetchAll = async () => {
      const [testRes, courseRes] = await Promise.all([
        fetch(`${API_URL}/api/test/${id}`),
        fetch(`${API_URL}/api/course/list`),
      ]);

      const testData = await testRes.json();
      const courseData = await courseRes.json();

      setCourseId(testData.course_id);
      setThumbnailUrl(testData.thumbnail);
      setInstructions(testData.instructions);

      setQuestions(
        testData.questions.map((q) => ({
          ...q,
          question: stripHtml(q.question),
          optionA: stripHtml(q.optionA),
          optionB: stripHtml(q.optionB),
          optionC: stripHtml(q.optionC),
          optionD: stripHtml(q.optionD),
        }))
      );

      setCourses(courseData.courses || courseData);
      setLoading(false);
    };

    fetchAll();
  }, [id]);

  /* ---------- handlers ---------- */

  const handleChange = (i, field, value) => {
    const updated = [...questions];
    updated[i][field] = value;
    setQuestions(updated);
  };

  const handleImageChange = async (i, field, file) => {
    if (!file) return;
    const url = await uploadImageToR2(file);
    handleChange(i, field, url);
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUrl(await uploadImageToR2(file));
  };

  const handleSave = async () => {
    setSaving(true);

    const res = await fetch(`${API_URL}/api/test/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        thumbnailUrl,
        instructions,
        questions,
      }),
    });

    const data = await res.json();

    if (!res.ok) alert(data.error || "Update failed");
    else {
      alert("✅ Test updated");
      navigate("/Test");
    }

    setSaving(false);
  };

  if (loading) return <p className="p-8">Loading...</p>;

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        ✏️ Edit Test #{id}
      </h1>

      {/* Course */}
      <select
        className="w-full border p-3 mb-4"
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Thumbnail */}
      <img src={thumbnailUrl} className="w-full h-48 object-cover mb-2" />
      <input type="file" accept="image/*" onChange={handleThumbnailUpload} />

      {/* Instructions */}
      <div className="mt-4">
        <JoditEditor value={instructions} onChange={setInstructions} />
      </div>

      {/* Questions */}
      <div className="space-y-6 mt-6">
        {questions.map((q, i) => (
          <div key={q.id} className="border p-4 rounded">

            {/* QUESTION PREVIEW */}
            <div className="bg-gray-100 p-3 rounded mb-3">
              {q.question_image && (
                <img src={q.question_image} className="max-w-xs mb-2" />
              )}
              <MathRenderer text={q.question} />
            </div>

            {/* QUESTION EDIT */}
            <input
              className="w-full border p-2 mb-2"
              value={q.question}
              onChange={(e) => handleChange(i, "question", e.target.value)}
            />

            {/* QUESTION IMAGE REPLACE (ONLY IF EXISTS) */}
            {q.question_image && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageChange(i, "question_image", e.target.files[0])
                }
              />
            )}

            {/* OPTIONS */}
            {["optionA", "optionB", "optionC", "optionD"].map((opt) => (
              <div key={opt} className="mt-4">

                <MathRenderer text={q[opt]} />

                <input
                  className="w-full border p-2 mt-1"
                  value={q[opt]}
                  onChange={(e) => handleChange(i, opt, e.target.value)}
                />

                {/* OPTION IMAGE PREVIEW + REPLACE ONLY IF EXISTS */}
                {q[`${opt}_image`] && (
                  <>
                    <img
                      src={q[`${opt}_image`]}
                      className="max-w-xs mt-2 mb-1"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(i, `${opt}_image`, e.target.files[0])
                      }
                    />
                  </>
                )}
              </div>
            ))}

            {/* ANSWER & MARKS */}
            <input
              className="w-full border p-2 mt-3"
              value={q.correctAnswer}
              onChange={(e) =>
                handleChange(i, "correctAnswer", e.target.value)
              }
              placeholder="Correct Answer"
            />

            <div className="grid grid-cols-2 gap-2 mt-2">
              <input
                className="border p-2"
                value={q.positiveMarks}
                onChange={(e) =>
                  handleChange(i, "positiveMarks", e.target.value)
                }
                placeholder="+ Marks"
              />
              <input
                className="border p-2"
                value={q.negativeMarks}
                onChange={(e) =>
                  handleChange(i, "negativeMarks", e.target.value)
                }
                placeholder="- Marks"
              />
            </div>

          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 mt-6 rounded"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
