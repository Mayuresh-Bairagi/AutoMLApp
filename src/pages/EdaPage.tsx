import React from "react";
import { DocumentTextIcon } from "@heroicons/react/24/solid";
import { useAutoML } from "../context/AutoMLContext";

export default function EdaPage(): React.ReactElement {
  const { busy, error, edaUrl, handleGenerateEDA, toFullUrl } = useAutoML();

  return (
    <section className="glass-panel p-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-900">
        <DocumentTextIcon className="h-5 w-5 text-cyan-700" /> EDA
      </h2>

      <p className="mb-4 text-sm text-slate-600">Generate and open exploratory data report for the current session.</p>

      {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <button
        onClick={() => void handleGenerateEDA()}
        disabled={busy === "eda"}
        className="w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
      >
        {busy === "eda" ? "Generating" : "Generate EDA"}
      </button>

      {edaUrl && (
        <a
          href={toFullUrl(edaUrl)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block rounded-lg bg-cyan-100 px-3 py-2 text-sm font-semibold text-cyan-800"
        >
          Open latest EDA report
        </a>
      )}
    </section>
  );
}
