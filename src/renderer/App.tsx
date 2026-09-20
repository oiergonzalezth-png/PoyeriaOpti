import React, { useState } from "react";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import type { SectionId } from "./navigation";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import Processes from "./pages/Processes";
import Startup from "./pages/Startup";
import BackupRestore from "./pages/BackupRestore";
import Optimizer from "./pages/Optimizer";
import Gaming from "./pages/Gaming";
import Network from "./pages/Network";
import Benchmark from "./pages/Benchmark";
import Settings from "./pages/Settings";
import "./App.css";

/** Sub-page IDs for sections that have sub-menus */
export type OptimizerTab = "red" | "sistema" | "general";
export type GamingTab    = "detectados" | "perfiles";

export default function App(): React.JSX.Element {
  const [active, setActive] = useState<SectionId>("dashboard");
  const [optimizerTab, setOptimizerTab] = useState<OptimizerTab>("red");
  const [gamingTab, setGamingTab]       = useState<GamingTab>("detectados");

  function handleSubSelect(sectionId: SectionId, subId: string): void {
    if (sectionId === "optimizer") setOptimizerTab(subId as OptimizerTab);
    if (sectionId === "gaming")    setGamingTab(subId as GamingTab);
  }

  // Derive activeSubId for Sidebar highlight
  const activeSubId =
    active === "optimizer" ? optimizerTab :
    active === "gaming"    ? gamingTab    :
    undefined;

  function renderSection(): React.JSX.Element {
    switch (active) {
      case "dashboard":
        return <Dashboard onNavigate={setActive} />;
      case "scan":
        return <Scan />;
      case "processes":
        return <Processes />;
      case "startup":
        return <Startup />;
      case "backup":
        return <BackupRestore />;
      case "optimizer":
        return <Optimizer activeTab={optimizerTab} onTabChange={setOptimizerTab} />;
      case "gaming":
        return <Gaming activeTab={gamingTab} onTabChange={setGamingTab} />;
      case "network":
        return <Network />;
      case "benchmark":
        return <Benchmark />;
      case "settings":
        return <Settings />;
    }
  }

  return (
    <div className="app-root">
      <TitleBar />
      <div className="app-shell">
        <Sidebar
          active={active}
          onSelect={setActive}
          activeSubId={activeSubId}
          onSubSelect={handleSubSelect}
        />
        <main className="app-main">
          <ErrorBoundary resetKey={active}>{renderSection()}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
