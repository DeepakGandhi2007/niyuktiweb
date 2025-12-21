import { useEffect, useState } from "react";
import { socket } from "./socket";

export default function ChatWindow({ groupId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.emit("join-group", groupId);

    socket.on("new-message", msg => {
      if (msg.group_id === groupId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => socket.off("new-message");
  }, [groupId]);

  const send = () => {
    socket.emit("send-message", {
      group_id: groupId,
      message: text,
      image: null
    });
    setText("");
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className="mb-2">
            <strong>{m.sender_id}</strong>: {m.message}
          </div>
        ))}
      </div>

      <div className="p-3 border-t flex gap-2">
        <input
          className="border flex-1 p-2"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          onClick={send}
          className="bg-green-600 text-white px-4"
        >
          Send
        </button>
      </div>
    </div>
  );
}
