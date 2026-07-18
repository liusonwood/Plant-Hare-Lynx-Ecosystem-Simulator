import type { EcoModelSpec } from "../types";
import { lotkaVolterra3 } from "./lotkaVolterra3";

/**
 * 已注册的所有模型。新增模型只需在此注册，ModelSelector 自动出现新选项。
 * derivatives / Chart / Legend / Disturb / Tuner / AI 工具均按 spec 动态渲染，无需改动。
 */
export const MODELS: Record<string, EcoModelSpec> = {
  [lotkaVolterra3.id]: lotkaVolterra3,
};

/** 默认模型 id */
export const DEFAULT_MODEL_ID = lotkaVolterra3.id;

export function getModel(id: string): EcoModelSpec {
  const m = MODELS[id];
  if (!m) throw new Error(`未知模型 id: ${id}`);
  return m;
}
