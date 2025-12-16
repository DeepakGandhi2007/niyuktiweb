// src/pages/AddCourse.jsx
import React, { useMemo, useState, useEffect } from "react";
import { FaPlus, FaImage, FaUpload } from "react-icons/fa";
import FileManagerPicker from "../../components/FileManagerPicker.jsx";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const emptyTree = () => [];

export default function AddCourse() {
    /* ---------------------- COURSE FIELDS ---------------------- */
    const [courseName, setCourseName] = useState("");
    const [price, setPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [shortDesc, setShortDesc] = useState("");
    const [longDesc, setLongDesc] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [categoryId, setCategoryId] = useState("");

    /* ------------------------- THUMBNAIL ------------------------ */
    const [thumbFile, setThumbFile] = useState(null);
    const thumbPreview = useMemo(
        () => (thumbFile ? URL.createObjectURL(thumbFile) : ""),
        [thumbFile]
    );

    /* ---------------------- CATEGORY LIST ---------------------- */
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/api/category/get-categories`);
            const data = await res.json();
            if (data.success) setCategories(data.categories || []);
        } catch (err) {
            console.log("Category fetch failed", err);
        }
    };

    /* ---------------------- SECTION TREES ---------------------- */
    const [tab, setTab] = useState("syllabus");
    const [syllabusTree, setSyllabusTree] = useState(emptyTree());
    const [mockTree, setMockTree] = useState(emptyTree());
    const [niyuktiTree, setNiyuktiTree] = useState(emptyTree());

    const currentTree =
        tab === "syllabus"
            ? syllabusTree
            : tab === "mock"
                ? mockTree
                : niyuktiTree;

    const setCurrentTree =
        tab === "syllabus"
            ? setSyllabusTree
            : tab === "mock"
                ? setMockTree
                : setNiyuktiTree;

    /* ---------------------- FILE PICKER ---------------------- */
    const [pickerOpen, setPickerOpen] = useState(false);

    /** FIX: picker nodes must match AddCourse tree structure */
    const appendSelectedToCurrent = (pickedNodes) => {
        if (!pickedNodes?.length) return;

        const convert = (node) => ({
            id: node.id,
            type: node.type,
            name: node.name,
            fileType: node.file_type,
            fileUrl: node.file_url,
            thumbnailUrl: node.thumbnail_url,
            children: node.children?.map(convert) || [],
        });

        const ready = pickedNodes.map(convert);

        setCurrentTree((prev) => [...prev, ...ready]);
    };

    /* ---------------------- UPLOAD THUMBNAIL ---------------------- */
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

        return {
            file_url: out.fileUrl,
            file_type: file.type,
            key: out.key
        };
        };

    /* ---------------------- SAVE COURSE ---------------------- */
    const handleSaveCourse = async () => {
        try {
            let thumbUrl = null;

                if (thumbFile) {
                    const uploaded = await uploadToR2(thumbFile);
                    thumbUrl = uploaded.file_url;   // <--- FIXED
                }
            const payload = {
                name: courseName,
                price: price || 0,
                discountPrice: discountPrice || 0,
                validity: { startDate, endDate },
                shortDesc,
                longDesc,
                thumbnail: thumbUrl,
                syllabus: syllabusTree,
                mockTest: mockTree,
                niyuktiPlan: niyuktiTree,
                categoryId: categoryId || null,
            };

            const res = await fetch(`${API_URL}/api/course/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to save");

            alert("Course Saved Successfully!");
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    /* ---------------------- RESET ---------------------- */
    const resetAll = () => {
        setCourseName("");
        setPrice("");
        setDiscountPrice("");
        setShortDesc("");
        setLongDesc("");
        setStartDate("");
        setEndDate("");
        setCategoryId("");
        setThumbFile(null);
        setSyllabusTree([]);
        setMockTree([]);
        setNiyuktiTree([]);
    };

    /* ---------------------- RENDER ---------------------- */
    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Add Course</h1>

            {/* ---------------------- COURSE FORM ---------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 border rounded-xl bg-white p-4 shadow-sm">
                    <div className="grid gap-4">
                        {/* Name + Price */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label>Course Name</label>
                                <input
                                    className="w-full border rounded p-2"
                                    value={courseName}
                                    onChange={(e) => setCourseName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Price (₹)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded p-2"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                            </div>
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


                        {/* Category */}
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

                        {/* Validity */}
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

                        {/* Description */}
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
                            onClick={handleSaveCourse}
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Save Course
                        </button>

                        <button
                            onClick={resetAll}
                            className="border px-4 py-2 rounded"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* ---------------------- THUMBNAIL ---------------------- */}
                <div className="border rounded-xl bg-white p-4 shadow-sm">
                    <label>Thumbnail</label>

                    {thumbPreview ? (
                        <img
                            src={thumbPreview}
                            className="w-full aspect-video border rounded mb-3 object-cover"
                        />
                    ) : (
                        <div className="w-full h-40 border rounded mb-3 flex items-center justify-center text-gray-500">
                            <FaImage className="text-3xl" />
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setThumbFile(e.target.files[0])}
                    />
                </div>
            </div>

            {/* ---------------------- SECTION STRUCTURES ---------------------- */}
            <div className="mt-8">
                <div className="flex gap-2">
                    {["syllabus", "mock", "niyukti"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-full border ${tab === t ? "bg-blue-600 text-white" : ""
                                }`}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="border rounded-xl bg-white p-4 mt-4">
                    <div className="flex justify-between mb-3">
                        <h3 className="font-semibold">Section Items</h3>

                        <button
                            onClick={() => setPickerOpen(true)}
                            className="px-3 py-1.5 border rounded inline-flex items-center gap-2"
                        >
                            <FaUpload />
                            Add From File Manager
                        </button>
                    </div>

                    {currentTree.length === 0 ? (
                        <p className="text-gray-500">No items added yet.</p>
                    ) : (
                        <TreePreview tree={currentTree} />
                    )}
                </div>
            </div>

            {/* ---------------------- PICKER MODAL ---------------------- */}
            <FileManagerPicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(selectedNodes) => appendSelectedToCurrent(selectedNodes)}
            />
        </div>
    );
}

/* -------- Tree Preview UI -------- */
function TreePreview({ tree, level = 0 }) {
    return (
        <div className="space-y-2">
            {tree.map((node) => (
                <div
                    key={node.id}
                    className="flex items-start gap-3 p-2 border rounded"
                >
                    <div style={{ marginLeft: level * 12 }}>
                        {node.type === "folder" ? "📁" : "📄"}
                    </div>

                    <div className="flex-1">
                        <div className="font-medium">{node.name}</div>

                        {node.type === "file" && node.fileUrl && (
                            <div className="text-xs text-gray-500">
                                {node.fileUrl}
                            </div>
                        )}

                        {node.children?.length > 0 && (
                            <div className="mt-2 ml-4">
                                <TreePreview tree={node.children} level={level + 1} />
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
