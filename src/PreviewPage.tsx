import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function PreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const preview = location.state?.preview || [];
  const fileName = location.state?.fileName || "Uploaded File";
  const sessionId = location.state?.sessionId;

  const [loading, setLoading] = useState(false);
  const [edaResponse, setEdaResponse] = useState<string>(""); // Store API response

  const handleGenerateEDA = async () => {
    if (!sessionId) return;
    setLoading(true);
    setEdaResponse(""); // Reset previous response
    try {
      const res = await fetch("http://localhost:8000/eda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();

      if (data.eda_html_path) {
        setEdaResponse(`eda_html_path: ${data.eda_html_path}`);
      } else {
        setEdaResponse(JSON.stringify(data));
      }
    } catch (err) {
      setEdaResponse(`Error: ${err}`);
      console.error("Failed to get EDA report", err);
    } finally {
      setLoading(false);
    }
  };

  const getEDAUrl = () => {
    if (!edaResponse.includes("eda_html_path")) return "#";
    // Extract folder and filename
    const pathParts = edaResponse.replace("eda_html_path: ", "").split("\\");
    const filename = pathParts.pop();
    const folder = pathParts.slice(-1)[0]; // session folder
    return `http://localhost:8000/data/${folder}/${filename}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">File Preview</h1>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md transition"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </button>
      </div>

      {/* File Info */}
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-6 border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-700">{fileName}</h2>
        <p className="text-gray-500 text-sm">Showing first few rows of the dataset</p>
        {sessionId && <p className="text-gray-500 text-sm">Session ID: {sessionId}</p>}
      </div>

      {/* Preview Table */}
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200">
        {preview.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(preview[0]).map((col, i) => (
                    <th
                      key={i}
                      className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {preview.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    {Object.values(row).map((val: any, j: number) => (
                      <td key={j} className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">No data available</div>
        )}
      </div>

      {/* Generate EDA Button and Response */}
      {sessionId && (
        <div className="mt-6 text-center">
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-6 w-6 text-purple-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 010 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                ></path>
              </svg>
              <span className="text-purple-600 font-medium">Generating EDA...</span>
            </div>
          ) : (
            <button
              onClick={handleGenerateEDA}
              className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg shadow hover:bg-purple-700 transition"
            >
              Generate EDA Report
            </button>
          )}

          {/* Show API response */}
          {edaResponse && (
            <div className="mt-4 text-left max-w-6xl mx-auto bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700 font-medium mb-2">API Response:</p>
              <pre className="text-sm text-gray-600">{edaResponse}</pre>
              {edaResponse.includes("eda_html_path") && (
                <button
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
                  onClick={() => window.open(getEDAUrl(), "_blank")}
                >
                  Open EDA Report
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
