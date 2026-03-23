import React from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/solid";
import { useAutoML } from "../context/AutoMLContext";

export default function WorkspacePage(): React.ReactElement {
  const {
    file,
    fileName,
    preview,
    previewColumns,
    busy,
    error,
    handleFileChange,
    handleUpload,
    clearError,
    resetWorkspace,
    setSessionId,
    sessionId,
  } = useAutoML();

  return (
    <div className="min-w-0 grid gap-6">
      <section className="glass-panel min-w-0 p-6">
        <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-900">Data Workspace</h2>
          <span className="max-w-[55%] truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" title={sessionId || "-"}>
            Session {sessionId || "-"}
          </span>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <label className="flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-4 transition hover:bg-orange-100">
            <CloudArrowUpIcon className="h-10 w-10 text-orange-500" />
            <div className="min-w-0">
              <div className="truncate font-bold text-slate-700">{file ? file.name : "Select CSV or Excel"}</div>
              <div className="text-xs text-slate-500">Accepted: .csv .xlsx .xls</div>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => {
                clearError();
                handleFileChange(event);
              }}
              className="hidden"
            />
          </label>

          <div className="grid min-w-0 grid-cols-2 gap-2">
            <button
              onClick={() => void handleUpload()}
              disabled={busy === "upload"}
              className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
              {busy === "upload" ? "Uploading" : "Upload"}
            </button>
            <button
              onClick={resetWorkspace}
              className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
            File: <span className="font-semibold">{fileName || "Not uploaded"}</span>
          </div>
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
            Session: <span className="font-mono">{sessionId || "-"}</span>
          </div>
        </div>

        <label className="mt-3 block text-sm text-slate-600">
          Continue with existing session id
          <input
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value)}
            placeholder="Paste session_id if already created"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </label>

        {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      </section>

      <section className="glass-panel min-w-0 p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black text-slate-900">Preview</h2>
          {previewColumns.length > 8 && <span className="text-xs font-medium text-slate-600">Use touchpad for natural horizontal and vertical scroll.</span>}
        </div>

        {preview.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No rows to display.</div>
        ) : (
          <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div
              className="max-h-[460px] w-full overflow-auto overscroll-contain"
              style={{ touchAction: "pan-x pan-y" }}
            >
              <table className="min-w-max table-auto divide-y divide-slate-200 text-[15px]">
              <thead className="sticky top-0 z-10 bg-slate-100">
              <tr>
                <th className="sticky left-0 z-20 min-w-[60px] whitespace-nowrap border-r border-slate-200 bg-slate-100 px-3 py-2 text-left font-bold text-slate-700">
                  #
                </th>
                {previewColumns.map((column) => (
                  <th key={column} className="min-w-[140px] whitespace-nowrap px-3 py-2 text-left font-bold text-slate-700">
                    {column}
                  </th>
                ))}
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {preview.map((row, rowIndex) => (
                  <tr key={rowIndex} className="odd:bg-white even:bg-slate-50/60">
                    <td className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-3 py-2 text-slate-500">
                      {rowIndex + 1}
                    </td>
                    {previewColumns.map((column) => (
                      <td
                        key={`${column}-${rowIndex}`}
                        className="min-w-[140px] max-w-[240px] truncate whitespace-nowrap px-3 py-2 text-slate-700"
                        title={String(row[column] ?? "")}
                      >
                      {String(row[column] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
              </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Showing {preview.length} rows and {previewColumns.length} columns.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
