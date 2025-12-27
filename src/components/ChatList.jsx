import { useEffect, useState } from "react";
import { Plus, Settings } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import GroupSettingsModal from "./GroupSettingsModal";

/* ================= AUTH HEADER ================= */
const auth = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

/* ================= HELPERS ================= */
const getDisplayName = (obj) => {
  return obj.name || obj.email || obj.phone || "Unknown";
};

const getInitials = (text = "") => {
  return text
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const avatarColors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-yellow-500",
];

const getRandomColor = (id) =>
  avatarColors[id % avatarColors.length];

/* ================= COMPONENT ================= */
export default function ChatList({ onSelect }) {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);

  useEffect(() => {
    fetch("https://api.niyukti.cloud/api/chat/groups", { headers: auth() })
      .then((r) => r.json())
      .then((r) => {
        setGroups(r);
      })
      .catch(() => setGroups([]));

    fetch("https://api.niyukti.cloud/api/chat/users/all", { headers: auth() })
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  const uniqueGroups = Array.from(
    new Map(groups.map((g) => [g.id, g])).values()
  );


  return (
    <>
      <div className="h-full overflow-y-auto bg-white">

        {/* ================= GROUPS ================= */}
        <div className="px-4 py-2 text-xs text-gray-400 font-semibold">
          GROUPS
        </div>

        {uniqueGroups
          .filter((g) => g.chat_type === "group")
          .map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100"
            >
              {/* CLICK AREA */}
              <div
                onClick={() => onSelect(g.id)}
                className="flex items-center gap-3 flex-1 cursor-pointer"
              >
                {g.image ? (
                  <img
                    src={g.image}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-white ${getRandomColor(
                      g.id
                    )}`}
                  >
                    {getInitials(g.name)}
                  </div>
                )}
                <div className="font-medium truncate">{g.name}</div>
              </div>

              {/* ⚙️ GEAR ICON */}
              <button
                onClick={() => setEditGroup(g)}
                className="text-gray-500 hover:text-gray-800"
              >
                <Settings size={18} />
              </button>
            </div>
          ))}

        {/* ================= USERS ================= */}
        <div className="px-4 py-2 text-xs text-gray-400 font-semibold">
          USERS
        </div>

        {users.map((u) => {
          const name = getDisplayName(u);
          return (
            <div
              key={u.id}
              onClick={async () => {
                const r = await fetch(
                  `https://api.niyukti.cloud/api/chat/dm/${u.id}`,
                  { method: "POST", headers: auth() }
                );
                const d = await r.json();
                onSelect(d.chatId);
              }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100"
            >
              {u.image ? (
                <img
                  src={u.image}
                  alt={name}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold ${getRandomColor(
                    u.id
                  )}`}
                >
                  {getInitials(name)}
                </div>
              )}

              <div className="truncate font-medium text-gray-800">
                {name}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= ADD GROUP BUTTON ================= */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-[260px] z-[9999] bg-green-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition"
      >
        <Plus size={22} />
      </button>

      {open && <CreateGroupModal onClose={() => setOpen(false)} />}

      {editGroup && (
        <GroupSettingsModal
          group={editGroup}
          allUsers={users}
          onClose={() => setEditGroup(null)}
        />
      )}
    </>
  );
}
