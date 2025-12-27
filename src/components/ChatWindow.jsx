import { useEffect, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { socket } from "./socket.js";

const API_URL = import.meta.env.VITE_API_BASE_URL;

/* ================= USER ID ================= */
const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).id;
  } catch {
    return null;
  }
};

const myUserId = getUserIdFromToken();

/* ================= NORMALIZE ATTACHMENT ================= */
const normalizeAttachment = (att) => {
  if (!att) return null;
  if (typeof att === "string") {
    try {
      return JSON.parse(att);
    } catch {
      return null;
    }
  }
  return att;
};

export default function ChatWindow({ groupId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  /* ================= LOAD HISTORY ================= */
  useEffect(() => {
    if (!groupId) return;

    setMessages([]);

    fetch(`${API_URL}/api/chat/groups/${groupId}/messages`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      });
  }, [groupId]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!groupId) return;

    socket.emit("join-group", groupId);

    const onNewMessage = (msg) => {
      if (msg.group_id === groupId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const onDelete = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, deleted_for_all: 1 } : m
        )
      );
    };

    socket.on("new-message", onNewMessage);
    socket.on("message-deleted", onDelete);

    return () => {
      socket.off("new-message", onNewMessage);
      socket.off("message-deleted", onDelete);
    };
  }, [groupId]);

  /* ================= AUTOSCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= CLOSE MENU ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const close = () => setSelectedMessageId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  /* ================= UPLOAD TO R2 ================= */
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
      file_name: file.name,
    };
  };

  /* ================= FILE SELECT ================= */
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);

    if (f.type.startsWith("image/") || f.type.startsWith("video/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    fileRef.current.value = "";
  };

  /* ================= SEND MESSAGE ================= */
  const send = async () => {
    if (sending) return;
    if (!text.trim() && !file) return;

    setSending(true);

    let attachment = null;
    if (file) attachment = await uploadToR2(file);

    const tempMsg = {
      id: Date.now(),
      group_id: groupId,
      sender_id: myUserId,
      message: text,
      attachment,
    };

    setMessages((prev) => [...prev, tempMsg]);

    socket.emit("send-message", {
      group_id: groupId,
      message: text || null,
      attachment,
    });

    setText("");
    removeFile();
    setSending(false);
  };

  /* ================= DELETE MESSAGE ================= */
  const handleDelete = async (messageId) => {
    const res = await fetch(
      `${API_URL}/api/chat/messages/${messageId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    if (data.success) {
      socket.emit("delete-message", { messageId, groupId });
      setSelectedMessageId(null);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isMe = m.sender_id === myUserId;
          const attachment = normalizeAttachment(m.attachment);

          return (
            <div
              key={m.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"} relative`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isMe || m.deleted_for_all) return;
                setSelectedMessageId(
                  selectedMessageId === m.id ? null : m.id
                );
              }}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg shadow ${
                  isMe
                    ? "bg-green-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                {m.deleted_for_all ? (
                  <i className="text-gray-300 text-sm">
                    This message was deleted
                  </i>
                ) : (
                  <>
                    {attachment?.file_type?.startsWith("image/") && (
                      <img
                        src={attachment.file_url}
                        className="rounded mb-2 max-w-[250px]"
                      />
                    )}

                    {attachment?.file_type?.startsWith("video/") && (
                      <video
                        src={attachment.file_url}
                        controls
                        className="rounded mb-2 max-w-[300px]"
                      />
                    )}

                    {attachment?.file_type &&
                      !attachment.file_type.startsWith("image/") &&
                      !attachment.file_type.startsWith("video/") && (
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          className={`underline block mb-2 ${
                            isMe ? "text-white" : "text-blue-600"
                          }`}
                        >
                          📄 {attachment.file_name}
                        </a>
                      )}

                    {m.message && <div>{m.message}</div>}
                  </>
                )}
              </div>

              {/* DELETE MENU */}
              {selectedMessageId === m.id && (
                <div
                  className="absolute top-full mt-1 bg-white shadow-lg rounded z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="px-4 py-2 text-red-600 hover:bg-gray-100 text-sm w-full"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* PREVIEW BAR */}
      {file && (
        <div className="p-3 border-t bg-white flex items-center gap-3">
          {preview ? (
            <img
              src={preview}
              className="w-16 h-16 rounded object-cover"
            />
          ) : (
            <div className="text-sm">📎 {file.name}</div>
          )}
          <button onClick={removeFile} className="text-red-500">
            <X />
          </button>
        </div>
      )}

      {/* INPUT */}
      <div className="border-t bg-white p-3 flex items-center gap-2">
        <button onClick={() => fileRef.current.click()}>
          <Paperclip />
        </button>

        <input
          type="file"
          ref={fileRef}
          hidden
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFile}
        />

        <input
          className="flex-1 border rounded-full px-4 py-2"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />

        <button
          onClick={send}
          disabled={sending}
          className="bg-green-600 text-white px-4 rounded-full disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
