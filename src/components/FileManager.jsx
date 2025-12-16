import React, { useEffect, useState } from "react";
import { FaFolder, FaFileAlt, FaUnlock, FaLock } from "react-icons/fa";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import FileUploadModal from "./FileUploadModal";

const API_URL = import.meta.env.VITE_API_BASE_URL;

function FileNode({ node, onSelect, selected, onMove, onToggle }) {
  // drag
  const [, drag] = useDrag({
    type: "ITEM",
    item: { id: node.id, type: node.type },
  });

  // drop
  const [, drop] = useDrop({
    accept: "ITEM",
    drop: (dragged) => {
      if (dragged.id !== node.id) {
        onMove(dragged.id, node.id, node.type);
      }
    },
  });

  return (
    <div
      ref={(el) => drag(drop(el))}
      className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
        selected?.id === node.id ? "bg-blue-200" : "hover:bg-gray-100"
      }`}
    >
      {/* Toggle arrow only for folders */}
      {node.type === "folder" ? (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node.id);
          }}
          className="text-xs w-4 cursor-pointer select-none"
        >
          {node.isOpen ? "▼" : "▶"}
        </span>
      ) : (
        <span className="w-4" />
      )}

      {/* Icon */}
      {node.type === "folder" ? <FaFolder /> : <FaFileAlt />}

      {/* Name */}
      <span onClick={() => onSelect(node)}>{node.name}</span>

      {/* Lock state */}
      {node.is_locked ? (
        <FaLock className="text-red-500 ml-2" />
      ) : (
        <FaUnlock className="text-green-500 ml-2" />
      )}
    </div>
  );
}

function FolderTree({ data, onSelect, selected, onMove, onToggle }) {
  return data.map((node) => (
    <div key={node.id} className="select-none">
      <FileNode
        node={node}
        onSelect={onSelect}
        selected={selected}
        onMove={onMove}
        onToggle={onToggle}
      />

      {node.type === "folder" && node.isOpen && node.children?.length > 0 && (
        <div className="ml-6 border-l pl-3">
          <FolderTree
            data={node.children}
            onSelect={onSelect}
            selected={selected}
            onMove={onMove}
            onToggle={onToggle}
            
          />
        </div>
      )}
    </div>
  ));
}



export default function FileManager() {
  const [tree, setTree] = useState([]);
  const [selected, setSelected] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const toggleFolder = (id) => {
    const update = (nodes) =>
      nodes.map((n) => {
        if (n.id === id) return { ...n, isOpen: !n.isOpen };
        if (n.children) return { ...n, children: update(n.children) };
        return n;
      });

    setTree((prev) => update(prev));
  };

  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    const res = await fetch(`${API_URL}/api/fm/tree`);
    const data = await res.json();
    setTree(data);
  };

  const createFolder = async (parentId) => {
    const name = prompt("Folder name?");
    if (!name) return;

    await fetch(`${API_URL}/api/fm/folder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, name }),
    });

    loadTree();
  };

  const handleUpload = async ({ parentId, name, fileType, fileUrl, thumbnailUrl }) => {
    await fetch(`${API_URL}/api/fm/file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, name, fileType, fileUrl, thumbnailUrl }),
    });

    loadTree();
  };

  // ⭐ DRAG + DROP MOVE FUNCTION
  const handleMove = async (dragId, dropId, dropType) => {
    const newParent = dropType === "folder" ? dropId : null;

    await fetch(`${API_URL}/api/fm/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dragId, newParentId: newParent }),
    });

    loadTree();
  };

  const toggleLock = async (id) => {
    await fetch(`${API_URL}/api/fm/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    loadTree();
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this item?")) return;

    await fetch(`${API_URL}/api/fm/${id}`, { method: "DELETE" });
    loadTree();
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 bg-gray-50 min-h-screen">

        <div className="max-w-4xl mx-auto bg-white rounded shadow p-5">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">File Manager</h2>

            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => createFolder(selected?.id || null)}>
                + Folder
              </button>

              <button className="px-3 py-1 border rounded" onClick={() => setUploadOpen(true)}>
                + File
              </button>

              <button className="px-3 py-1 border rounded bg-gray-100" onClick={() => setSelected(null)}>
                Clear
              </button>
            </div>
          </div>

          <div className="flex gap-5">
            {/* LEFT TREE */}
            <div className="w-1/3 border rounded p-2 bg-white">
              <FolderTree data={tree} selected={selected} onSelect={setSelected} onMove={handleMove} onToggle={toggleFolder} />
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 border rounded p-3 bg-white">
              {!selected && <div>Select a folder or file.</div>}

              {selected && (
                <>
                  <h3 className="text-xl font-semibold">{selected.name}</h3>

                  {selected.type === "file" && (
                    <div className="mt-3">
                      {selected.thumbnail_url && (
                        <img src={selected.thumbnail_url} className="w-64 h-40 border rounded mb-3" />
                      )}

                      <a href={selected.file_url} target="_blank" className="text-blue-600 underline">
                        Open File
                      </a>
                    </div>
                  )}

                  {selected.type === "folder" && (
                    <div className="mt-4 space-y-2">
                      {(selected.children || []).map((c) => (
                        <div className="p-2 border rounded flex items-center gap-2">
                          {c.type === "folder" ? <FaFolder /> : <FaFileAlt />}
                          <span>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button className="px-3 py-1 border rounded" onClick={() => toggleLock(selected.id)}>
                      {selected.is_locked ? "Unlock" : "Lock"}
                    </button>

                    <button className="px-3 py-1 border rounded text-red-500" onClick={() => deleteItem(selected.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <FileUploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          parentId={selected ? selected.id : null}
          onUpload={handleUpload}
        />
      </div>
    </DndProvider>
  );
}
