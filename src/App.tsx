import { useMemo, useState } from "react";
import { getModel, DEFAULT_MODEL_ID } from "./eco/models";
import { useEcoSimulation } from "./eco/useEcoSimulation";
import { useEcoChart } from "./eco/useEcoChart";
import { ChartPanel } from "./components/ChartPanel";
import { ModelSelector } from "./components/ModelSelector";
import { InfoModal } from "./components/InfoModal";
import { EcoTunerModal } from "./components/EcoTunerModal";
import { AgentChatDrawer } from "./components/ai/AgentChatDrawer";
import { useEcoAgent } from "./components/ai/useEcoAgent";

export function App() {
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const spec = useMemo(() => getModel(modelId), [modelId]);

  const sim = useEcoSimulation(spec);
  const chart = useEcoChart(spec);
  const agent = useEcoAgent(sim);

  const [infoOpen, setInfoOpen] = useState(false);
  const [tunerOpen, setTunerOpen] = useState(false);
  const [aiCollapsed, setAiCollapsed] = useState(false);

  const handleModelChange = (id: string) => {
    setModelId(id);
  };

  return (
    <div className="app-shell">
      <div className="dashboard">
        <div className="title-row">
          <h1>植物、雪兔和猞猁种群的周期性波动</h1>
          <div className="title-actions">
            <ModelSelector value={modelId} onChange={handleModelChange} />
            <button
              className="info-btn"
              onClick={() => setInfoOpen(true)}
              aria-label="模型说明"
            >
              i
            </button>
          </div>
        </div>

        <div className="main-layout">
          <ChartPanel
            sim={sim}
            chart={chart}
            onOpenTuner={() => setTunerOpen(true)}
          />
          <AgentChatDrawer
            agent={agent}
            collapsed={aiCollapsed}
            onToggle={() => setAiCollapsed((c) => !c)}
          />
        </div>
      </div>

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      <EcoTunerModal
        spec={spec}
        currentParams={sim.params}
        open={tunerOpen}
        onClose={() => setTunerOpen(false)}
        onApply={(p) => sim.applyParams(p)}
      />
    </div>
  );
}
