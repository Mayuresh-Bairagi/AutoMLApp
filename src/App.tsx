import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppShell from "./layout/AppShell";
import HomePage from "./pages/HomePage";
import WorkspacePage from "./pages/WorkspacePage";
import EdaPage from "./pages/EdaPage";
import ModelsPage from "./pages/ModelsPage";
import ChartsPage from "./pages/ChartsPage";
import ChatPage from "./pages/ChatPage";
import { AutoMLProvider } from "./context/AutoMLContext";

export default function App() {
  return (
    <AutoMLProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="eda" element={<EdaPage />} />
            <Route path="models" element={<ModelsPage />} />
            <Route path="charts" element={<ChartsPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
        </Routes>
      </Router>
    </AutoMLProvider>
  );
}
