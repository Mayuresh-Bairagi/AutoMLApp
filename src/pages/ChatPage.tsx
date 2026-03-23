import React from "react";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/solid";
import { useAutoML } from "../context/AutoMLContext";

export default function ChatPage(): React.ReactElement {
  const { busy, error, chatQuestion, setChatQuestion, chatHistory, handleAskChat } = useAutoML();

  return (
    <section className="glass-panel p-5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-900">
        <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-teal-600" /> Dataset Chatbot
      </h2>

      {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={chatQuestion}
          onChange={(event) => setChatQuestion(event.target.value)}
          placeholder="Ask a question about your dataset"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
        <button
          onClick={() => void handleAskChat()}
          disabled={busy === "chat"}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {busy === "chat" ? "Sending" : "Ask"}
        </button>
      </div>

      <div className="mt-4 max-h-[65vh] space-y-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        {chatHistory.length === 0 && <div className="text-sm text-slate-500">Conversation is empty.</div>}
        {chatHistory.map((turn, index) => (
          <div
            key={`${turn.role}-${index}`}
            className={`rounded-lg px-3 py-2 text-sm ${
              turn.role === "user" ? "bg-teal-100 text-teal-900" : "bg-white text-slate-700"
            }`}
          >
            <div className="mb-1 text-xs font-semibold uppercase opacity-70">{turn.role}</div>
            <div className="whitespace-pre-wrap">{turn.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
