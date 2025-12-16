import React, { useState, useEffect } from "react";
import {
  FaFolder,
  FaFileAlt,
  FaCheckSquare,
  FaSquare,
  FaMinusSquare,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_BASE_URL;

/* Clean node structure */
function cleanNode(node) {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    file_type: node.file_type,
    file_url: node.file_url,
    thumbnail_url: node.thumbnail_url,
    children: node.children?.map(cleanNode) || [],
  };
}

/* Apply selection ONLY to children */
function applySelectionToChildren(node, selected) {
  let copy = { ...node, selected };

  if (copy.children) {
    copy.children = copy.children.map((child) =>
      applySelectionToChildren(child, selected)
    );
  }

  return copy;
}

/* Compute tri-state */
function computeState(node) {
  if (!node.children?.length) {
    return node.selected ? "full" : "none";
  }

  const states = node.children.map((c) => computeState(c));

  if (states.every((s) => s === "full")) return "full";
  if (states.every((s) => s === "none")) return "none";

  return "partial";
}

export default function FileManagerPicker({ open, onClose, onSelect }) {
  const [tree, setTree] = useState([]);

  useEffect(() => {
    if (open) loadTree();
  }, [open]);

  const loadTree = async () => {
    const res = await fetch(`${API_URL}/api/fm/tree`);
    const data = await res.json();

    const mark = (nodes) =>
      nodes.map((n) => ({
        ...n,
        selected: false,
        state: "none",
        isOpen: false,
        children: n.children ? mark(n.children) : [],
      }));

    setTree(mark(data));
  };

  /* ------------------------------
     FIXED toggleSelect() 
     ------------------------------ */
  const toggleSelect = (target) => {
    const update = (nodes) =>
      nodes.map((n) => {
        if (n.id === target.id) {
          const newVal = !n.selected;

          if (n.type === "folder") {
            return {
              ...n,
              selected: newVal,
              children: n.children.map((c) =>
                applySelectionToChildren(c, newVal)
              ),
            };
          }

          return { ...n, selected: newVal };
        }

        if (n.children)
          return { ...n, children: update(n.children) };

        return n;
      });

    const applyStates = (nodes) =>
      nodes.map((n) => {
        let copy = { ...n };

        if (copy.children?.length) {
          copy.children = applyStates(copy.children);
        }

        copy.state = computeState(copy);
        return copy;
      });

    setTree((prev) => applyStates(update(prev)));
  };

  const toggleFolder = (id) => {
    const update = (nodes) =>
      nodes.map((n) => {
        if (n.id === id) return { ...n, isOpen: !n.isOpen };
        if (n.children) return { ...n, children: update(n.children) };
        return n;
      });

    setTree((prev) => update(prev));
  };

  /* ------------------------------
     FIXED collectSelected()
     ONLY return:
      ✔ selected file
      ✔ selected folder
     NEVER include parent automatically
     ------------------------------ */
  const collectSelected = () => {
    const walk = (nodes) => {
      let out = [];

      for (let n of nodes) {
        if (n.selected) {
          out.push(cleanNode(n));
          continue;
        }

        // Ignore parent if partial
        if (n.children?.length) {
          const children = walk(n.children);
          out = [...out, ...children];
        }
      }

      return out;
    };

    return walk(tree);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center border-b p-3">
          <h3 className="font-semibold text-lg">Select from File Manager</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {/* Tree */}
        <div className="max-h-[500px] overflow-y-auto p-3">
          <TreeView
            nodes={tree}
            onToggleSelect={toggleSelect}
            onToggleFolder={toggleFolder}
          />
        </div>

        {/* Footer */}
        <div className="border-t p-3 flex justify-end gap-2">
          <button className="px-4 py-2 border rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => onSelect(collectSelected())}
          >
            Add Selected
          </button>
        </div>
      </div>
    </div>
  );
}

/* Render Tree UI */
function TreeView({ nodes, onToggleSelect, onToggleFolder, level = 0 }) {
  return (
    <div>
      {nodes.map((n) => (
        <div key={n.id}>
          <div
            className="flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer"
            style={{ marginLeft: level * 15 }}
          >
            {n.type === "folder" ? (
              <span onClick={() => onToggleFolder(n.id)}>
                {n.isOpen ? "▼" : "▶"}
              </span>
            ) : (
              <span className="w-3" />
            )}

            <span onClick={() => onToggleSelect(n)}>
              {n.state === "partial" ? (
                <FaMinusSquare className="text-gray-500" />
              ) : n.selected ? (
                <FaCheckSquare className="text-blue-600" />
              ) : (
                <FaSquare className="text-gray-400" />
              )}
            </span>

            {n.type === "folder" ? (
              <FaFolder className="text-yellow-600" />
            ) : (
              <FaFileAlt className="text-blue-500" />
            )}

            <span>{n.name}</span>
          </div>

          {n.type === "folder" && n.isOpen && (
            <TreeView
              nodes={n.children}
              onToggleSelect={onToggleSelect}
              onToggleFolder={onToggleFolder}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}
