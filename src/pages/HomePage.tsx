import React from "react";
import { Link } from "react-router-dom";
import { BoltIcon, ChartBarSquareIcon, CloudArrowUpIcon } from "@heroicons/react/24/solid";

const cards = [
  {
    title: "Data Workspace",
    text: "Upload dataset and preview rows in a clean workspace.",
    icon: CloudArrowUpIcon,
    href: "/workspace",
    accent: "bg-amber-100 text-amber-700",
  },
  {
    title: "EDA",
    text: "Generate and open exploratory data report on a dedicated page.",
    icon: BoltIcon,
    href: "/eda",
    accent: "bg-cyan-100 text-cyan-700",
  },
  {
    title: "Run Machine Learning Model",
    text: "Provide problem statement and optional target variable to train and view model output.",
    icon: BoltIcon,
    href: "/models",
    accent: "bg-teal-100 text-teal-700",
  },
  {
    title: "Dashboard Charts",
    text: "Generate and view all returned charts in a dedicated full-page layout.",
    icon: ChartBarSquareIcon,
    href: "/charts",
    accent: "bg-indigo-100 text-indigo-700",
  },
  {
    title: "Dataset Chatbot",
    text: "Use a clean full-page chat experience for dataset questions and answers.",
    icon: BoltIcon,
    href: "/chat",
    accent: "bg-emerald-100 text-emerald-700",
  },
];

export default function HomePage(): React.ReactElement {
  return (
    <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.title} className="glass-panel p-5">
            <div className={`inline-flex rounded-xl p-2 ${card.accent}`}>
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mt-3 text-lg font-bold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.text}</p>
            <Link
              to={card.href}
              className="mt-5 inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Open
            </Link>
          </article>
        );
      })}
    </section>
  );
}
