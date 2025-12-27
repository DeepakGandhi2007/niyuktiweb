import { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function GroupSettingsModal({ group, allUsers, onClose }) {
  const [name, setName] = useState(group.name || "");
  const [image, setImage] = useState(group.image || null);
  const [file, setFile] = useState(null);

  const [members, setMembers] = useState([]); // FULL MEMBER OBJECTS
  const [selected, setSelected] = useState([]); // ONLY IDS

  const [adminOnly, setAdminOnly] = useState(false);
  const [allowImages, setAllowImages] = useState(false);

  /* ================= INIT SETTINGS ================= */
  useEffect(() => {
    setAdminOnly(Boolean(group.admin_only_messages));
    setAllowImages(Boolean(group.allow_images));
  }, [group.id]);

  /* ================= LOAD GROUP MEMBERS ================= */
  useEffect(() => {
    fetch(`${API_URL}/api/chat/groups/${group.id}/members`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        setMembers(data); // full objects
        setSelected(data.map((u) => Number(u.id))); // ids only
      })
      .catch(() => {
        setMembers([]);
        setSelected([]);
      });
  }, [group.id]);

  /* ================= IMAGE UPLOAD ================= */
  const uploadImage = async () => {
    if (!file) return image;

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

    return out.fileUrl;
  };

  /* ================= SAVE GROUP SETTINGS ================= */
  const save = async () => {
    const imageUrl = await uploadImage();

    await fetch(`${API_URL}/api/chat/group/${group.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        image: imageUrl,
        users: selected,
        admin_only_messages: adminOnly,
        allow_images: allowImages,
      }),
    });

    onClose();
  };

  /* ================= TOGGLE MEMBER ================= */
  const toggleUser = (id) => {
    const uid = Number(id);
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[520px] max-h-[90vh] overflow-y-auto rounded-lg p-4">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Group Settings</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* GROUP NAME */}
        <input
          className="border p-2 w-full mb-3 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* IMAGE UPLOAD */}
        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <Upload size={18} />
          Change Group Image
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        {/* MEMBERS + NICKNAME */}
        <h3 className="font-medium mb-2">Members</h3>

        <div className="border rounded p-2 max-h-52 overflow-y-auto space-y-2">
          {members.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm flex-1">
                <input
                  type="checkbox"
                  checked={selected.includes(Number(u.id))}
                  onChange={() => toggleUser(u.id)}
                />
                <div>
                  <div className="font-medium">{u.nickname || u.name}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                </div>
              </label>

              {/* NICKNAME INPUT */}
              <input
                type="text"
                placeholder="Nickname"
                defaultValue={u.nickname || ""}
                className="border px-2 py-1 text-sm rounded w-32"
                onBlur={async (e) => {
                  const value = e.target.value.trim();
                  if (!value) return; // ❌ don't overwrite with null

                  await fetch(
                    `${API_URL}/api/chat/groups/${group.id}/members/${u.id}/nickname`,
                    {
                      method: "PUT",
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                          "token"
                        )}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ nickname: value }),
                    }
                  );
                }}
              />
            </div>
          ))}
        </div>

        {/* SETTINGS */}
        <div className="mt-4 space-y-2">
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
          <button onClick={onClose} className="border px-4 py-2 rounded w-1/2">
            Cancel
          </button>
          <button
            onClick={save}
            className="bg-green-600 text-white px-4 py-2 rounded w-1/2"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
