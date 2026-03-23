import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  BoltIcon,
  ChartBarSquareIcon,
  ChatBubbleBottomCenterTextIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

type JsonRecord = Record<string, unknown>;
type PreviewRow = Record<string, string | number | boolean | null>;
type MLResultRecord = Record<string, unknown>;
type ChartPayload = Record<string, unknown>;

type ChatTurn = {
  role: "user" | "assistant";
  text: string;
};

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const asRecord = payload as Record<string, unknown>;
  const detail = asRecord.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) return JSON.stringify(detail);
  const message = asRecord.message;
  if (typeof message === "string") return message;
  return fallback;
}

function toFullUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  if (pathOrUrl.startsWith("/")) return `${API_BASE}${pathOrUrl}`;
  return `${API_BASE}/${pathOrUrl}`;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default function AutoMLDashboard(): React.ReactElement {
  const [backendStatus, setBackendStatus] = useState<"checking" | "up" | "down">("checking");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [sessionId, setSessionId] = useState<string>("");

  const [problemStatement, setProblemStatement] = useState<string>("regression");
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [edaUrl, setEdaUrl] = useState<string>("");
  const [mlResults, setMlResults] = useState<MLResultRecord[]>([]);
  const [modelPaths, setModelPaths] = useState<string[]>([]);

  const [agentOutput, setAgentOutput] = useState<JsonRecord | null>(null);
  const [chatQuestion, setChatQuestion] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [chartPrompt, setChartPrompt] = useState<string>("Build key distribution and correlation charts.");
  const [chartPayload, setChartPayload] = useState<ChartPayload[] | null>(null);

  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState<string>("");

  const previewColumns = useMemo(() => {
    if (preview.length === 0) return [] as string[];
    return Object.keys(preview[0]);
  }, [preview]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const resp = await fetch(`${API_BASE}/`, { method: "GET" });
        setBackendStatus(resp.ok ? "up" : "down");
      } catch {
        setBackendStatus("down");
      }
    };
    void checkHealth();
  }, []);

  const ensureSession = (): boolean => {
    if (!sessionId) {
      setError("Upload a dataset first to create a session.");
      return false;
    }
    return true;
  };

  const resetRunArtifacts = () => {
    setEdaUrl("");
    setMlResults([]);
    setModelPaths([]);
    setAgentOutput(null);
    setChatHistory([]);
    setChartPayload(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const picked = event.target.files?.[0] ?? null;
    setFile(picked);
    setFileName(picked?.name ?? "");
  };

  const handleUpload = async () => {
    setError("");
    if (!file) {
      setError("Select a CSV or Excel file first.");
      return;
    }

    setBusy("upload");
    resetRunArtifacts();
    setPreview([]);
    setSessionId("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      const payload = (await safeJson(resp)) as Record<string, unknown> | null;
      if (!resp.ok) {
        setError(extractErrorMessage(payload, "Upload failed."));
        return;
      }

      const rows = (payload?.preview as PreviewRow[]) ?? [];
      const newSession =
        (payload?.session_id as string | undefined) ??
        (payload?.sessionId as string | undefined) ??
        "";
      setPreview(Array.isArray(rows) ? rows : []);
      setSessionId(newSession);
      setFileName((payload?.filename as string | undefined) ?? file.name);
    } catch {
      setError("Could not connect to backend. Verify API is running.");
    } finally {
      setBusy("");
    }
  };

  const handleGenerateEDA = async () => {
    setError("");
    if (!ensureSession()) return;
    setBusy("eda");
    setEdaUrl("");

    try {
      const resp = await fetch(`${API_BASE}/eda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const payload = (await safeJson(resp)) as Record<string, unknown> | null;
      if (!resp.ok) {
        setError(extractErrorMessage(payload, "EDA generation failed."));
        return;
      }

      const path =
        (payload?.eda_html_path as string | undefined) ??
        (payload?.report_url as string | undefined) ??
        (payload?.url as string | undefined) ??
        "";
      if (!path) {
        setError("EDA created, but no report URL was returned.");
        return;
      }
      setEdaUrl(path);
      window.open(toFullUrl(path), "_blank", "noopener,noreferrer");
    } catch {
      setError("Failed to generate EDA report.");
    } finally {
      setBusy("");
    }
  };

  const handleTrainModels = async () => {
    setError("");
    if (!ensureSession()) return;
    if (!problemStatement.trim()) {
      setError("Problem statement is required.");
      return;
    }

    setBusy("ml");
    setMlResults([]);
    setModelPaths([]);

    const body: Record<string, string> = {
      session_id: sessionId,
      problem_statement: problemStatement.trim(),
    };
    if (targetColumn.trim()) body.target_column = targetColumn.trim();

    try {
      const resp = await fetch(`${API_BASE}/ml-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await safeJson(resp)) as Record<string, unknown> | null;
      if (!resp.ok) {
        setError(extractErrorMessage(payload, "Model training failed."));
        return;
      }

      const results = (payload?.results as MLResultRecord[]) ?? [];
      const paths = (payload?.model_paths as string[]) ?? [];
      setMlResults(Array.isArray(results) ? results : []);
      setModelPaths(Array.isArray(paths) ? paths : []);
    } catch {
      setError("Training request failed.");
    } finally {
      setBusy("");
    }
  };

  const handleRunAgent = async () => {
    setError("");
    if (!ensureSession()) return;
    setBusy("agent");
    setAgentOutput(null);

    const body: Record<string, string> = { session_id: sessionId };
    if (problemStatement.trim()) body.problem_statement = problemStatement.trim();
    if (targetColumn.trim()) body.target_column = targetColumn.trim();

    try {
      const resp = await fetch(`${API_BASE}/agent/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await safeJson(resp)) as JsonRecord | null;
      if (!resp.ok) {
        setError(extractErrorMessage(payload, "Agent run failed."));
        return;
      }
      setAgentOutput(payload ?? {});
    } catch {
      setError("Agent pipeline request failed.");
    } finally {
      setBusy("");
    }
  };

  const handleAskChat = async () => {
    setError("");
    if (!ensureSession()) return;
    if (!chatQuestion.trim()) {
      setError("Enter a dataset question before sending.");
      return;
    }

    const question = chatQuestion.trim();
    setBusy("chat");
    setChatQuestion("");
    setChatHistory((prev) => [...prev, { role: "user", text: question }]);

    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question }),
      });
      const payload = (await safeJson(resp)) as Record<string, unknown> | null;
      if (!resp.ok) {
        setError(extractErrorMessage(payload, "Chat request failed."));
        return;
      }
      const answer =
        (payload?.answer as string | undefined) ??
        (payload?.response as string | undefined) ??
        (payload?.message as string | undefined) ??
        JSON.stringify(payload, null, 2);
      setChatHistory((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch {
      setError("Could not fetch chat response from backend.");
    } finally {
      setBusy("");
    }
  };

  const handleGenerateCharts = async () => {
    setError("");
    if (!ensureSession()) return;
    setBusy("charts");
    setChartPayload(null);

    const body: Record<string, string> = { session_id: sessionId };
    if (chartPrompt.trim()) body.prompt = chartPrompt.trim();

    try {
      const resp = await fetch(`${API_BASE}/dashboard/charts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await safeJson(resp)) as Record<string, unknown> | null;
      if (!resp.ok) {
        setError(extractErrorMessage(payload, "Chart generation failed."));
        return;
      }

      const charts = payload?.charts;
      if (Array.isArray(charts)) {
        setChartPayload(charts as ChartPayload[]);
      } else if (payload) {
        setChartPayload([payload as ChartPayload]);
      } else {
        setChartPayload([]);
      }
    } catch {
      setError("Failed to generate charts.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0f9ff_0%,_#fff7ed_55%,_#fffbeb_100%)] px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">AutoML Agnetic AI Frontend</h1>
              <p className="mt-1 text-sm text-slate-600">
                Upload dataset, generate EDA, train models, run agent pipeline, ask chat questions, and generate dashboard charts.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <div className="font-medium text-slate-700">API Base</div>
              <div className="font-mono text-xs text-slate-600 break-all">{API_BASE}</div>
              <div className="mt-1 text-xs">
                Backend Status:{" "}
                <span
                  className={`font-semibold ${
                    backendStatus === "up"
                      ? "text-emerald-600"
                      : backendStatus === "down"
                      ? "text-rose-600"
                      : "text-amber-600"
                  }`}
                >
                  {backendStatus === "checking" ? "Checking" : backendStatus === "up" ? "Healthy" : "Unavailable"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <label className="flex flex-1 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-4 transition hover:bg-orange-100">
              <CloudArrowUpIcon className="h-10 w-10 text-orange-500" />
              <div>
                <div className="font-semibold text-slate-700">{file ? file.name : "Choose .csv, .xlsx or .xls"}</div>
                <div className="text-xs text-slate-500">Click to select a local dataset file</div>
              </div>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
            </label>

            <button
              onClick={handleUpload}
              disabled={busy === "upload"}
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "upload" ? "Uploading" : "Upload Dataset"}
            </button>

            <button
              onClick={() => {
                setFile(null);
                setFileName("");
                setPreview([]);
                setSessionId("");
                setError("");
                resetRunArtifacts();
              }}
              className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Reset Workspace
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <span className="font-semibold text-slate-700">File:</span>{" "}
              <span className="text-slate-600">{fileName || "Not uploaded"}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <span className="font-semibold text-slate-700">Session ID:</span>{" "}
              <span className="font-mono text-slate-600 break-all">{sessionId || "-"}</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
        </section>

        <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-800">Dataset Preview</h2>
            {previewColumns.length > 10 && <span className="text-xs text-slate-600">Use touchpad horizontal swipe to view all columns.</span>}
          </div>

          {preview.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              Upload a dataset to view preview rows.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="max-w-full overflow-x-auto" style={{ touchAction: "pan-x" }}>
                <table className="w-full min-w-[1400px] table-fixed divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-100">
                  <tr>
                    {previewColumns.map((column) => (
                      <th key={column} className="whitespace-nowrap px-4 py-2 text-left font-semibold text-slate-700">
                        {column}
                      </th>
                    ))}
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {preview.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-slate-50">
                        {previewColumns.map((column) => (
                          <td key={`${column}-${rowIndex}`} className="max-w-44 truncate whitespace-nowrap px-4 py-2 text-slate-700" title={String(row[column] ?? "")}>
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

        <section className="mb-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
              <DocumentTextIcon className="h-5 w-5 text-cyan-600" />
              EDA and Model Training
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleGenerateEDA}
                disabled={busy === "eda"}
                className="w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "eda" ? "Generating EDA" : "Generate EDA Report"}
              </button>

              {edaUrl && (
                <a
                  href={toFullUrl(edaUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-xl bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-200"
                >
                  Open EDA HTML
                </a>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={problemStatement}
                  onChange={(event) => setProblemStatement(event.target.value)}
                  placeholder="classification or regression"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-cyan-500"
                />
                <input
                  value={targetColumn}
                  onChange={(event) => setTargetColumn(event.target.value)}
                  placeholder="Optional target column"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleTrainModels}
                disabled={busy === "ml"}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "ml" ? "Training Models" : "Run /ml-models"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
              <BoltIcon className="h-5 w-5 text-amber-600" />
              Agentic Pipeline
            </h3>
            <p className="mb-3 text-sm text-slate-600">
              Executes the full LangGraph workflow via /agent/run using current session context.
            </p>
            <button
              onClick={handleRunAgent}
              disabled={busy === "agent"}
              className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "agent" ? "Running Agent" : "Run Agent Pipeline"}
            </button>
            {agentOutput && (
              <pre className="mt-3 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                {JSON.stringify(agentOutput, null, 2)}
              </pre>
            )}
          </div>
        </section>

        <section className="mb-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-teal-600" />
              Dataset Q&A
            </h3>
            <div className="mb-3 flex gap-2">
              <input
                value={chatQuestion}
                onChange={(event) => setChatQuestion(event.target.value)}
                placeholder="Ask about trends, anomalies, or feature relationships"
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
              <button
                onClick={handleAskChat}
                disabled={busy === "chat"}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "chat" ? "Sending" : "Ask"}
              </button>
            </div>

            <div className="max-h-72 space-y-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
              {chatHistory.length === 0 && <div className="text-sm text-slate-500">No messages yet.</div>}
              {chatHistory.map((turn, index) => (
                <div
                  key={`${turn.role}-${index}`}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    turn.role === "user" ? "bg-teal-100 text-teal-800" : "bg-white text-slate-700"
                  }`}
                >
                  <div className="mb-1 text-xs font-semibold uppercase opacity-70">{turn.role}</div>
                  <div className="whitespace-pre-wrap">{turn.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
              <ChartBarSquareIcon className="h-5 w-5 text-indigo-600" />
              Dashboard Chart Specs
            </h3>
            <textarea
              value={chartPrompt}
              onChange={(event) => setChartPrompt(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="Describe chart requirements for backend to generate Plotly specifications"
            />
            <button
              onClick={handleGenerateCharts}
              disabled={busy === "charts"}
              className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "charts" ? "Generating Charts" : "Run /dashboard/charts"}
            </button>

            {chartPayload && (
              <div className="mt-3 space-y-2">
                {chartPayload.length === 0 && <div className="text-sm text-slate-500">No chart payload returned.</div>}
                {chartPayload.map((chart, index) => {
                  const title =
                    (chart.title as string | undefined) ??
                    (chart.name as string | undefined) ??
                    `Chart ${index + 1}`;
                  const type = (chart.type as string | undefined) ?? "unknown";
                  return (
                    <details key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                        {title} • {type}
                      </summary>
                      <pre className="mt-2 max-h-48 overflow-auto text-xs text-slate-700">
                        {JSON.stringify(chart, null, 2)}
                      </pre>
                    </details>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
            <DocumentTextIcon className="h-5 w-5 text-emerald-700" />
            Model Training Output
          </h3>

          {busy === "ml" && (
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Model training is running
            </div>
          )}

          {mlResults.length > 0 ? (
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
                    <tr key={rowIndex} className="hover:bg-slate-50">
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
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No model metrics yet.
            </div>
          )}

          {modelPaths.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Saved Model Files</h4>
              {modelPaths.map((path, index) => (
                <div
                  key={`${path}-${index}`}
                  className="flex flex-col items-start justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm sm:flex-row sm:items-center"
                >
                  <span className="break-all text-slate-700">{path}</span>
                  <a
                    href={toFullUrl(path)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                  >
                    Open File
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
