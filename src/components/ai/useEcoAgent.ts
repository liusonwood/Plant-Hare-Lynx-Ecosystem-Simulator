import { useMemo, useRef } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import type { UIMessage } from "ai";
import type { UseEcoSimulation } from "../../eco/useEcoSimulation";
import { executeTool, type EcoApi } from "../../tools/ecoTools";

export interface UseEcoAgent {
  messages: UIMessage[];
  status: "ready" | "submitted" | "streaming" | "error" | string;
  isStreaming: boolean;
  sendMessage: (text: string) => void;
  clearHistory: () => void;
}

/**
 * 组合 useAgent + useAgentChat，把 5 个生态工具接到浏览器实时状态。
 *
 * 工具执行位置：浏览器（onToolCall），通过 addToolOutput 回传结果，
 * autoContinueAfterToolResult 默认 true 自动续轮。
 *
 * "必须先 Read"：会话级 hasRead ref，set 前置校验。
 */
export function useEcoAgent(sim: UseEcoSimulation): UseEcoAgent {
  const sessionId = useMemo(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }, []);

  const agent = useAgent({
    agent: "EcoChat",
    name: sessionId,
  });

  const hasRead = useRef(false);

  // 构造 EcoApi，使用 ref 持有最新 sim 状态避免闭包陷阱
  const simRef = useRef(sim);
  simRef.current = sim;

  const api: EcoApi = useMemo(
    () => ({
      get spec() {
        return simRef.current.spec;
      },
      get populations() {
        return simRef.current.populations;
      },
      get currentTime() {
        return simRef.current.currentTime;
      },
      get simulationRunning() {
        return simRef.current.simulationRunning;
      },
      get simulationActive() {
        return simRef.current.simulationActive;
      },
      hasRead,
      setPopulation: (vals) => simRef.current.setPopulation(vals),
      startSimulation: () => simRef.current.startSimulation(),
      pauseSimulation: () => simRef.current.pauseSimulation(),
      fullReset: () => simRef.current.fullReset(),
    }),
    [],
  );

  const { messages, sendMessage, status, isStreaming, clearHistory } =
    useAgentChat({
      agent,
      autoContinueAfterToolResult: true,
      onToolCall: async ({ toolCall, addToolOutput }) => {
        const toolName = toolCall.toolName;
        // toolCall.input 由 SDK 提供（类型 unknown），animal-population-set 为对象
        const args =
          (toolCall.input && typeof toolCall.input === "object"
            ? toolCall.input
            : {}) as Record<string, unknown>;

        try {
          const output = executeTool(toolName, args, api);
          addToolOutput({
            toolCallId: toolCall.toolCallId,
            output: output as Record<string, unknown>,
          });
        } catch (err) {
          addToolOutput({
            toolCallId: toolCall.toolCallId,
            output: {
              error: `工具执行失败: ${err instanceof Error ? err.message : String(err)}`,
            },
          });
        }
      },
    });

  const send = (text: string) => {
    sendMessage({ text });
  };

  return {
    messages,
    status,
    isStreaming,
    sendMessage: send,
    clearHistory,
  };
}
