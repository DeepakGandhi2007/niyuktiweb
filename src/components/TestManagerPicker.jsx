import { useEffect, useState, useMemo } from "react";
import {
  FaFolder,
  FaChevronDown,
  FaListUl
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function TestManagerPicker({ open, onClose, onSelect }) {
  const [tests, setTests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    if (!open) return;

    fetch(`${API_URL}/api/test/list?mode=picker`)
      .then((r) => r.json())
      .then((d) => setTests(d.data || []));
  }, [open]);

  /* ================= GROUP BY CATEGORY ================= */

  const groupedTests = useMemo(() => {
    return tests.reduce((acc, test) => {
      const category = test.category_name || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(test);
      return acc;
    }, {});
  }, [tests]);

  const toggleCollapse = (category) => {
    setCollapsed((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleSelect = (test) => {
    setSelected((prev) =>
      prev.find((t) => t.id === test.id)
        ? prev.filter((t) => t.id !== test.id)
        : [...prev, test]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
      <div className="bg-white w-full max-w-2xl rounded-xl p-5 shadow-xl">

        {/* HEADER */}
        <h3 className="font-semibold text-lg mb-4">
          Add From Test Manager
        </h3>

        {/* BODY */}
        <div className="max-h-[420px] overflow-auto space-y-6">

          {Object.entries(groupedTests).map(([categoryName, categoryTests]) => {
            const isCollapsed = collapsed[categoryName];

            return (
              <div key={categoryName}>

                {/* CATEGORY HEADER */}
                <div
                  onClick={() => toggleCollapse(categoryName)}
                  className="flex items-center justify-between cursor-pointer
                             bg-yellow-100 border border-yellow-300
                             px-4 py-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FaFolder className="text-yellow-600 text-xl" />
                    <span className="font-semibold text-yellow-800">
                      {categoryName}
                    </span>
                    <span className="text-xs text-yellow-700">
                      ({categoryTests.length})
                    </span>
                  </div>

                  <FaChevronDown
                    className={`text-yellow-700 transition-transform ${
                      isCollapsed ? "-rotate-90" : "rotate-0"
                    }`}
                  />
                </div>

                {/* TEST LIST */}
                {!isCollapsed && (
                  <div className="mt-3 pl-4 border-l-4 border-yellow-300 space-y-2">
                    {categoryTests.map((t) => {
                      const isSelected = selected.find((x) => x.id === t.id);

                      return (
                        <div
                          key={t.id}
                          onClick={() => toggleSelect(t)}
                          className={`flex items-center justify-between
                                      border rounded-lg px-3 py-2 cursor-pointer
                                      transition ${
                                        isSelected
                                          ? "bg-blue-100 border-blue-400"
                                          : "hover:bg-gray-50"
                                      }`}
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {t.name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <FaListUl size={10} />
                              Questions: {t.question_count}
                            </div>
                          </div>

                          {isSelected && (
                            <span className="text-xs text-blue-700 font-semibold">
                              Selected
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {tests.length === 0 && (
            <p className="text-center text-gray-500">
              No tests found.
            </p>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            className="border px-4 py-1 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-5 py-1 rounded"
            onClick={() => onSelect(selected)}
          >
            Add Selected ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}
