import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ArrowPathIcon, CpuChipIcon } from "@heroicons/react/24/solid";
import { useAutoML } from "../context/AutoMLContext";

function navClass(isActive: boolean): string {
  return isActive
    ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
    : "rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white";
}

export default function AppShell(): React.ReactElement {
  const { backendStatus, retryHealthCheck, sessionId } = useAutoML();

  const statusClass =
    backendStatus === "up"
      ? "bg-emerald-100 text-emerald-800"
      : backendStatus === "down"
      ? "bg-rose-100 text-rose-800"
      : "bg-amber-100 text-amber-800";

  const statusLabel = backendStatus === "checking" ? "Checking" : backendStatus === "up" ? "Connected" : "Offline";

  return (
    <div className="min-h-screen bg-spectral px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="glass-panel mb-6 p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-900 p-2.5 text-white shadow-lg shadow-slate-900/30">
                <CpuChipIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">AutoML Agnetic Studio</h1>
                <p className="mt-1 text-sm text-slate-600">Focused pages for workspace, EDA, machine learning model run, charts, and chatbot.</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 font-semibold ${statusClass}`}>Backend {statusLabel}</span>
                  {sessionId && <span className="rounded-full bg-slate-900 px-3 py-1 font-mono text-white">Session {sessionId}</span>}
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Backend Connectivity</label>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => void retryHealthCheck()}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  <ArrowPathIcon className="h-4 w-4" /> Recheck
                </button>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{statusLabel}</span>
              </div>
              {backendStatus === "down" && (
                <p className="mt-2 text-xs text-slate-500">
                  Backend is unreachable. Check server runtime or reverse proxy settings.
                </p>
              )}
            </div>
          </div>

          <nav className="mt-4 flex flex-wrap gap-2">
            <NavLink to="/" className={({ isActive }) => navClass(isActive)} end>
              Overview
            </NavLink>
            <NavLink to="/workspace" className={({ isActive }) => navClass(isActive)}>
              Data Workspace
            </NavLink>
            <NavLink to="/eda" className={({ isActive }) => navClass(isActive)}>
              EDA
            </NavLink>
            <NavLink to="/models" className={({ isActive }) => navClass(isActive)}>
              Run Machine Learning Model
            </NavLink>
            <NavLink to="/charts" className={({ isActive }) => navClass(isActive)}>
              Dashboard Charts
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => navClass(isActive)}>
              Chatbot
            </NavLink>
          </nav>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
