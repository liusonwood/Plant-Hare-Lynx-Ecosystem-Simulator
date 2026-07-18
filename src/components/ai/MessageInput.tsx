import { useState, type KeyboardEvent } from "react";

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 发送，Shift+Enter 换行
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="ai-input-row">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "AI 正在思考..." : "输入指令，Enter 发送 / Shift+Enter 换行"}
        disabled={disabled}
        rows={1}
      />
      <button
        className="ai-send-btn"
        onClick={send}
        disabled={disabled || !text.trim()}
        aria-label="发送"
        title="发送"
      >
        ➤
      </button>
    </div>
  );
}
