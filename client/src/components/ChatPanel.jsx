import { useEffect, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";
 
function ChatPanel({
  showChat,
  messages = [],
  message,
  setMessage,
  sendMessage,
}) {
  const bottomRef = useRef(null);
 
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
 
  if (!showChat) return null;
 
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Chat</h2>
        {/* FIX: Badge now labeled "msgs" and correctly reflects message count */}
        <span className="participant-count" title={`${messages.length} messages`}>
          {messages.length}
        </span>
      </div>
 
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">Start the conversation 👋</div>
        ) : (
          messages.map((msg, index) => (
            <div className="chat-message" key={msg._id || index}>
              <div className="chat-avatar">
                {(msg.sender || "G")[0].toUpperCase()}
              </div>
 
              <div className="chat-content">
                <div className="chat-sender">{msg.sender || "Guest"}</div>
                <div className="chat-text">{msg.message}</div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
 
      <div className="chat-input-area">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
 
        <button className="send-btn" onClick={sendMessage} title="Send message">
          <FaPaperPlane />
        </button>
      </div>
    </aside>
  );
}
 
export default ChatPanel;