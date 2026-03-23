import React from "react";
import { BoltIcon, ChartBarSquareIcon, ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/solid";
import Plot from "react-plotly.js";
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

export default function IntelligencePage(): React.ReactElement {
  const {
    busy,
    agentOutput,
    chatQuestion,
    chartPrompt,
    chartPayload,
    chatHistory,
    setChatQuestion,
    setChartPrompt,
    handleRunAgent,
    handleAskChat,
    handleGenerateCharts,
    error,
  } = useAutoML();

  return (
    <div className="grid gap-5">
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-900">
            <BoltIcon className="h-5 w-5 text-amber-600" /> Agent Pipeline
          </h2>
          <button
            onClick={() => void handleRunAgent()}
            disabled={busy === "agent"}
            className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
          >
            {busy === "agent" ? "Running" : "Run /agent/run"}
          </button>
          {agentOutput && (
            <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              {JSON.stringify(agentOutput, null, 2)}
            </pre>
          )}
        </article>

        <article className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-900">
            <ChartBarSquareIcon className="h-5 w-5 text-indigo-600" /> Dashboard Charts
          </h2>
          <textarea
            rows={4}
            value={chartPrompt}
            onChange={(event) => setChartPrompt(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-600"
            placeholder="Enter chart types comma-separated (e.g. missing_values,correlation,distribution,bar)"
          />
          <button
            onClick={() => void handleGenerateCharts()}
            disabled={busy === "charts"}
            className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy === "charts" ? "Generating" : "Run /dashboard/charts"}
          </button>

          {chartPayload && (
            <div className="mt-3 space-y-2">
              {chartPayload.length === 0 && <div className="text-sm text-slate-500">No payload returned.</div>}
              {chartPayload.map((rawChart, index) => {
                const chart = rawChart as JsonRecord;
                const chartType = typeof chart.type === "string" ? chart.type : `chart_${index + 1}`;
                const chartColumn = typeof chart.column === "string" ? chart.column : "";
                const parsedFigure = getChartFigure(chart);

                return (
                  <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-700">{`Chart ${index + 1}: ${chartType}`}</div>
                      {chartColumn && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">{chartColumn}</span>}
                    </div>

                    {parsedFigure ? (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
                        <Plot
                          data={parsedFigure.data as never[]}
                          layout={{
                            ...(parsedFigure.layout as object),
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
                        Chart figure was not returned in expected format.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="glass-panel p-5">
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
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {busy === "chat" ? "Sending" : "Ask /chat"}
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
      </section>
    </div>
  );
}
