import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function TestManagerPicker({ open, onClose, onSelect }) {
  const [tests, setTests] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!open) return;

    fetch(`${API_URL}/api/test/picker`)
      .then(r => r.json())
      .then(d => setTests(d.data || []));
  }, [open]);

  const toggle = (test) => {
    setSelected((prev) =>
      prev.find(t => t.id === test.id)
        ? prev.filter(t => t.id !== test.id)
        : [...prev, test]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
      <div className="bg-white w-full max-w-lg rounded p-4">
        <h3 className="font-semibold mb-3">Add From Test Manager</h3>

        <div className="max-h-80 overflow-auto">
          {tests.map(t => (
            <div
              key={t.id}
              onClick={() => toggle(t)}
              className={`border p-2 rounded mb-2 cursor-pointer ${
                selected.find(x => x.id === t.id)
                  ? "bg-blue-100 border-blue-400"
                  : ""
              }`}
            >
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-gray-500">
                Questions: {t.question_count}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <button className="border px-3 py-1" onClick={onClose}>
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-1"
            onClick={() => onSelect(selected)}
          >
            Add Selected
          </button>
        </div>
      </div>
    </div>
  );
}
