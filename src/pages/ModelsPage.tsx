import React from "react";
import { ArrowPathIcon, DocumentTextIcon } from "@heroicons/react/24/solid";
import { useAutoML } from "../context/AutoMLContext";

export default function ModelsPage(): React.ReactElement {
  const {
    busy,
    mlResults,
    modelPaths,
    toFullUrl,
    handleTrainModels,
    problemStatement,
    targetColumn,
    setProblemStatement,
    setTargetColumn,
    error,
  } = useAutoML();
  const modelEntries = Object.entries(modelPaths);

  return (
    <section className="glass-panel p-5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-900">
        <DocumentTextIcon className="h-5 w-5 text-emerald-700" /> Run Machine Learning Model
      </h2>

      {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-black text-slate-900">Train Models</h3>
        <div className="space-y-2">
          <input
            value={problemStatement}
            onChange={(event) => setProblemStatement(event.target.value)}
            placeholder="problem statement"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          />
          <input
            value={targetColumn}
            onChange={(event) => setTargetColumn(event.target.value)}
            placeholder="target variable (optional)"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          />
          <button
            onClick={() => void handleTrainModels()}
            disabled={busy === "ml"}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy === "ml" ? "Training" : "Run /ml-models"}
          </button>
        </div>
      </div>

      {busy === "ml" && (
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
          Model training in progress
        </div>
      )}

      {mlResults.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          No metrics yet. Run training from Data Workspace.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                {Object.keys(mlResults[0]).map((column) => (
                  <th key={column} className="px-3 py-2 text-left font-semibold text-slate-700">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {mlResults.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.keys(mlResults[0]).map((column) => (
                    <td key={`${column}-${rowIndex}`} className="px-3 py-2 text-slate-700">
                      {String(row[column] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modelEntries.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Model Files</h3>
          {modelEntries.map(([modelName, path]) => (
            <div
              key={`${modelName}-${path}`}
              className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-semibold text-slate-800">{modelName}</div>
                <div className="break-all text-slate-700">{path}</div>
              </div>
              <a
                href={toFullUrl(path)}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
              >
                Open
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
