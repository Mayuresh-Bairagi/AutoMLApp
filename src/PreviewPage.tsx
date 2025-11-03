import React, { useState } from "react";
import { CloudArrowUpIcon, ArrowPathIcon, DocumentTextIcon } from "@heroicons/react/24/solid";


const BACKEND = "http://localhost:8000";

type PreviewRow = Record<string, any>;

type UploadResponse = {
  filename: string;
  preview: PreviewRow[];
  session_id: string;
};

type EDAResponse = {
  session_id: string;
  eda_html_path: string;
};

type MLResultRecord = Record<string, any>; // depends on your results_df columns

type MLModelsResponse = {
  session_id: string;
  results: MLResultRecord[];
  model_paths: string[]; // could be relative like "data/session_id/file.pkl" or full URL
};

export default function AutoMLDashboard(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [loadingUpload, setLoadingUpload] = useState<boolean>(false);
  const [loadingEDA, setLoadingEDA] = useState<boolean>(false);
  const [edaUrl, setEdaUrl] = useState<string>("");
  const [problemStatement, setProblemStatement] = useState<string>("regression");
  const [loadingML, setLoadingML] = useState<boolean>(false);
  const [mlResults, setMlResults] = useState<MLResultRecord[]>([]);
  const [modelPaths, setModelPaths] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  // helpers
  const getFullUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    // backend serves static files under /data -> ensure full absolute path
    if (path.startsWith("/")) return `${BACKEND}${path}`;
    return `${BACKEND}/${path}`;
  };

  // File select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFileName(f?.name ?? "");
    // Reset preview/previous state
    setPreview([]);
    setSessionId("");
    setEdaUrl("");
    setMlResults([]);
    setModelPaths([]);
  };

  // Upload
  const handleUpload = async () => {
    setError("");
    if (!file) {
      setError("Please select a CSV or Excel file first.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    setLoadingUpload(true);
    setPreview([]);
    setEdaUrl("");
    setSessionId("");
    setMlResults([]);
    setModelPaths([]);

    try {
      const resp = await fetch(`${BACKEND}/upload`, {
        method: "POST",
        body: fd,
      });
      const data: UploadResponse | { detail?: string } = await resp.json();
      if (!resp.ok) {
        const msg = (data as any).detail || "Upload failed";
        setError(msg);
        return;
      }
      setPreview((data as UploadResponse).preview || []);
      setFileName((data as UploadResponse).filename || file.name);
      setSessionId((data as UploadResponse).session_id || "");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Failed to connect to backend. Is it running on http://localhost:8000 ?");
    } finally {
      setLoadingUpload(false);
    }
  };

  // Generate EDA
  const handleGenerateEDA = async () => {
    setError("");
    if (!sessionId) {
      setError("Upload a dataset first to generate EDA.");
      return;
    }
    setLoadingEDA(true);
    setEdaUrl("");
    try {
      const resp = await fetch(`${BACKEND}/eda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data: EDAResponse | { detail?: string } = await resp.json();
      if (!resp.ok) {
        setError((data as any).detail || "EDA generation failed");
        return;
      }
      const url = (data as EDAResponse).eda_html_path || `${BACKEND}/data/${sessionId}/index.html`;
      setEdaUrl(url);
      // open automatically in new tab (optional) - comment out if you want manual open
      window.open(getFullUrl(url), "_blank");
    } catch (err) {
      console.error("EDA error:", err);
      setError("Failed to generate EDA. Check backend logs.");
    } finally {
      setLoadingEDA(false);
    }
  };

  // Train ML models
  const handleTrainModels = async () => {
    setError("");
    if (!sessionId) {
      setError("Upload dataset first before training models.");
      return;
    }
    if (!problemStatement || problemStatement.trim().length === 0) {
      setError("Provide a problem statement (e.g., regression, classification).");
      return;
    }

    setLoadingML(true);
    setMlResults([]);
    setModelPaths([]);

    try {
      const resp = await fetch(`${BACKEND}/ml-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, problem_statement: problemStatement }),
      });
      const data: MLModelsResponse | { detail?: string } = await resp.json();
      if (!resp.ok) {
        setError((data as any).detail || "Model training failed");
        return;
      }
      const mr = data as MLModelsResponse;
      setMlResults(mr.results || []);
      setModelPaths(mr.model_paths || []);
      // Optionally show success toast or auto-download first model
    } catch (err) {
      console.error("ML training error:", err);
      setError("Failed to start model training. Check backend logs.");
    } finally {
      setLoadingML(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">AutoML Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Upload dataset → preview → generate EDA → train ML models
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Backend:</p>
            <p className="text-sm font-mono text-gray-600">{BACKEND}</p>
          </div>
        </header>

        {/* Upload */}
        <section className="mb-6">
          <label className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 transition cursor-pointer">
            <CloudArrowUpIcon className="h-12 w-12 text-purple-600" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="text-gray-700 font-medium">
                  {file ? file.name : "Choose a CSV / Excel file"}
                </div>
                {file && (
                  <div className="text-xs text-gray-500 font-mono ml-2">({file.type || "file"})</div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Click here or drag & drop (drag & drop not implemented — click to choose)
              </div>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleUpload}
              disabled={loadingUpload}
              className={`px-4 py-2 rounded-lg text-white font-medium ${
                loadingUpload ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {loadingUpload ? (
                <span className="flex items-center gap-2">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                "Upload & Preview"
              )}
            </button>

            <button
              onClick={() => {
                setFile(null);
                setFileName("");
                setPreview([]);
                setSessionId("");
                setEdaUrl("");
                setMlResults([]);
                setModelPaths([]);
                setError("");
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Reset
            </button>
          </div>

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </section>

        {/* Preview */}
        <section className="mb-6">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-700">{fileName || "No file uploaded"}</div>
                  <div className="text-xs text-gray-500">Session: <span className="font-mono">{sessionId || "-"}</span></div>
                </div>
                <div className="text-xs text-gray-500">Preview (top rows)</div>
              </div>
            </div>

            <div className="p-4">
              {preview.length === 0 ? (
                <div className="text-sm text-gray-500">No preview available. Upload a file to see the preview.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        {Object.keys(preview[0]).map((col) => (
                          <th key={col} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* EDA & ML Controls */}
        <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* EDA */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Exploratory Data Analysis (EDA)</h3>
            <p className="text-xs text-gray-500 mb-3">Generate and open an interactive EDA HTML report.</p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateEDA}
                disabled={loadingEDA}
                className={`px-3 py-2 rounded-md text-white font-medium ${
                  loadingEDA ? "bg-purple-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loadingEDA ? "Generating..." : "Generate EDA"}
              </button>

              {edaUrl && (
                <a
                  href={getFullUrl(edaUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                >
                  Open EDA Report
                </a>
              )}
            </div>
          </div>

          {/* ML Models */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Train ML Models</h3>
            <p className="text-xs text-gray-500 mb-3">
              Provide a short problem statement (e.g., <code>regression</code>, <code>classification</code>).
            </p>

            <div className="flex flex-col gap-2">
              <input
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="e.g., regression"
                className="px-3 py-2 border rounded-md"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTrainModels}
                  disabled={loadingML}
                  className={`px-3 py-2 rounded-md text-white font-medium ${
                    loadingML ? "bg-purple-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {loadingML ? "Training..." : "Train Models"}
                </button>

                <button
                  onClick={() => {
                    setMlResults([]);
                    setModelPaths([]);
                  }}
                  className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
                >
                  Clear Results
                </button>
              </div>

              <div className="text-xs text-gray-400">Training may take time depending on your backend setting.</div>
            </div>
          </div>
        </section>

        {/* ML Results */}
        <section>
          {loadingML && (
            <div className="text-sm text-gray-600 mb-2">Training in progress... check backend logs for more details.</div>
          )}

          {mlResults.length > 0 && (
            <div className="mb-4 border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 border-b">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Model Training Results</h4>
                </div>
              </div>

              <div className="p-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      {Object.keys(mlResults[0]).map((col) => (
                        <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mlResults.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-3 py-2 text-sm text-gray-700">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {modelPaths.length > 0 && (
            <div className="mb-4 border rounded-lg p-4 bg-white">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Model Files</h4>
              <div className="flex flex-col gap-2">
                {modelPaths.map((p, idx) => {
                  const url = getFullUrl(p);
                  return (
                    <div key={idx} className="flex items-center justify-between gap-4">
                      <div className="text-sm text-gray-700 break-all">{p}</div>
                      <div className="flex items-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                        >
                          Open
                        </a>
                        <button
                          onClick={() => {
                            // force download by opening the url (server must set proper headers)
                            window.open(url, "_blank");
                          }}
                          className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
