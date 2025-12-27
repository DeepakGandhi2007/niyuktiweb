import { useEffect, useState } from "react";
import ChatList from "../../components/ChatList";
import ChatWindow from "../../components/ChatWindow";
import { socket } from "../../components/socket";

export default function ChatAdmin() {
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    socket.auth = {
      token: localStorage.getItem("token"),
    };
    socket.connect();

    return () => socket.disconnect();
  }, []);

  return (
    <div
      className="flex bg-white overflow-hidden"
      style={{ height: "calc(100vh - 64px)" }} // navbar height
    >
      {/* LEFT SIDEBAR */}
      <div className="w-80 overflow-hidden">
        <ChatList onSelect={setActiveGroup} />
      </div>

      {/* RIGHT CHAT WINDOW */}
      <div className="flex-1 overflow-hidden">
        {activeGroup ? (
          <ChatWindow groupId={activeGroup} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Select a group
          </div>
        )}
      </div>
    </div>
  );
}
