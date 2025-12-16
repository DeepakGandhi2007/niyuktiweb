import React, { useState, useEffect } from "react";

export default function FileUploadModal({ open, onClose, onUpload, parentId }) {
  const [fileType, setFileType] = useState("pdf");
  const [name, setName] = useState("");

  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);

  const [existingFiles, setExistingFiles] = useState([]);
  const [selectedExisting, setSelectedExisting] = useState(null);

  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState([{ label: "", t: "" }]);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (open) loadExisting();
  }, [open]);

  const loadExisting = async () => {
    const res = await fetch(`${API_URL}/api/upload/existing`);
    const data = await res.json();
    setExistingFiles(data);
  };

  const uploadToR2 = async (file) => {
    const pres = await fetch(`${API_URL}/api/upload/presigned-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    const out = await pres.json();

    await fetch(out.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    return out.fileUrl;
  };

  const convertTime = (val) => {
    if (!val) return 0;
    if (String(val).includes(":")) {
      const [m, s] = val.split(":").map(Number);
      return m * 60 + s;
    }
    return Number(val);
  };

  const submit = async () => {
    if (!name.trim()) return alert("Enter a file name");
    setLoading(true);

    let fileUrl = null;
    let thumbnailUrl = null;

    // reuse file
    if (selectedExisting) {
      fileUrl = selectedExisting.file_url;
      thumbnailUrl = selectedExisting.thumbnail_url;
    } else {
      // upload new file
      if (file) {
        fileUrl = await uploadToR2(file);
      }
      if (thumbnail) {
        thumbnailUrl = await uploadToR2(thumbnail);
      }
    }
    const chapterPayload =
      fileType === "video"
        ? chapters
          .filter((c) => c.label.trim() && c.start && c.end)
          .map((c) => ({
            label: c.label,
            start: convertTime(c.start),
            end: convertTime(c.end),
          }))
        : null;

    await fetch(`${API_URL}/api/upload/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId,
        name,
        fileType,
        fileUrl,
        thumbnailUrl,
        chapters: chapterPayload,
      }),
    });

    setLoading(false);
    onClose();
    onUpload();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded-lg">
        <div className="border-b p-4 flex justify-between">
          <h3 className="font-semibold">Upload File</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="p-4 space-y-4">
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="w-full border px-3 py-2 rounded"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          >
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
          </select>

          {/* Existing files */}
          <div className="border p-2 rounded max-h-40 overflow-y-auto">
            <p className="font-medium text-sm mb-1">Reuse Existing File</p>

            {existingFiles.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedExisting(f)}
                className={`p-2 border rounded mb-1 cursor-pointer ${selectedExisting?.id === f.id ? "bg-blue-100" : ""
                  }`}
              >
                <div className="flex items-center">
                  {f.thumbnail_url ? (
                    <img src={f.thumbnail_url} className="w-8 h-8 rounded mr-2" />
                  ) : (
                    <span className="text-xs text-gray-500 mr-2">No thumb</span>
                  )}

                  <div>
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs text-gray-500">{f.file_type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* NEW: Chapters appear only for video & when uploading new file */}
          {fileType === "video" && (
            <div className="border p-3 rounded">
              <p className="font-semibold mb-2">Video Chapters / Timeframes</p>

              {chapters.map((ch, index) => (
                <div key={index} className="flex gap-2 mb-2">

                  {/* Label */}
                  <input
                    className="border px-2 py-1 rounded flex-1"
                    placeholder="Label (Intro, Part 1...)"
                    value={ch.label}
                    onChange={(e) => {
                      const updated = [...chapters];
                      updated[index].label = e.target.value;
                      setChapters(updated);
                    }}
                  />

                  {/* Start time */}
                  <input
                    className="border px-2 py-1 rounded w-28"
                    placeholder="Start (mm:ss)"
                    value={ch.start}
                    onChange={(e) => {
                      const updated = [...chapters];
                      updated[index].start = e.target.value;
                      setChapters(updated);
                    }}
                  />

                  {/* End time */}
                  <input
                    className="border px-2 py-1 rounded w-28"
                    placeholder="End (mm:ss)"
                    value={ch.end}
                    onChange={(e) => {
                      const updated = [...chapters];
                      updated[index].end = e.target.value;
                      setChapters(updated);
                    }}
                  />

                  {/* Delete button */}
                  <button
                    className="px-2 bg-red-500 text-white rounded"
                    onClick={() =>
                      setChapters(chapters.filter((_, i) => i !== index))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                className="px-3 py-1 bg-gray-200 rounded"
                onClick={() =>
                  setChapters([...chapters, { label: "", start: "", end: "" }])
                }
              >
                + Add Chapter
              </button>
            </div>
          )}


          {!selectedExisting && (
            <>
              <div>
                <label className="block text-sm mb-1">Upload New File</label>
                <input
                  type="file"
                  accept={
                    fileType === "pdf"
                      ? "application/pdf"
                      : fileType === "video"
                        ? "video/*"
                        : "audio/*"
                  }
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                />
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-4 py-2 border" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white" onClick={submit}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
