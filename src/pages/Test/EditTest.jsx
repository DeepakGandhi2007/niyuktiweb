import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JoditEditor from "jodit-react";
import MathRenderer from "../../util/MathRenderer.jsx";
import mammoth from "mammoth";

const API_URL = import.meta.env.VITE_API_BASE_URL;

/* ---------- helpers ---------- */

const stripHtml = (html = "") =>
  html
    .replace(/<\/?(strong|b|em|i|p)>/gi, "")
    .replace(/<\/?span[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .trim();
const extractTextAndImage = (html = "") => {
  if (!html) return { text: "", image: null };

  const doc = new DOMParser().parseFromString(html, "text/html");
  const img = doc.querySelector("img");

  const image = img ? img.getAttribute("src") : null;
  if (img) img.remove();

  const text = doc.body.innerHTML
    .replace(/<\/?p[^>]*>/gi, "")
    .replace(/<\/?span[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "")
    .trim();

  return { text, image };
};


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
const uploadBase64ToR2 = async (base64) => {
  if (!base64.startsWith("data:image")) return null;

  const res = await fetch(base64);
  const blob = await res.blob();

  const file = new File(
    [blob],
    `docx-${Date.now()}.${blob.type.split("/")[1]}`,
    { type: blob.type }
  );

  return await uploadImageToR2(file);
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
  const [showDocxModal, setShowDocxModal] = useState(false);
  const [docxQuestions, setDocxQuestions] = useState([]);
  const [docxParsingError, setDocxParsingError] = useState("");
  const [savingDocx, setSavingDocx] = useState(false);

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

  const handleDocxUpload = async (file) => {
    setDocxParsingError("");
    setDocxQuestions([]);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const table = doc.querySelector("table");

        if (!table) throw new Error("No table found in DOCX");

        const rows = Array.from(table.querySelectorAll("tr"));
        const extracted = [];

        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll("td");
          if (cells.length < 8) continue;

          const q = extractTextAndImage(cells[0].innerHTML);
          const a = extractTextAndImage(cells[1].innerHTML);
          const b = extractTextAndImage(cells[2].innerHTML);
          const c = extractTextAndImage(cells[3].innerHTML);
          const d = extractTextAndImage(cells[4].innerHTML);
          const s = extractTextAndImage(cells[7]?.innerHTML || "");

          extracted.push({
            question: q.text,
            question_image: q.image,

            optionA: a.text,
            optionA_image: a.image,

            optionB: b.text,
            optionB_image: b.image,

            optionC: c.text,
            optionC_image: c.image,

            optionD: d.text,
            optionD_image: d.image,

            correctAnswer: cells[5].innerText.trim(),
            category: cells[6]?.innerText?.trim() || "",

            solution: s.text,
            solution_image: s.image,
          });

        }

        if (!extracted.length) {
          throw new Error("No questions found in DOCX");
        }

        setDocxQuestions(extracted);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      setDocxParsingError(err.message);
    }
  };

  const handleSaveDocxQuestions = async () => {
    setSavingDocx(true);

    try {
      const finalQuestions = [];

      for (const q of docxQuestions) {
        finalQuestions.push({
          ...q,

          question_image: q.question_image
            ? await uploadBase64ToR2(q.question_image)
            : null,

          optionA_image: q.optionA_image
            ? await uploadBase64ToR2(q.optionA_image)
            : null,

          optionB_image: q.optionB_image
            ? await uploadBase64ToR2(q.optionB_image)
            : null,

          optionC_image: q.optionC_image
            ? await uploadBase64ToR2(q.optionC_image)
            : null,

          optionD_image: q.optionD_image
            ? await uploadBase64ToR2(q.optionD_image)
            : null,

          solution_image: q.solution_image
            ? await uploadBase64ToR2(q.solution_image)
            : null,
        });
      }

      const res = await fetch(`${API_URL}/api/test/${id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: finalQuestions }),
      });

      if (!res.ok) throw new Error("Failed to save DOCX questions");

      alert("✅ Questions added successfully");
      window.location.reload();

    } catch (err) {
      alert(err.message);
    } finally {
      setSavingDocx(false);
    }
  };

  if (loading) return <p className="p-8">Loading...</p>;

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        ✏️ Edit Test #{id}
      </h1>



      {/* ================= THUMBNAIL ================= */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-lg mb-3">Test Thumbnail</h3>

        <img
          src={thumbnailUrl}
          className="w-full h-48 object-cover rounded-lg border mb-3"
          alt="Thumbnail"
        />

        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4
               file:rounded-md file:border-0
               file:text-sm file:font-semibold
               file:bg-blue-50 file:text-blue-600
               hover:file:bg-blue-100"
          onChange={handleThumbnailUpload}
        />
      </div>

      {/* ================= INSTRUCTIONS ================= */}
      <div className="bg-white rounded-xl shadow-sm p-4 mt-6">
        <h3 className="font-semibold text-lg mb-3">Instructions</h3>
        <JoditEditor value={instructions} onChange={setInstructions} />
      </div>

      {/* ================= QUESTIONS ================= */}
      <div className="space-y-8 mt-8">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-5"
          >
            {/* QUESTION PREVIEW */}
            <div className="bg-gray-50 border rounded-lg p-4 mb-4">
              {q.question_image && (
                <img
                  src={q.question_image}
                  className="max-w-xs mb-3 rounded border"
                  alt="Question"
                />
              )}
              <MathRenderer text={q.question} />
            </div>

            {/* QUESTION INPUT */}
            <input
              className="w-full border rounded-md p-2 mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={q.question}
              onChange={(e) => handleChange(i, "question", e.target.value)}
              placeholder="Edit Question"
            />

            {/* QUESTION IMAGE REPLACE */}
            {q.question_image && (
              <input
                type="file"
                accept="image/*"
                className="mb-4 text-sm"
                onChange={(e) =>
                  handleImageChange(i, "question_image", e.target.files[0])
                }
              />
            )}

            {/* OPTIONS */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {["optionA", "optionB", "optionC", "optionD"].map((opt) => (
                <div key={opt} className="border rounded-lg p-3">
                  <MathRenderer text={q[opt]} />

                  <input
                    className="w-full border rounded-md p-2 mt-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={q[opt]}
                    onChange={(e) => handleChange(i, opt, e.target.value)}
                    placeholder={`Edit ${opt}`}
                  />

                  {q[`${opt}_image`] && (
                    <div className="mt-2">
                      <img
                        src={q[`${opt}_image`]}
                        className="max-w-xs rounded border mb-1"
                        alt={opt}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="text-sm"
                        onChange={(e) =>
                          handleImageChange(
                            i,
                            `${opt}_image`,
                            e.target.files[0]
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ANSWER & CATEGORY */}
            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <input
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                value={q.correctAnswer}
                onChange={(e) =>
                  handleChange(i, "correctAnswer", e.target.value)
                }
                placeholder="Correct Answer"
              />

              <input
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                value={q.category || ""}
                onChange={(e) => handleChange(i, "category", e.target.value)}
                placeholder="Category (e.g. Maths)"
              />
            </div>

            {/* SOLUTION */}
            <div className="mt-5 border-t pt-4">
              <h4 className="font-semibold mb-2">Solution</h4>

              {q.solution_image ? (
                <>
                  <img
                    src={q.solution_image}
                    className="max-w-xs rounded border mb-2"
                    alt="Solution"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    className="text-sm"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      const url = await uploadImageToR2(file);
                      handleChange(i, "solution_image", url);
                    }}
                  />
                </>
              ) : (
                <textarea
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  value={q.solution || ""}
                  onChange={(e) => handleChange(i, "solution", e.target.value)}
                  placeholder="Solution / Explanation"
                />
              )}
            </div>
          </div>
        ))}
      </div>


      <button
        type="button"
        className="w-full bg-gray-700 text-white py-3 mt-4 rounded"
        onClick={() => setShowDocxModal(true)}
      >
        ➕ Add More Questions (DOCX)
      </button>


      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 mt-6 rounded"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
      {showDocxModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl p-6 rounded-lg shadow-xl">

            <h2 className="text-xl font-bold mb-4">Add Questions from DOCX</h2>

            <input
              type="file"
              accept=".docx"
              onChange={(e) => handleDocxUpload(e.target.files[0])}
            />

            {docxParsingError && (
              <p className="text-red-600 mt-2">{docxParsingError}</p>
            )}

            {docxQuestions.length > 0 && (
              <div className="mt-4 max-h-80 overflow-auto border rounded">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 border">Q</th>
                      <th className="p-2 border">A</th>
                      <th className="p-2 border">B</th>
                      <th className="p-2 border">C</th>
                      <th className="p-2 border">D</th>
                      <th className="p-2 border">Ans</th>
                      <th className="p-2 border">Category</th>
                      <th className="p-2 border">Solution</th>
                    </tr>
                  </thead>

                  <tbody>
                    {docxQuestions.map((q, i) => (
                      <tr key={i} className="align-top bg-white border-b">

                        {/* QUESTION */}
                        <td className="p-2 border space-y-2">
                          {q.question_image && (
                            <img
                              src={q.question_image}
                              className="max-w-[120px] mb-1"
                              alt="Q"
                            />
                          )}
                          <MathRenderer text={q.question} />
                        </td>

                        {/* OPTION A */}
                        <td className="p-2 border space-y-2">
                          {q.optionA_image && (
                            <img src={q.optionA_image} className="max-w-[120px]" />
                          )}
                          <MathRenderer text={q.optionA} />
                        </td>

                        {/* OPTION B */}
                        <td className="p-2 border space-y-2">
                          {q.optionB_image && (
                            <img src={q.optionB_image} className="max-w-[120px]" />
                          )}
                          <MathRenderer text={q.optionB} />
                        </td>

                        {/* OPTION C */}
                        <td className="p-2 border space-y-2">
                          {q.optionC_image && (
                            <img src={q.optionC_image} className="max-w-[120px]" />
                          )}
                          <MathRenderer text={q.optionC} />
                        </td>

                        {/* OPTION D */}
                        <td className="p-2 border space-y-2">
                          {q.optionD_image && (
                            <img src={q.optionD_image} className="max-w-[120px]" />
                          )}
                          <MathRenderer text={q.optionD} />
                        </td>

                        {/* ANSWER */}
                        <td className="p-2 border font-bold text-center">
                          {q.correctAnswer}
                        </td>

                        {/* CATEGORY */}
                        <td className="p-2 border">
                          {q.category || "-"}
                        </td>

                        {/* SOLUTION */}
                        <td className="p-2 border space-y-2">
                          {q.solution_image && (
                            <img src={q.solution_image} className="max-w-[120px]" />
                          )}
                          <MathRenderer text={q.solution} />
                        </td>

                      </tr>
                    ))}
                  </tbody>


                </table>
              </div>
            )}



            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowDocxModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveDocxQuestions}
                disabled={savingDocx || !docxQuestions.length}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {savingDocx ? "Saving..." : "Save Questions"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );
}
