import React, { useEffect, useState } from "react";
import FileManagerPicker from "./FileManagerPicker.jsx";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function CourseStructureModal({ open, onClose, courseId }) {
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState({ syllabus: [], mock: [], niyukti: [] });
    const [tab, setTab] = useState("syllabus");
    const [pickerOpen, setPickerOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadParent, setUploadParent] = useState(null);
    const [uploadName, setUploadName] = useState("");
    const [uploadFileType, setUploadFileType] = useState("pdf");
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadThumb, setUploadThumb] = useState(null);
    const [existingFiles, setExistingFiles] = useState([]);
    const [selectedExisting, setSelectedExisting] = useState(null);
    const [chapters, setChapters] = useState([{ label: "", start: "", end: "" }]);

    useEffect(() => {
        if (!open) return;
        load();
    }, [open]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/course-structure/course/${courseId}`);
            const d = await res.json();
            if (d.success) {
                setSections(d.sections || { syllabus: [], mock: [], niyukti: [] });
            }
        } catch (err) {
            console.error("Load error", err);
        }
        setLoading(false);
    };

    /** -------------------------- HELPERS ---------------------------- */
    const getCurrent = () => sections[tab] || [];

    const setCurrent = (newTree) =>
        setSections((prev) => ({ ...prev, [tab]: newTree }));

    const updateNodeRecursive = (nodes, id, updater) => {
        return nodes.map((node) => {
            let updated = { ...node };
            if (updated.id === id) updated = updater(updated);
            if (updated.children?.length)
                updated.children = updateNodeRecursive(updated.children, id, updater);
            return updated;
        });
    };

    const deleteNodeRecursive = (nodes, id) =>
        nodes
            .map((n) => ({
                ...n,
                children: n.children ? deleteNodeRecursive(n.children, id) : [],
            }))
            .filter((n) => n.id !== id);

    const onToggleLock = async () => {
        if (!selectedNode) return alert("Select something");

        await fetch(`${API_URL}/api/course-structure/lock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: selectedNode.id }),
        });

        await load();
        setSelectedNode(null);
    };


    /** -------------------------- RENAME ---------------------------- */
    const onRenameNode = () => {
        if (!selectedNode) return alert("Select a node");
        const newName = prompt("New name:", selectedNode.name);
        if (!newName) return;

        const updated = updateNodeRecursive(getCurrent(), selectedNode.id, (n) => ({
            ...n,
            name: newName,
        }));

        setCurrent(updated);
        setSelectedNode({ ...selectedNode, name: newName });
    };

    /** -------------------------- DELETE ---------------------------- */
    const onDeleteNode = async (node) => {
        if (!node) return alert("Select node");
        if (!confirm("Delete this file/folder and its children?")) return;

        try {
            await fetch(`${API_URL}/api/course-structure/node/${node.id}`, {
                method: "DELETE",
            });

            const updated = deleteNodeRecursive(getCurrent(), node.id);
            setCurrent(updated);
            setSelectedNode(null);
        } catch (err) {
            alert("Delete failed");
        }
    };

    /** -------------------------- ADD FROM FILE MANAGER ---------------------------- */
    const onAddFromFM = async (pickedNodes) => {
        if (!pickedNodes || pickedNodes.length === 0) {
            setPickerOpen(false);
            return;
        }

        try {
            for (const node of pickedNodes) {
                await fetch(`${API_URL}/api/course-structure/add-from-fm`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        courseId,
                        sectionType: tab,
                        fmNodeId: node.id,
                        parentId: null,
                    }),
                });
            }

            await load();
        } catch (err) {
            console.error(err);
            alert("Error adding files");
        }

        setPickerOpen(false);
    };


    const onAddInsideFolder = async (pickedNodes) => {
        if (!pickedNodes?.length) return;

        if (!selectedNode || selectedNode.type !== "folder") {
            return alert("Select a folder to add files inside it.");
        }

        try {
            for (const node of pickedNodes) {
                await fetch(`${API_URL}/api/course-structure/add-from-fm`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        courseId,
                        sectionType: tab,
                        fmNodeId: node.id,
                        parentId: selectedNode.id,    // IMPORTANT: HERE!!!
                    }),
                });
            }

            await load();
        } catch (err) {
            console.error(err);
            alert("Failed to add inside folder");
        }

        setPickerOpen(false);
    };


    /** -------------------------- SAVE ALL ---------------------------- */
    const onSaveAll = async () => {
        setLoading(true);
        try {
            await fetch(`${API_URL}/api/course-structure/course/${courseId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sections }),
            });

            alert("Saved");
            onClose();
        } catch (err) {
            alert("Save failed");
        }
        setLoading(false);
    };

    /** -------------------------- MOVE UP/DOWN SORTING ---------------------------- */
    const moveNode = (node, dir) => {
        if (node.is_locked) return alert("Locked item cannot be moved!");

        const newTree = [...getCurrent()];

        // helper: recursive search + reorder
        const reorderRecursive = (list) => {
            const idx = list.findIndex((n) => n.id === node.id);
            if (idx !== -1) {
                if (dir === "up" && idx > 0) {
                    [list[idx], list[idx - 1]] = [list[idx - 1], list[idx]];
                } else if (dir === "down" && idx < list.length - 1) {
                    [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
                }
                return true;
            }

            for (const item of list) {
                if (item.children?.length) {
                    const found = reorderRecursive(item.children);
                    if (found) return true;
                }
            }
            return false;
        };

        reorderRecursive(newTree);

        setCurrent(newTree);

        // flatten ALL nodes to update backend sort_order
        const collectAll = (list, arr = []) => {
            list.forEach((x, i) => {
                arr.push({ id: x.id, sort_order: i });
                if (x.children?.length) collectAll(x.children, arr);
            });
            return arr;
        };

        const updates = collectAll(newTree);

        fetch(`${API_URL}/api/course-structure/sort`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ updates }),
        });
    };


    /** -------------------------- UPLOAD TO S3 ---------------------------- */
    const uploadToR2 = async (file) => {
        setUploading(true);

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

        setUploading(false);
        return out.fileUrl;
    };


    /** -------------------------- CHANGE THUMBNAIL ---------------------------- */
    const onChangeThumbnail = async () => {
        if (!selectedNode || selectedNode.type !== "file")
            return alert("Select a file");

        let input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            const url = await uploadToR2(file);

            await fetch(`${API_URL}/api/course-structure/thumbnail/${selectedNode.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ thumbnail_url: url }),
            });

            await load();
        };
    };

    /** -------------------------- REPLACE FILE ---------------------------- */
    const onReplaceFile = async () => {
        if (!selectedNode || selectedNode.type !== "file")
            return alert("Select a file");

        let input = document.createElement("input");
        input.type = "file";
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            const url = await uploadToR2(file);

            await fetch(`${API_URL}/api/course-structure/file/${selectedNode.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    file_url: url,
                    file_type: file.type,
                }),
            });

            await load();
        };
    };

    const onCreateFolder = async () => {
        const name = prompt("Folder name:");
        if (!name) return;

        const parentId = selectedNode?.type === "folder" ? selectedNode.id : null;

        const res = await fetch(`${API_URL}/api/course-structure/create-folder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                courseId,
                sectionType: tab,
                name,
                parentId,
            }),
        });

        const d = await res.json();
        if (!d.success) return alert("Failed to create folder");

        await load();
    };


    const onUploadFile = async () => {
        if (!selectedNode || selectedNode.type !== "folder") {
            return alert("Select a folder first.");
        }

        setUploadParent(selectedNode.id);
        setUploadOpen(true);

        // Load existing files (from file_manager or your table)
        const res = await fetch(`${API_URL}/api/upload/existing`);
        const data = await res.json();
        setExistingFiles(data);
    };


    const submitUpload = async () => {
        if (!uploadName.trim()) return alert("Enter a file name");

        let fileUrl = null;
        let thumbUrl = null;

        if (selectedExisting) {
            fileUrl = selectedExisting.file_url;
            thumbUrl = selectedExisting.thumbnail_url;
        } else {
            if (uploadFile) fileUrl = await uploadToR2(uploadFile);
            if (uploadThumb) thumbUrl = await uploadToR2(uploadThumb);
        }

        const chapterPayload =
            uploadFileType === "video"
                ? chapters.filter(c => c.label.trim())
                : null;

        await fetch(`${API_URL}/api/course-structure/upload-file`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                courseId,
                sectionType: tab,
                parentId: uploadParent,
                name: uploadName,
                file_url: fileUrl,
                file_type: uploadFileType,
                thumbnail_url: thumbUrl,
                chapters: chapterPayload,
            }),
        });

        setUploadOpen(false);
        await load();
    };

    /** -------------------------- UI ---------------------------- */

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-auto">
            <div className="bg-white w-full max-w-4xl rounded shadow-lg p-3">
                <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-semibold">Edit Course Structure</h3>

                    <div className="flex gap-2">
                        <button className="border px-3 py-1" onClick={onSaveAll}>
                            Save All
                        </button>
                        <button className="border px-3 py-1" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 my-3">
                    {["syllabus", "mock", "niyukti"].map((t) => (
                        <button
                            key={t}
                            className={`px-3 py-1 rounded ${tab === t ? "bg-blue-600 text-white" : "border"
                                }`}
                            onClick={() => {
                                setTab(t);
                                setSelectedNode(null);
                            }}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}

                    <button
                        className="ml-auto border px-3 py-1"
                        onClick={() => setPickerOpen(true)}
                    >
                        Add From File Manager
                    </button>
                    <button className="border px-3 py-1" onClick={onCreateFolder}>Create Folder</button>
                    <button className="border px-3 py-1" onClick={onUploadFile}>Upload File</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* LEFT */}
                    <div className="border rounded p-2 max-h-[65vh] overflow-auto">
                        {loading ? (
                            "Loading..."
                        ) : (
                            <TreeView
                                nodes={getCurrent()}
                                onSelect={setSelectedNode}
                                selectedId={selectedNode?.id}
                            />
                        )}
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="border rounded p-3">
                        <h4 className="font-semibold mb-2">Selected Item</h4>

                        {!selectedNode ? (
                            <div className="text-gray-500">Nothing selected</div>
                        ) : (
                            <>
                                <div className="font-medium">{selectedNode.name}</div>
                                <div>Type: {selectedNode.type}</div>

                                {selectedNode.file_url && (
                                    <a
                                        href={selectedNode.file_url}
                                        target="_blank"
                                        className="text-blue-600 text-sm underline"
                                    >
                                        Open File
                                    </a>
                                )}
                                <button className="border px-3 py-1 mt-3" onClick={onToggleLock}>
                                    {selectedNode.is_locked ? "Unlock" : "Lock"}
                                </button>
                                <div className="mt-3 space-y-2">
                                    <button
                                        className="border px-3 py-1"
                                        onClick={onRenameNode}
                                    >
                                        Rename
                                    </button>

                                    <button
                                        className="border px-3 py-1 text-red-600"
                                        onClick={() => onDeleteNode(selectedNode)}
                                    >
                                        Delete
                                    </button>

                                    {selectedNode.type === "file" && (
                                        <>
                                            <button
                                                className="border px-3 py-1"
                                                onClick={onChangeThumbnail}
                                            >
                                                Change Thumbnail
                                            </button>

                                            <button
                                                className="border px-3 py-1"
                                                onClick={onReplaceFile}
                                            >
                                                Replace File
                                            </button>
                                        </>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            className="border px-3 py-1"
                                            onClick={() => moveNode(selectedNode, "up")}
                                        >
                                            ▲ Move Up
                                        </button>
                                        <button
                                            className="border px-3 py-1"
                                            onClick={() => moveNode(selectedNode, "down")}
                                        >
                                            ▼ Move Down
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <FileManagerPicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(pickedNodes) => {
                    if (selectedNode && selectedNode.type === "folder") {
                        onAddInsideFolder(pickedNodes);   // ⬅ inside folder
                    } else {
                        onAddFromFM(pickedNodes);         // ⬅ root
                    }
                }}
            />
            {uploadOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
                    <div className="bg-white w-full max-w-lg rounded shadow p-4">

                        <h2 className="font-semibold text-lg mb-3">Upload File</h2>

                        <input
                            className="w-full border px-3 py-2 rounded mb-2"
                            placeholder="Display name"
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                        />

                        <select
                            className="w-full border px-3 py-2 rounded mb-2"
                            value={uploadFileType}
                            onChange={(e) => setUploadFileType(e.target.value)}
                        >
                            <option value="pdf">PDF</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                        </select>

                        {/* Existing files */}
                        <div className="border p-2 rounded max-h-40 overflow-y-auto mb-3">
                            <p className="text-sm font-medium mb-1">Select Existing File</p>

                           {existingFiles.map((f) => (
                            <div
                                key={f.id}
                                onClick={() => setSelectedExisting(f)}
                                className={`p-2 border rounded mb-2 cursor-pointer flex items-center gap-3 ${
                                selectedExisting?.id === f.id ? "bg-blue-100 border-blue-400" : ""
                                }`}
                            >
                                {/* Thumbnail */}
                                {f.thumbnail_url ? (
                                <img 
                                    src={f.thumbnail_url} 
                                    className="w-10 h-10 object-cover rounded"
                                />
                                ) : (
                                <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-xs">
                                    No Thumb
                                </div>
                                )}

                                {/* File Info */}
                                <div>
                                <div className="font-medium">{f.name}</div>
                                <div className="text-xs text-gray-500">{f.file_type}</div>
                                </div>
                            </div>
                            ))}

                        </div>

                        {/* Video chapters */}
                        {uploadFileType === "video" && (
                            <div className="border p-2 rounded mb-3">
                                <p className="font-semibold text-sm mb-2">Video Chapters</p>

                                {chapters.map((ch, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <input
                                            className="border px-2 py-1 rounded flex-1"
                                            placeholder="Label"
                                            value={ch.label}
                                            onChange={(e) => {
                                                const u = [...chapters];
                                                u[i].label = e.target.value;
                                                setChapters(u);
                                            }}
                                        />

                                        <input
                                            className="border px-2 py-1 rounded w-24"
                                            placeholder="Start"
                                            value={ch.start}
                                            onChange={(e) => {
                                                const u = [...chapters];
                                                u[i].start = e.target.value;
                                                setChapters(u);
                                            }}
                                        />

                                        <input
                                            className="border px-2 py-1 rounded w-24"
                                            placeholder="End"
                                            value={ch.end}
                                            onChange={(e) => {
                                                const u = [...chapters];
                                                u[i].end = e.target.value;
                                                setChapters(u);
                                            }}
                                        />

                                        <button
                                            className="bg-red-500 text-white px-2 rounded"
                                            onClick={() => setChapters(chapters.filter((_, x) => x !== i))}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}

                                <button
                                    className="bg-gray-200 px-3 py-1 rounded"
                                    onClick={() =>
                                        setChapters([...chapters, { label: "", start: "", end: "" }])
                                    }
                                >
                                    + Add
                                </button>
                            </div>
                        )}

                        {/* Upload new file */}
                        {!selectedExisting && (
                            <>
                                <input
                                    type="file"
                                    className="mb-2"
                                    accept={
                                        uploadFileType === "pdf"
                                            ? "application/pdf"
                                            : uploadFileType === "video"
                                                ? "video/*"
                                                : "audio/*"
                                    }
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                />

                                <input
                                    type="file"
                                    className="mb-3"
                                    accept="image/*"
                                    onChange={(e) => setUploadThumb(e.target.files[0])}
                                />
                            </>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 border rounded"
                                onClick={() => setUploadOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                                onClick={submitUpload}
                            >
                                Save
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

/* ---------------- TREE COMPONENT ---------------- */
/* ---------------- TREE COMPONENT WITH TOGGLE ---------------- */
function TreeView({ nodes, onSelect, selectedId, level = 0 }) {
    const [openFolders, setOpenFolders] = useState({});

    const toggleFolder = (id) => {
        setOpenFolders((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div>
            {nodes.map((n) => {
                const isFolder = n.type === "folder";
                const isOpen = openFolders[n.id];

                return (
                    <div key={n.id}>
                        <div
                            className={`cursor-pointer p-2 rounded flex items-center ${selectedId === n.id ? "bg-blue-100" : "hover:bg-gray-100"
                                }`}
                            style={{ marginLeft: level * 15 }}
                        >
                            {/* Toggle Arrow */}
                            {isFolder ? (
                                <span
                                    onClick={() => toggleFolder(n.id)}
                                    className="mr-1 cursor-pointer select-none"
                                >
                                    {isOpen ? "▼" : "▶"}
                                </span>
                            ) : (
                                <span style={{ width: "14px" }}></span> // space for files
                            )}

                            {/* Icon + Name */}
                            <span
                                onClick={() => onSelect(n)}
                                className="flex items-center"
                            >
                                {isFolder ? "📁" : "📄"} &nbsp;
                                {n.is_locked ? "🔒 " : ""}
                                {n.name}
                            </span>
                        </div>

                        {/* Children */}
                        {isFolder && isOpen && n.children?.length > 0 && (
                            <TreeView
                                nodes={n.children}
                                onSelect={onSelect}
                                selectedId={selectedId}
                                level={level + 1}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
