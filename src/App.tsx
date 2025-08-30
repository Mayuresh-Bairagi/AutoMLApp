import { useState } from "react";
import {
  ArrowUpTrayIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PreviewPage from "./PreviewPage";

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const formData = new FormData();
      formData.append("file", selectedFile);

      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.preview) {
          setPreview(data.preview);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 flex flex-col items-center p-8"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          CSV & Excel Previewer
        </h1>
        <p className="text-gray-500">
          Upload your spreadsheet files and preview them beautifully
        </p>
      </div>

      {/* Upload Card */}
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition">
          <ArrowUpTrayIcon className="h-12 w-12 text-blue-500 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Upload CSV or Excel file
          </p>
          <label className="cursor-pointer">
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
              Choose File
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* File Info */}
        {file && (
          <div className="mt-6 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <DocumentChartBarIcon className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-gray-800 font-medium">{file.name}</p>
              <p className="text-gray-500 text-sm">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        )}

        {/* Preview Button */}
        <AnimatePresence>
          {preview.length > 0 && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <button
                onClick={() => navigate("/preview", { state: { preview } })}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
              >
                Show Preview
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Animated Loader */}
      {loading && (
        <div className="mt-6 flex items-center gap-3 text-gray-600 justify-center">
          <motion.svg
            className="h-6 w-6 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v2m0 12v2m8-8h2M4 12H2m15.364-7.364l1.414 1.414M6.343 17.657l-1.414 1.414M17.657 17.657l1.414-1.414M6.343 6.343L4.929 4.929"
            />
          </motion.svg>
          <p className="text-lg font-medium">Cleaning the data...</p>
        </div>
      )}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<UploadPage />} />
        <Route
          path="/preview"
          element={
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <PreviewPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
