import React from "react";
import Plot from "react-plotly.js";
import {
  BoltIcon,
  ChartBarSquareIcon,
  ChatBubbleBottomCenterTextIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";
import { useAutoML } from "../context/AutoMLContext";

type JsonRecord = Record<string, unknown>;

function getChartFigure(chart: JsonRecord): { data: unknown[]; layout: JsonRecord } | null {
  const figure = chart.figure;
  if (!figure || typeof figure !== "object") return null;
  const typedFigure = figure as JsonRecord;
  const data = Array.isArray(typedFigure.data) ? typedFigure.data : [];
  const layout = typedFigure.layout && typeof typedFigure.layout === "object" ? (typedFigure.layout as JsonRecord) : {};
  return { data, layout };
}

function metricValue(source: JsonRecord | null, key: string): string {
  if (!source || source[key] === undefined || source[key] === null) return "-";
  return String(source[key]);
}

export default function StudioPage(): React.ReactElement {
  const {
    file,
    fileName,
    preview,
    previewColumns,
    sessionId,
    setSessionId,
    problemStatement,
    setProblemStatement,
    targetColumn,
    setTargetColumn,
    edaUrl,
    mlResults,
    modelPaths,
    agentOutput,
    chartPrompt,
    setChartPrompt,
    chartPayload,
    chatQuestion,
    setChatQuestion,
    chatHistory,
    busy,
    error,
    clearError,
    handleFileChange,
    handleUpload,
    handleGenerateEDA,
    handleTrainModels,
    handleRunAgent,
    handleGenerateCharts,
    handleAskChat,
    resetWorkspace,
    toFullUrl,
  } = useAutoML();

  const modelEntries = Object.entries(modelPaths);
  const typedAgent = (agentOutput ?? null) as JsonRecord | null;

  return (
    <div className="grid gap-5">
      <section className="glass-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black text-slate-900">Dataset Workspace</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Session {sessionId || "-"}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-4 transition hover:bg-orange-100">
            <CloudArrowUpIcon className="h-9 w-9 text-orange-500" />
            <div>
              <div className="font-bold text-slate-700">{file ? file.name : "Select CSV or Excel"}</div>
              <div className="text-xs text-slate-500">Accepted: .csv .xlsx .xls</div>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(event) => {
                clearError();
                handleFileChange(event);
              }}
            />
          </label>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              onClick={() => void handleUpload()}
              disabled={busy === "upload"}
              className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {busy === "upload" ? "Uploading" : "Upload"}
            </button>
            <button
              onClick={() => void handleGenerateEDA()}
              disabled={busy === "eda"}
              className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
            >
              {busy === "eda" ? "Generating" : "EDA"}
            </button>
            <button
              onClick={() => void handleTrainModels()}
              disabled={busy === "ml"}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy === "ml" ? "Training" : "Train"}
            </button>
            <button
              onClick={() => void handleRunAgent()}
              disabled={busy === "agent"}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
            >
              {busy === "agent" ? "Running" : "Agent"}
            </button>
            <button
              onClick={resetWorkspace}
              className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-300"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">File: {fileName || "Not uploaded"}</div>
          <input
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value)}
            placeholder="Session ID"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <a
            href={edaUrl ? toFullUrl(edaUrl) : "#"}
            target="_blank"
            rel="noreferrer"
            className={`rounded-xl px-3 py-2 text-center text-sm font-semibold ${
              edaUrl ? "bg-cyan-100 text-cyan-800" : "pointer-events-none bg-slate-100 text-slate-400"
            }`}
          >
            Open EDA Report
          </a>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            value={problemStatement}
            onChange={(event) => setProblemStatement(event.target.value)}
            placeholder="Problem statement (e.g. Predict if it will rain tomorrow)"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <input
            value={targetColumn}
            onChange={(event) => setTargetColumn(event.target.value)}
            placeholder="Target column (optional)"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>

        {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      </section>

      <section className="glass-panel p-5">
        <h2 className="mb-3 text-lg font-black text-slate-900">Preview</h2>
        {preview.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No rows to display.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="max-w-full overflow-x-auto" style={{ touchAction: "pan-x" }}>
              <table className="w-full min-w-[1400px] table-auto divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    {previewColumns.map((column) => (
                      <th key={column} className="min-w-[140px] whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-700">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {preview.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {previewColumns.map((column) => (
                        <td
                          key={`${column}-${rowIndex}`}
                          className="min-w-[140px] max-w-[220px] truncate whitespace-nowrap px-3 py-2 text-slate-700"
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

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-900">
            <BoltIcon className="h-5 w-5 text-amber-600" /> Agent Summary
          </h2>
          {!typedAgent ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              Run agent to see best model and metrics.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-100 p-3 text-sm"><span className="font-semibold">Status:</span> {metricValue(typedAgent, "status")}</div>
              <div className="rounded-xl bg-slate-100 p-3 text-sm"><span className="font-semibold">Problem:</span> {metricValue(typedAgent, "problem_type")}</div>
              <div className="rounded-xl bg-slate-100 p-3 text-sm"><span className="font-semibold">Target:</span> {metricValue(typedAgent, "target_variable")}</div>
              <div className="rounded-xl bg-slate-100 p-3 text-sm"><span className="font-semibold">Best model:</span> {metricValue(typedAgent, "best_model")}</div>
              <div className="rounded-xl bg-slate-100 p-3 text-sm"><span className="font-semibold">Metric:</span> {metricValue(typedAgent, "metric")}</div>
              <div className="rounded-xl bg-slate-100 p-3 text-sm"><span className="font-semibold">Best score:</span> {metricValue(typedAgent, "best_score")}</div>
            </div>
          )}
        </article>

        <article className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-900">
            <ChartBarSquareIcon className="h-5 w-5 text-indigo-600" /> Dashboard Charts
          </h2>
          <textarea
            rows={3}
            value={chartPrompt}
            onChange={(event) => setChartPrompt(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-600"
            placeholder="missing_values,correlation,distribution,bar"
          />
          <button
            onClick={() => void handleGenerateCharts()}
            disabled={busy === "charts"}
            className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy === "charts" ? "Generating" : "Generate Charts"}
          </button>

          {chartPayload && (
            <div className="mt-3 space-y-3">
              {chartPayload.length === 0 && <div className="text-sm text-slate-500">No chart payload returned.</div>}
              {chartPayload.map((rawChart, index) => {
                const chart = rawChart as JsonRecord;
                const chartType = typeof chart.type === "string" ? chart.type : `chart_${index + 1}`;
                const figure = getChartFigure(chart);

                return (
                  <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 text-sm font-semibold text-slate-700">Chart {index + 1}: {chartType}</div>
                    {figure ? (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
                        <Plot
                          data={figure.data as never[]}
                          layout={{
                            ...(figure.layout as object),
                            autosize: true,
                            margin: { l: 40, r: 20, t: 36, b: 40 },
                          }}
                          config={{ responsive: true, displaylogo: false }}
                          useResizeHandler
                          style={{ width: "100%", minHeight: "340px" }}
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-600">
                        Chart figure missing from response.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-900">
            <DocumentTextIcon className="h-5 w-5 text-emerald-700" /> Model Results
          </h2>

          {mlResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No model metrics yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    {Object.keys(mlResults[0]).map((column) => (
                      <th key={column} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-700">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {mlResults.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.keys(mlResults[0]).map((column) => (
                        <td key={`${column}-${rowIndex}`} className="whitespace-nowrap px-3 py-2 text-slate-700">
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
            <div className="mt-3 space-y-2">
              {modelEntries.map(([name, path]) => (
                <div key={`${name}-${path}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-sm font-semibold text-slate-800">{name}</div>
                  <div className="mt-1 break-all text-xs text-slate-600">{path}</div>
                  <a
                    href={toFullUrl(path)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Open File
                  </a>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-900">
            <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-teal-600" /> Dataset Q&A
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={chatQuestion}
              onChange={(event) => setChatQuestion(event.target.value)}
              placeholder="Ask a question about dataset"
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

          <div className="mt-3 max-h-80 space-y-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
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
        </article>
      </section>
    </div>
  );
}
