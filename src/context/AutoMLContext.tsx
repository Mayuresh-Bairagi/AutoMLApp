import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

type JsonRecord = Record<string, unknown>;
type PreviewRow = Record<string, string | number | boolean | null>;
type MLResultRecord = Record<string, unknown>;
type ChartPayload = Record<string, unknown>;
type ModelPaths = Record<string, string>;

type ChatTurn = {
  role: "user" | "assistant";
  text: string;
};

type AutoMLContextValue = {
  apiBase: string;
  backendStatus: "checking" | "up" | "down";
  retryHealthCheck: () => Promise<void>;
  file: File | null;
  fileName: string;
  preview: PreviewRow[];
  previewColumns: string[];
  sessionId: string;
  problemStatement: string;
  targetColumn: string;
  edaUrl: string;
  mlResults: MLResultRecord[];
  modelPaths: ModelPaths;
  agentOutput: JsonRecord | null;
  chatQuestion: string;
  chatHistory: ChatTurn[];
  chartPrompt: string;
  chartPayload: ChartPayload[] | null;
  busy: string;
  error: string;
  setProblemStatement: (value: string) => void;
  setTargetColumn: (value: string) => void;
  setChatQuestion: (value: string) => void;
  setChartPrompt: (value: string) => void;
  clearError: () => void;
  setSessionId: (value: string) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => Promise<void>;
  handleGenerateEDA: () => Promise<void>;
  handleTrainModels: () => Promise<void>;
  handleRunAgent: () => Promise<void>;
  handleAskChat: () => Promise<void>;
  handleGenerateCharts: () => Promise<void>;
  resetWorkspace: () => void;
  toFullUrl: (pathOrUrl: string) => string;
};

const AutoMLContext = createContext<AutoMLContextValue | undefined>(undefined);

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const asRecord = payload as Record<string, unknown>;
  const detail = asRecord.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const recordItem = item as Record<string, unknown>;
        const itemMessage = recordItem.msg;
        if (typeof itemMessage === "string") return itemMessage;
        return "";
      })
      .filter(Boolean);

    if (messages.length > 0) return messages.join("; ");
    return JSON.stringify(detail);
  }
  const message = asRecord.message;
  if (typeof message === "string") return message;
  return fallback;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function AutoMLProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [apiBase] = useState<string>(DEFAULT_API_BASE);
  const [backendStatus, setBackendStatus] = useState<"checking" | "up" | "down">("checking");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [sessionId, setSessionId] = useState<string>("");

  const [problemStatement, setProblemStatement] = useState<string>("regression");
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [edaUrl, setEdaUrl] = useState<string>("");
  const [mlResults, setMlResults] = useState<MLResultRecord[]>([]);
  const [modelPaths, setModelPaths] = useState<ModelPaths>({});

  const [agentOutput, setAgentOutput] = useState<JsonRecord | null>(null);
  const [chatQuestion, setChatQuestion] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [chartPrompt, setChartPrompt] = useState<string>("missing_values,correlation,distribution,bar");
  const [chartPayload, setChartPayload] = useState<ChartPayload[] | null>(null);

  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState<string>("");

  const previewColumns = useMemo(() => {
    if (preview.length === 0) return [] as string[];
    return Object.keys(preview[0]);
  }, [preview]);

  const toFullUrl = (pathOrUrl: string): string => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
      return pathOrUrl;
    }

    const normalizedPath = `/${pathOrUrl.replace(/^\/+/, "").replace(/\\/g, "/")}`;

    if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
      try {
        return new URL(normalizedPath, apiBase).toString();
      } catch {
        return normalizedPath;
      }
    }

    return normalizedPath;
  };

  const retryHealthCheck = async () => {
    setBackendStatus("checking");
    try {
      const resp = await fetch(`${apiBase}/`, { method: "GET" });
      setBackendStatus(resp.ok ? "up" : "down");
    } catch {
      setBackendStatus("down");
    }
  };

  useEffect(() => {
    void retryHealthCheck();
  }, [apiBase]);

  const clearError = () => setError("");

  const ensureSession = (): boolean => {
    if (!sessionId.trim()) {
      setError("Upload a dataset first or enter an existing session id.");
      return false;
    }
    return true;
  };

  const resetRunArtifacts = () => {
    setEdaUrl("");
    setMlResults([]);
    setModelPaths({});
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
      const resp = await fetch(`${apiBase}/upload`, {
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
      const resp = await fetch(`${apiBase}/eda`, {
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
    setModelPaths({});

    const body: Record<string, string> = {
      session_id: sessionId,
      problem_statement: problemStatement.trim(),
    };
    if (targetColumn.trim()) body.target_column = targetColumn.trim();

    try {
      const resp = await fetch(`${apiBase}/ml-models`, {
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
      const rawPaths = payload?.model_paths;
      const paths: ModelPaths =
        rawPaths && typeof rawPaths === "object" && !Array.isArray(rawPaths)
          ? (rawPaths as ModelPaths)
          : {};
      setMlResults(Array.isArray(results) ? results : []);
      setModelPaths(paths);
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
      const resp = await fetch(`${apiBase}/agent/run`, {
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
      const resp = await fetch(`${apiBase}/chat`, {
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

    const body: { session_id: string; chart_types?: string[] } = { session_id: sessionId };
    if (chartPrompt.trim()) {
      const chartTypes = chartPrompt
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      if (chartTypes.length > 0) {
        body.chart_types = chartTypes;
      }
    }

    try {
      const resp = await fetch(`${apiBase}/dashboard/charts`, {
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

  const resetWorkspace = () => {
    setFile(null);
    setFileName("");
    setPreview([]);
    setSessionId("");
    setError("");
    resetRunArtifacts();
  };

  const value: AutoMLContextValue = {
    apiBase,
    backendStatus,
    retryHealthCheck,
    file,
    fileName,
    preview,
    previewColumns,
    sessionId,
    problemStatement,
    targetColumn,
    edaUrl,
    mlResults,
    modelPaths,
    agentOutput,
    chatQuestion,
    chatHistory,
    chartPrompt,
    chartPayload,
    busy,
    error,
    setProblemStatement,
    setTargetColumn,
    setChatQuestion,
    setChartPrompt,
    clearError,
    setSessionId,
    handleFileChange,
    handleUpload,
    handleGenerateEDA,
    handleTrainModels,
    handleRunAgent,
    handleAskChat,
    handleGenerateCharts,
    resetWorkspace,
    toFullUrl,
  };

  return <AutoMLContext.Provider value={value}>{children}</AutoMLContext.Provider>;
}

export function useAutoML(): AutoMLContextValue {
  const ctx = useContext(AutoMLContext);
  if (!ctx) {
    throw new Error("useAutoML must be used inside AutoMLProvider");
  }
  return ctx;
}
