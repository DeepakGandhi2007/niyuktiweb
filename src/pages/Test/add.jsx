import React, { useState, useEffect, useRef } from "react";
import JoditEditor from "jodit-react";
import mammoth from "mammoth"; // Import mammoth
import MathRenderer from "../../util/MathRenderer.jsx"; // <<< IMPORT MathRenderer
const API_URL = import.meta.env.VITE_API_BASE_URL;


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

  return fileUrl; // ✅ save only this in DB
};

// extract text + image URL from HTML (DOCX output)
const extractTextAndImage = (html = "") => {
  if (!html) return { text: "", image: null };

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const img = doc.querySelector("img");
  const image = img ? img.getAttribute("src") : null;

  // remove image so it doesn't stay in text
  if (img) img.remove();

  const text = doc.body.innerHTML
    .replace(/<\/?p>/gi, "")
    .trim();

  return { text, image };
};
const removeImagesFromHtml = (html = "") => {
  return html.replace(/<img[^>]*>/gi, "").trim();
};


export default function AddTest() {
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [instructions, setInstructions] = useState("");

  // State for the uploaded doc file
  const [docFile, setDocFile] = useState(null);
  const [testName, setTestName] = useState("");
const [categories, setCategories] = useState([]);
const [testCategoryId, setTestCategoryId] = useState("");

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [positiveMarks, setPositiveMarks] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [testTime, setTestTime] = useState(60); // minutes
  const [questionTime, setQuestionTime] = useState(0); // seconds
  // This holds the parsed questions to be sent to DB
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [parsingError, setParsingError] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------------- Fetch Courses ----------------
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await fetch(`${API_URL}/api/course/list`);
        const data = await res.json();
        setCourses(Array.isArray(data.courses) ? data.courses : []);
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);
useEffect(() => {
  fetch(`${API_URL}/api/test-category/get-categories`)
    .then(res => res.json())
    .then(data => setCategories(data.categories || []));
}, []);

  // ---------------- Thumbnail Preview ----------------
  const handleThumbnail = (e) => {
    const file = e.target.files?.[0] ?? null;
    setThumbnail(file);
    setThumbPreview(file ? URL.createObjectURL(file) : "");
  };

  const uploadBase64ToR2 = async (base64) => {
    // convert base64 → Blob
    const res = await fetch(base64);
    const blob = await res.blob();

    const file = new File([blob], `docx-${Date.now()}.png`, {
      type: blob.type,
    });

    return await uploadImageToR2(file); // returns R2 URL
  };


  // ---------------- DOCX Parsing Logic ----------------
  const handleDocx = async (e) => {
    setParsingError("");
    setPreviewQuestions([]);

    const file = e.target.files?.[0];
    if (!file) return;

    setDocFile(file);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;

        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;

        if (!html) throw new Error("Could not read Word file content");

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const table = doc.querySelector("table");

        if (!table) {
          throw new Error("No table found in the Word document. Please put questions in a Table.");
        }


        const cleanContent = (cell) => {
          if (!cell) return "";

          let content = cell.innerText?.trim() || "";

          if (!content && cell.innerHTML) {
            content = cell.innerHTML.replace(/<\/?p>/g, '').trim();
          }


          return cell.innerHTML.replace(/<\/?p>/g, '').trim();
        };

        const rows = Array.from(table.querySelectorAll("tr"));
        if (rows.length < 2) throw new Error("Table is empty or missing headers");

        const extractedQuestions = [];

        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll("td");
          if (cells.length < 8) continue; // Skip malformed rows

          extractedQuestions.push({
            // We stick to cleanHtml(cells[x]?.innerHTML) to capture LaTeX and rich content/non-math text
            question: await cleanContent(cells[0]),
            optionA: await cleanContent(cells[1]),
            optionB: await cleanContent(cells[2]),
            optionC: await cleanContent(cells[3]),
            optionD: await cleanContent(cells[4]),
            correctAnswer: cells[5]?.innerText?.trim() || "",
            category: cleanContent(cells[6]),   // ✅ per question
            solution: cleanContent(cells[7])  
          });
        }

        if (extractedQuestions.length === 0) {
          throw new Error("Could not extract any questions from the table.");
        }

        setPreviewQuestions(extractedQuestions);

      } catch (err) {
        setParsingError(err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };



  const handleSave = async () => {
    if (!thumbnail || !previewQuestions.length) {
      alert("Missing required data");
      return;
    }

    setSaving(true);
    try {
      // upload thumbnail
      const thumbnailUrl = await uploadImageToR2(thumbnail);

      // build final questions payload
      const finalQuestions = [];

      for (const q of previewQuestions) {
        const qData = extractTextAndImage(q.question);
        const aData = extractTextAndImage(q.optionA);
        const bData = extractTextAndImage(q.optionB);
        const cData = extractTextAndImage(q.optionC);
        const dData = extractTextAndImage(q.optionD);
        const sData = extractTextAndImage(q.solution);

        finalQuestions.push({
          question: qData.text,
          question_image: qData.image
            ? await uploadBase64ToR2(qData.image)
            : null,

          optionA: aData.text,
          optionA_image: aData.image
            ? await uploadBase64ToR2(aData.image)
            : null,

          optionB: bData.text,
          optionB_image: bData.image
            ? await uploadBase64ToR2(bData.image)
            : null,

          optionC: cData.text,
          optionC_image: cData.image
            ? await uploadBase64ToR2(cData.image)
            : null,

          optionD: dData.text,
          optionD_image: dData.image
            ? await uploadBase64ToR2(dData.image)
            : null,

          correctAnswer: q.correctAnswer,
          positiveMarks,
          negativeMarks,
          category: q.category,     // ✅ per row
          solution: sData.text,
          solution_image: sData.image
            ? await uploadBase64ToR2(sData.image)
            : null,
        });
      }


      const res = await fetch(`${API_URL}/api/test/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: testName,
          testCategoryId,
          thumbnailUrl,
          instructions,
          testTime,
          questionTime,
          questions: finalQuestions,
        }),
      });

      if (!res.ok) throw new Error("Failed to save test");

      alert("✅ Test created successfully");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };
  const hasImage = (html) => {
    if (!html) return false;
    return /<img\s/i.test(html);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Create Test (Word Upload)</h1>

      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
      <div>
        <label className="font-semibold block mb-1">Test Category</label>
        <select
          className="w-full border p-2 rounded"
          value={testCategoryId}
          onChange={(e) => setTestCategoryId(e.target.value)}
        >
          <option value="">-- Select Category --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

        {/* Course & Thumb */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input
            className="w-full border p-2 rounded mb-3"
            placeholder="Test Name"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
          />

          <div>
            <label className="font-semibold block mb-1">Thumbnail</label>
            <input type="file" onChange={handleThumbnail} />
          </div>
        </div>
        <div className="mt-4">
          <label className="font-bold">Instructions</label>
          <JoditEditor value={instructions} onChange={setInstructions} />
        </div>

        {/* Settings */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <input type="number" value={positiveMarks} onChange={(e) => setPositiveMarks(e.target.value)} placeholder="Positive Marks" className="border p-2" />
          <input type="number" value={negativeMarks} onChange={(e) => setNegativeMarks(e.target.value)} placeholder="Negative Marks" className="border p-2" />
          <input type="number" value={testTime} onChange={(e) => setTestTime(e.target.value)} placeholder="Test Time (min)" className="border p-2" />
          <input type="number" value={questionTime} onChange={(e) => setQuestionTime(e.target.value)} placeholder="Question Time (sec)" className="border p-2" />
        </div>
        {/* DOCX Upload */}
        <div className="border-t pt-4">
          <label className="font-bold text-lg block mb-2">Upload Question Paper (.docx)</label>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 text-sm">
            <p className="font-bold">⚠️ Formatting Requirement:</p>
            <p>Your Word file must contain a <strong>Table</strong> with these columns in order:</p>
            <p>1. Question | 2. Option A | 3. Option B | 4. Option C | 5. Option D | 6. Correct Ans (A/B/C/D) | 7. Marks</p>
          </div>

          <input
            type="file"
            accept=".docx"
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={handleDocx}
          />
          {parsingError && <p className="text-red-500 mt-2 font-medium">{parsingError}</p>}
        </div>

        {/* Preview Section (NOW USING MathRenderer) */}
        {previewQuestions.length > 0 && (
          <div className="border rounded bg-gray-50 p-4">
            <h3 className="font-bold mb-2">Preview ({previewQuestions.length} Questions) - Math is now rendered!</h3>
            <div className="overflow-auto max-h-60">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-200">
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
                  {previewQuestions.map((q, i) => (
                    <tr key={i} className="bg-white border-b">

                      {/* KEY CHANGE: Use MathRenderer on question content */}
                      <td className="p-2 border space-y-2">
                        {/* 1️⃣ Render IMAGE + NORMAL TEXT */}
                        {hasImage(q.question) && (
                          <div
                            className="max-w-xs"
                            dangerouslySetInnerHTML={{ __html: q.question }}
                          />
                        )}
                        <MathRenderer text={removeImagesFromHtml(q.question)} />

                        {/* 2️⃣ Render ONLY math */}
                      </td>


                      {/* KEY CHANGE: Use MathRenderer on option content */}
                      <td className="p-2 border space-y-2">
                        {hasImage(q.optionA) && (
                          <div
                            className="max-w-xs"
                            dangerouslySetInnerHTML={{ __html: q.optionA }}
                          />
                        )}
                        <MathRenderer text={removeImagesFromHtml(q.optionA)} />

                      </td>
                      <td className="p-2 border space-y-2">
                        {hasImage(q.optionB) && (
                          <div
                            className="max-w-xs"
                            dangerouslySetInnerHTML={{ __html: q.optionB }}
                          />
                        )}
                        <MathRenderer text={removeImagesFromHtml(q.optionB)} />

                      </td>

                      <td className="p-2 border space-y-2">
                        {hasImage(q.optionC) && (
                          <div
                            className="max-w-xs"
                            dangerouslySetInnerHTML={{ __html: q.optionC }}
                          />
                        )}
                        <MathRenderer text={removeImagesFromHtml(q.optionC)} />

                      </td>

                      <td className="p-2 border space-y-2">
                        {hasImage(q.optionD) && (
                          <div
                            className="max-w-xs"
                            dangerouslySetInnerHTML={{ __html: q.optionD }}
                          />
                        )}
                        <MathRenderer text={removeImagesFromHtml(q.optionD)} />

                      </td>


                      <td className="p-2 border font-bold">{q.correctAnswer}</td>
                     <td className="p-2 border font-bold">  {hasImage(q.category) && (
                          <div
                            className="max-w-xs"
                            dangerouslySetInnerHTML={{ __html: q.category }}
                          />
                        )}
                        <MathRenderer text={removeImagesFromHtml(q.category)} /></td>
                        <td className="p-2 border font-bold">  {hasImage(q.solution) && (
                          <div
                            className="max-w-xs"
                            dangerouslySetInnerHTML={{ __html: q.solution }}
                          />
                        )}
                        <MathRenderer text={removeImagesFromHtml(q.solution)} /></td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
          {saving ? "Saving..." : "Save Test"}
        </button>
      </div>
    </div>
  );
}