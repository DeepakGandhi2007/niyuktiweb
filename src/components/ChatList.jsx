import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

export default function ChatList({ onSelect }) {
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("https://api.niyukti.cloud/api/chat/groups", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(r => r.json())
      .then(setGroups);
  }, []);

  return (
    <div className="w-80 border-r relative">
      <div className="p-3 bg-green-600 text-white font-semibold">
        Admin Chats
      </div>

      {groups.map(g => (
        <div
          key={g.id}
          onClick={() => onSelect(g.id)}
          className="p-3 border-b hover:bg-gray-100 cursor-pointer"
        >
          {g.name}
        </div>
      ))}

      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-4 right-4 bg-green-600 text-white p-3 rounded-full"
      >
        <Plus />
      </button>

      {open && <CreateGroupModal onClose={() => setOpen(false)} />}
    </div>
  );
}
