import { useEffect, useRef } from "react";
import {
  Chart,
  type ChartConfiguration,
  type ChartData,
  type ChartDataset,
} from "chart.js/auto";
import type { EcoModelSpec } from "./types";

export interface UseEcoChart {
  /** canvas ref，组件挂到 <canvas> 上 */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** 同步最新数据到图表并刷新（按 spec.species 顺序填充 dataset） */
  setData: (
    history: Record<string, number[]>,
    timeData: number[],
  ) => void;
  /** 完全重建图表（spec 切换时用） */
  rebuild: (
    history: Record<string, number[]>,
    timeData: number[],
  ) => void;
  /** 重置所有曲线可见性 */
  resetDatasetsVisibility: () => void;
  /** 切换某条曲线可见性 */
  toggleDataset: (index: number) => void;
}

export function useEcoChart(spec: EcoModelSpec): UseEcoChart {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<"line"> | null>(null);

  const buildDatasets = (): ChartDataset<"line">[] => {
    return spec.species.map((s) => ({
      label: s.name,
      data: [],
      borderColor: s.color,
      borderWidth: 2.8,
      tension: 0.2,
      pointRadius: 0,
      fill: false,
      yAxisID: s.axis === "left" ? "y-plant" : "y-prey",
    }));
  };

  const createChart = (): Chart<"line"> | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const left = spec.axisRanges.left;
    const right = spec.axisRanges.right;

    const config: ChartConfiguration<"line"> = {
      type: "line",
      data: {
        labels: ["0"],
        datasets: buildDatasets(),
      } as ChartData<"line">,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (c) =>
                `${c.dataset.label}: ${(c.raw as number).toFixed(1)} 个体/面积`,
            },
          },
          legend: { display: false },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "模拟时间 (相对单位)",
              color: "#3a6b3a",
              font: { weight: "bold" },
            },
            grid: { color: "#e2efda" },
          },
          "y-plant": {
            type: "linear",
            position: "left",
            title: {
              display: true,
              text: left.title,
              color: left.color,
              font: { weight: "bold" },
            },
            min: left.min,
            max: left.max,
            grid: { color: "#e2e9dc" },
            ticks: { stepSize: left.step, color: left.color },
          },
          "y-prey": {
            type: "linear",
            position: "right",
            title: {
              display: true,
              text: right.title,
              color: right.color,
              font: { weight: "bold" },
            },
            min: right.min,
            max: right.max,
            grid: { drawOnChartArea: false },
            ticks: { stepSize: right.step, color: right.color },
          },
        },
        elements: { line: { borderJoinStyle: "round" } },
      },
    };

    const instance = new Chart(ctx, config);
    chartRef.current = instance;
    return instance;
  };

  const setData = (
    history: Record<string, number[]>,
    timeData: number[],
  ) => {
    const chart = chartRef.current;
    if (!chart) return;
    spec.species.forEach((s, i) => {
      chart.data.datasets[i].data = [...(history[s.id] ?? [])];
    });
    chart.data.labels = timeData.map((t) => t.toFixed(1));
    chart.update("none");
  };

  const rebuild = (
    history: Record<string, number[]>,
    timeData: number[],
  ) => {
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
    const chart = createChart();
    if (!chart) return;
    spec.species.forEach((s, i) => {
      chart.data.datasets[i].data = [...(history[s.id] ?? [])];
    });
    chart.data.labels = timeData.map((t) => t.toFixed(1));
    chart.update();
  };

  const resetDatasetsVisibility = () => {
    const chart = chartRef.current;
    if (!chart) return;
    for (let i = 0; i < chart.data.datasets.length; i++) {
      chart.data.datasets[i].hidden = false;
    }
    chart.update();
  };

  const toggleDataset = (index: number) => {
    const chart = chartRef.current;
    if (!chart) return;
    const ds = chart.data.datasets[index];
    if (!ds) return;
    ds.hidden = !ds.hidden;
    chart.update();
  };

  // spec 切换时销毁重建
  useEffect(() => {
    createChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.id]);

  return {
    canvasRef,
    setData,
    rebuild,
    resetDatasetsVisibility,
    toggleDataset,
  };
}
