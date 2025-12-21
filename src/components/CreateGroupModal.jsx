import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Upload } from "lucide-react";

const API_URL = import.meta.env.VITE_API_BASE_URL;

/* ================= R2 UPLOAD (YOUR FUNCTION) ================= */
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
    key: out.key,
  };
};
/* ============================================================ */

export default function CreateGroupModal({ onClose }) {
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(null);

  const [courses, setCourses] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [otherUsers, setOtherUsers] = useState([]);

  const [adminOnly, setAdminOnly] = useState(true);
  const [allowImages, setAllowImages] = useState(false);

  /* ---------- Load courses + users ---------- */
  useEffect(() => {
    fetch(`${API_URL}/api/courses/with-users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then(setCourses);

    fetch(`${API_URL}/api/users/all`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then(setOtherUsers);
  }, []);

  /* ---------- Helpers ---------- */
  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const selectAllCourseUsers = (users) => {
    const ids = users.map((u) => u.id);
    setSelectedUsers((prev) => Array.from(new Set([...prev, ...ids])));
  };

  /* ---------- Submit ---------- */
  const handleCreateGroup = async () => {
    let imageUrl = null;

    if (groupImage) {
      const uploaded = await uploadToR2(groupImage);
      imageUrl = uploaded.file_url;
    }

    await fetch(`${API_URL}/api/chat/group`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        name: groupName,
        image: imageUrl,
        users: selectedUsers,
        admin_only_messages: adminOnly,
        allow_images: allowImages,
      }),
    });

    onClose();
  };

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[520px] max-h-[90vh] overflow-y-auto rounded-lg p-4">

        <h2 className="text-lg font-semibold mb-3">Create Group</h2>

        {/* Group Name */}
        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        {/* Group Image */}
        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <Upload size={18} />
          <span className="text-sm">Upload Group Image</span>
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setGroupImage(e.target.files[0])}
          />
        </label>

        {/* ===== COURSES ACCORDION ===== */}
        <h3 className="font-medium mb-2">Courses</h3>

        {courses.map((course) => (
          <div key={course.id} className="border rounded mb-2">
            <div
              className="flex justify-between items-center p-2 cursor-pointer bg-gray-100"
              onClick={() =>
                setExpanded((p) => ({ ...p, [course.id]: !p[course.id] }))
              }
            >
              <span className="font-medium">{course.name}</span>
              {expanded[course.id] ? <ChevronUp /> : <ChevronDown />}
            </div>

            {expanded[course.id] && (
              <div className="p-2 space-y-1">
                <label className="block font-medium">
                  <input
                    type="checkbox"
                    onChange={() => selectAllCourseUsers(course.users)}
                  />{" "}
                  Select all users
                </label>

                {course.users.map((u) => (
                  <label key={u.id} className="block text-sm">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleUser(u.id)}
                    />{" "}
                    {u.name} ({u.email})
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* ===== OTHER USERS ===== */}
        <h3 className="font-medium mt-4 mb-2">Other Users</h3>

        <div className="border rounded p-2 max-h-40 overflow-y-auto">
          {otherUsers.map((u) => (
            <label key={u.id} className="block text-sm">
              <input
                type="checkbox"
                checked={selectedUsers.includes(u.id)}
                onChange={() => toggleUser(u.id)}
              />{" "}
              {u.name} ({u.email})
            </label>
          ))}
        </div>

        {/* ===== PERMISSIONS ===== */}
        <div className="mt-4 space-y-1">
          <label className="block">
            <input
              type="checkbox"
              checked={adminOnly}
              onChange={(e) => setAdminOnly(e.target.checked)}
            />{" "}
            Admin only messages
          </label>

          <label className="block">
            <input
              type="checkbox"
              checked={allowImages}
              onChange={(e) => setAllowImages(e.target.checked)}
            />{" "}
            Allow images
          </label>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded w-1/2"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            className="bg-green-600 text-white px-4 py-2 rounded w-1/2"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
