import type {
  EcoModelSpec,
  EcoParams,
  Populations,
  Derivatives,
} from "./types";

/**
 * 按 EcoModelSpec 动态计算各物种的 dN/dt。
 *
 * 通用规则（v1 实现 predation + logistic 自限 + 物种自然死亡率）：
 *  - 每物种初始 rate = 0
 *  - hasLogistic 物种：rate += r·N·(1 - N/K)
 *  - 物种 deathRate：rate += -deathRate·N
 *  - predation 关系 (prey, predator)：
 *      d[prey]     += -a·prey·predator
 *      d[predator] += +e·a·prey·predator
 *      若 predatorDeathRate 存在：d[predator] += -m·predator
 *
 * v1 lotkaVolterra3 spec 下输出与原 index.html 方程完全等价：
 *   plant: r·P·(1-P/K) - a·P·H
 *   hare:  e·a·P·H - d·H - b·H·L
 *   lynx:  f·b·H·L - m·L
 */
export function derivatives(
  spec: EcoModelSpec,
  params: EcoParams,
  pops: Populations,
): Derivatives {
  const d: Derivatives = {};

  // 1. 每物种的自有项（logistic 自限 + 自然死亡率）
  for (const s of spec.species) {
    let rate = 0;
    const N = pops[s.id] ?? 0;

    if (s.hasLogistic && s.growthRate && s.carryingCapacity) {
      const r = params[s.growthRate];
      const K = params[s.carryingCapacity];
      rate += r * N * (1 - N / K);
    }

    if (s.deathRate) {
      const deathRate = params[s.deathRate];
      rate -= deathRate * N;
    }

    d[s.id] = rate;
  }

  // 2. 关系项
  for (const rel of spec.relations) {
    if (rel.type === "predation") {
      const a = params[rel.predationRate];
      const e = params[rel.conversionEfficiency];
      const preyN = pops[rel.prey] ?? 0;
      const predN = pops[rel.predator] ?? 0;
      const interaction = a * preyN * predN;

      // 被捕食者减少
      d[rel.prey] = (d[rel.prey] ?? 0) - interaction;

      // 捕食者增长（转化效率）
      d[rel.predator] = (d[rel.predator] ?? 0) + e * interaction;

      // 捕食者死亡率（顶级捕食者，如猞猁 m）
      if (rel.predatorDeathRate) {
        const m = params[rel.predatorDeathRate];
        d[rel.predator] = (d[rel.predator] ?? 0) - m * predN;
      }
    }
    // 未来扩展：
    // else if (rel.type === "competition") { ... }
    // else if (rel.type === "mutualism") { ... }
  }

  return d;
}
