import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function PreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const preview = location.state?.preview || [];
  const fileName = location.state?.fileName || "Uploaded File";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          File Preview
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md transition"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </button>
      </div>

      {/* File Info Card */}
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-6 border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-700">{fileName}</h2>
        <p className="text-gray-500 text-sm">Showing first few rows of the dataset</p>
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
                      <td
                        key={j}
                        className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap"
                      >
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
    </div>
  );
}
