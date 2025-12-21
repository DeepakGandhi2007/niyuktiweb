import { useEffect, useState } from "react";
import ChatList from "../../components/ChatList";
import ChatWindow from "../../components/ChatWindow";
import { socket } from "../../components/socket";

export default function ChatAdmin() {
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    socket.auth = {
      token: localStorage.getItem("token") // ADMIN JWT
    };
    socket.connect();

    return () => socket.disconnect();
  }, []);

  return (
    <div className="h-screen flex">
      <ChatList onSelect={setActiveGroup} />
      {activeGroup ? (
        <ChatWindow groupId={activeGroup} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a group
        </div>
      )}
    </div>
  );
}
