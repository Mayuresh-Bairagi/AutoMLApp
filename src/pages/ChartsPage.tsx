import React from "react";
import Plot from "react-plotly.js";
import { ChartBarSquareIcon } from "@heroicons/react/24/solid";
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

export default function ChartsPage(): React.ReactElement {
  const { busy, chartPrompt, setChartPrompt, chartPayload, handleGenerateCharts, error } = useAutoML();

  return (
    <section className="glass-panel p-5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-900">
        <ChartBarSquareIcon className="h-5 w-5 text-indigo-600" /> Dashboard Charts
      </h2>

      {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

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

      {!chartPayload && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          Generate charts to see full-page visualizations.
        </div>
      )}

      {chartPayload && (
        <div className="mt-4 grid gap-4">
          {chartPayload.length === 0 && <div className="text-sm text-slate-500">No chart payload returned.</div>}
          {chartPayload.map((rawChart, index) => {
            const chart = rawChart as JsonRecord;
            const chartType = typeof chart.type === "string" ? chart.type : `chart_${index + 1}`;
            const chartColumn = typeof chart.column === "string" ? chart.column : "";
            const figure = getChartFigure(chart);

            return (
              <article key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-800">Chart {index + 1}: {chartType}</h3>
                  {chartColumn && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">{chartColumn}</span>}
                </div>
                {figure ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 p-2">
                    <Plot
                      data={figure.data as never[]}
                      layout={{
                        ...(figure.layout as object),
                        autosize: true,
                        margin: { l: 45, r: 20, t: 40, b: 45 },
                      }}
                      config={{ responsive: true, displaylogo: false }}
                      useResizeHandler
                      style={{ width: "100%", minHeight: "460px" }}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                    Chart figure missing from response.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
