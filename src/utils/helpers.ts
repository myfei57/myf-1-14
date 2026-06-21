import { v4 as uuidv4 } from 'uuid';
import type {
  Part,
  PartType,
  Rarity,
  Robot,
  Mission,
  GameConfig,
  MissionRecord,
  RepairRecord,
  EthicsRecord,
  ExhibitionRecord,
  IdentityTag,
  IdentityTagId,
  IdentityStats,
  ReputationTier,
  TagEvaluation,
  TimelineEvent,
  RobotIdentityResult,
  MissionRecommendation,
  MissionType,
  Exhibition,
} from '../types';
import {
  PART_TEMPLATES,
  MISSIONS,
  IDENTITY_TAGS,
  REPUTATION_TIERS,
  IDENTITY_BASE_REPUTATION,
} from '../data/defaultConfig';

const PART_TYPES: PartType[] = ['head', 'body', 'arm', 'leg', 'core', 'tool'];
const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const SET_BONUS_OPTIONS = [null, 'industrial', 'stealth', 'combat', 'medical'];

export function generateId(): string {
  return uuidv4();
}

export function getRandomRarity(config: GameConfig, minRarity?: Rarity): Rarity {
  const rarities = Object.entries(config.rarities) as [Rarity, typeof config.rarities[Rarity]][];
  
  let filteredRarities = rarities;
  if (minRarity) {
    const minIndex = RARITY_ORDER.indexOf(minRarity);
    filteredRarities = rarities.filter(([r]) => RARITY_ORDER.indexOf(r) >= minIndex);
  }

  const totalProb = filteredRarities.reduce((sum, [, cfg]) => sum + cfg.probability, 0);
  let random = Math.random() * totalProb;

  for (const [rarity, cfg] of filteredRarities) {
    random -= cfg.probability;
    if (random <= 0) return rarity;
  }

  return filteredRarities[filteredRarities.length - 1][0];
}

export function getRarityMultiplier(rarity: Rarity): number {
  const multipliers: Record<Rarity, number> = {
    common: 1,
    uncommon: 1.5,
    rare: 2,
    epic: 3,
    legendary: 5,
  };
  return multipliers[rarity];
}

export function generateRandomPart(config: GameConfig, minRarity?: Rarity): Part {
  const type = PART_TYPES[Math.floor(Math.random() * PART_TYPES.length)];
  const rarity = getRandomRarity(config, minRarity);
  const multiplier = getRarityMultiplier(rarity);
  
  const templates = PART_TEMPLATES[type];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const setBonus = rarity !== 'common' && Math.random() < 0.3
    ? SET_BONUS_OPTIONS[Math.floor(Math.random() * SET_BONUS_OPTIONS.length)]
    : null;

  const baseWeight = Math.floor(Math.random() * 15) + 5;
  const baseEnergy = Math.floor(Math.random() * 15) + 5;
  const baseSkill = Math.floor(Math.random() * 3);
  const baseDurability = Math.floor(Math.random() * 30) + 40;

  const compatibility: PartType[] = PART_TYPES.filter(
    () => Math.random() < 0.7
  );

  return {
    id: generateId(),
    name: template.name,
    type,
    rarity,
    weight: Math.floor(baseWeight * multiplier),
    energy: Math.floor(baseEnergy * multiplier),
    skillSlots: Math.floor(baseSkill * multiplier) + (rarity === 'legendary' ? 2 : 0),
    compatibility,
    setBonus,
    durability: Math.floor(baseDurability * multiplier),
    maxDurability: Math.floor(baseDurability * multiplier),
    description: template.description,
    icon: type,
  };
}

export function calculateRobotStats(
  parts: Record<PartType, Part | null>,
  config: GameConfig
): {
  totalWeight: number;
  totalEnergy: number;
  totalSkillSlots: number;
  maxDurability: number;
  isOverloaded: boolean;
  compatibilityIssues: string[];
  activeSetBonuses: string[];
} {
  const installedParts = Object.values(parts).filter(Boolean) as Part[];
  
  let totalWeight = 0;
  let totalEnergy = 0;
  let totalSkillSlots = 0;
  let maxDurability = 100;
  const compatibilityIssues: string[] = [];

  const setBonusCounts: Record<string, number> = {};

  for (const part of installedParts) {
    totalWeight += part.weight;
    totalEnergy += part.energy;
    totalSkillSlots += part.skillSlots;
    
    if (part.durability < maxDurability) {
      maxDurability = part.durability;
    }

    if (part.setBonus) {
      setBonusCounts[part.setBonus] = (setBonusCounts[part.setBonus] || 0) + 1;
    }
  }

  for (const part of installedParts) {
    for (const otherPart of installedParts) {
      if (part.id !== otherPart.id && !part.compatibility.includes(otherPart.type)) {
        const issue = `${part.name} 与 ${otherPart.name} 不兼容`;
        if (!compatibilityIssues.includes(issue)) {
          compatibilityIssues.push(issue);
        }
      }
    }
  }

  const activeSetBonuses: string[] = [];
  for (const [setId, count] of Object.entries(setBonusCounts)) {
    const setConfig = config.setBonuses[setId];
    if (setConfig && count >= setConfig.requiredParts) {
      activeSetBonuses.push(setId);
      
      if (setConfig.effects.weightBonus) {
        totalWeight = Math.floor(totalWeight * (1 + setConfig.effects.weightBonus / 100));
      }
      if (setConfig.effects.energyBonus) {
        totalEnergy = Math.max(1, Math.floor(totalEnergy * (1 + setConfig.effects.energyBonus / 100)));
      }
      if (setConfig.effects.skillBonus) {
        totalSkillSlots += setConfig.effects.skillBonus;
      }
      if (setConfig.effects.durabilityBonus) {
        maxDurability = Math.floor(maxDurability * (1 + setConfig.effects.durabilityBonus / 100));
      }
    }
  }

  const isOverloaded = totalEnergy > config.overloadRules.threshold;

  return {
    totalWeight,
    totalEnergy,
    totalSkillSlots,
    maxDurability,
    isOverloaded,
    compatibilityIssues,
    activeSetBonuses,
  };
}

export function calculateAdaptability(
  robot: Robot,
  mission: Mission,
  config: GameConfig
): number {
  const weights = config.missionWeights[mission.type];
  let score = 0;
  let maxScore = 0;

  const { requirements } = mission;
  const penalty = robot.isOverloaded ? config.overloadRules.performancePenalty / 100 : 0;

  if (requirements.weight !== undefined) {
    const weightScore = Math.min(1, robot.totalWeight / requirements.weight);
    score += weightScore * weights.weight;
    maxScore += weights.weight;
  }

  if (requirements.energy !== undefined) {
    const energyScore = Math.min(1, robot.totalEnergy / requirements.energy);
    score += energyScore * weights.energy;
    maxScore += weights.energy;
  }

  if (requirements.skillSlots !== undefined) {
    const skillScore = Math.min(1, robot.totalSkillSlots / requirements.skillSlots);
    score += skillScore * weights.skillSlots;
    maxScore += weights.skillSlots;
  }

  if (requirements.partTypes) {
    for (const partType of requirements.partTypes) {
      if (robot.parts[partType]) {
        score += 0.1;
      }
      maxScore += 0.1;
    }
  }

  const durabilityScore = robot.durability / robot.maxDurability;
  score += durabilityScore * weights.durability;
  maxScore += weights.durability;

  const baseScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const finalScore = Math.max(0, baseScore * (1 - penalty));

  return Math.round(finalScore);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRarityColorClass(rarity: Rarity): string {
  const classes: Record<Rarity, string> = {
    common: 'text-rarity-common',
    uncommon: 'text-rarity-uncommon',
    rare: 'text-rarity-rare',
    epic: 'text-rarity-epic',
    legendary: 'text-rarity-legendary',
  };
  return classes[rarity];
}

export function getRarityBorderClass(rarity: Rarity): string {
  const classes: Record<Rarity, string> = {
    common: 'rarity-border-common',
    uncommon: 'rarity-border-uncommon',
    rare: 'rarity-border-rare',
    epic: 'rarity-border-epic',
    legendary: 'rarity-border-legendary',
  };
  return classes[rarity];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const TAG_MAP: Record<IdentityTagId, IdentityTag> = IDENTITY_TAGS.reduce(
  (acc, tag) => {
    acc[tag.id] = tag;
    return acc;
  },
  {} as Record<IdentityTagId, IdentityTag>
);

export function getReputationTier(reputation: number): ReputationTier {
  const tier =
    REPUTATION_TIERS.find((t) => reputation >= t.min && reputation <= t.max) ??
    REPUTATION_TIERS[REPUTATION_TIERS.length - 1];
  return tier;
}

export function getIdentityTag(id: IdentityTagId): IdentityTag {
  return TAG_MAP[id];
}

function buildIdentityStats(
  robot: Robot,
  missionRecords: MissionRecord[],
  ethicsRecords: EthicsRecord[],
  exhibitionRecords: ExhibitionRecord[]
): IdentityStats {
  const robotMissions = missionRecords.filter((r) => r.robotId === robot.id);
  const robotEthics = ethicsRecords.filter((r) => r.robotId === robot.id);
  const robotExhibitions = exhibitionRecords.filter(
    (r) => r.robotId === robot.id
  );

  const missionByType: Record<MissionType, { success: number; fail: number }> =
    {
      transport: { success: 0, fail: 0 },
      cleaning: { success: 0, fail: 0 },
      rescue: { success: 0, fail: 0 },
      combat: { success: 0, fail: 0 },
    };

  let missionSuccess = 0;
  let missionFail = 0;
  let highDifficultyFails = 0;

  for (const rec of robotMissions) {
    const mission = MISSIONS.find((m) => m.id === rec.missionId);
    if (rec.success) {
      missionSuccess += 1;
      if (mission) missionByType[mission.type].success += 1;
    } else {
      missionFail += 1;
      if (mission) missionByType[mission.type].fail += 1;
      if (mission && mission.difficulty >= 4) highDifficultyFails += 1;
    }
  }

  let ethicsScore = 0;
  let ethicalChoices = 0;
  let unethicalChoices = 0;
  for (const rec of robotEthics) {
    ethicsScore += rec.reputationChange;
    if (rec.choiceType === 'ethical') ethicalChoices += 1;
    if (rec.choiceType === 'unethical') unethicalChoices += 1;
  }

  const exhibitionCount = robotExhibitions.length;
  const firstPlaceCount = robotExhibitions.filter((r) => r.rank === 1).length;

  const partsInstalled = Object.values(robot.parts).filter(Boolean).length;

  return {
    totalMissions: robotMissions.length,
    missionSuccess,
    missionFail,
    missionByType,
    highDifficultyFails,
    overloadedFails: 0,
    repairCount: robot.repairCount,
    ethicsScore,
    ethicalChoices,
    unethicalChoices,
    exhibitionCount,
    firstPlaceCount,
    partsInstalled,
    isOverloaded: robot.isOverloaded,
  };
}

function evaluateTags(stats: IdentityStats, robot: Robot): TagEvaluation[] {
  const evaluations: TagEvaluation[] = [];
  const add = (
    id: IdentityTagId,
    active: boolean,
    source: string,
    progress?: { current: number; required: number; label: string }
  ) => {
    evaluations.push({ tag: TAG_MAP[id], active, source, progress });
  };

  const t = stats.missionByType;

  add(
    'reliable-porter',
    t.transport.success >= 3,
    `完成 ${t.transport.success} 次运输任务`,
    t.transport.success < 3
      ? { current: t.transport.success, required: 3, label: '运输任务成功' }
      : undefined
  );
  add(
    'rescue-hero',
    t.rescue.success >= 3,
    `完成 ${t.rescue.success} 次救援任务`,
    t.rescue.success < 3
      ? { current: t.rescue.success, required: 3, label: '救援任务成功' }
      : undefined
  );
  add(
    'cleaning-expert',
    t.cleaning.success >= 3,
    `完成 ${t.cleaning.success} 次清洁任务`,
    t.cleaning.success < 3
      ? { current: t.cleaning.success, required: 3, label: '清洁任务成功' }
      : undefined
  );
  add(
    'combat-champion',
    t.combat.success >= 3,
    `完成 ${t.combat.success} 次战斗任务`,
    t.combat.success < 3
      ? { current: t.combat.success, required: 3, label: '战斗任务成功' }
      : undefined
  );

  const typesWithSuccess = Object.values(t).filter((v) => v.success > 0).length;
  add(
    'all-rounder',
    typesWithSuccess >= 4,
    `四类任务均有成功记录 (${typesWithSuccess}/4)`,
    typesWithSuccess < 4
      ? { current: typesWithSuccess, required: 4, label: '任务类型覆盖' }
      : undefined
  );

  add(
    'frequent-repair',
    stats.repairCount >= 3,
    `累计返修 ${stats.repairCount} 次`,
    stats.repairCount < 3
      ? { current: stats.repairCount, required: 3, label: '返修次数' }
      : undefined
  );
  add(
    'battle-scarred',
    stats.repairCount >= 5,
    `累计返修 ${stats.repairCount} 次`,
    stats.repairCount < 5
      ? { current: stats.repairCount, required: 5, label: '返修次数' }
      : undefined
  );

  add(
    'accident-prone',
    stats.missionFail >= 3,
    `任务失败 ${stats.missionFail} 次`,
    stats.missionFail < 3
      ? { current: stats.missionFail, required: 3, label: '任务失败次数' }
      : undefined
  );
  add(
    'dangerous-test',
    stats.highDifficultyFails >= 2,
    `高难度任务失败 ${stats.highDifficultyFails} 次`,
    stats.highDifficultyFails < 2
      ? {
          current: stats.highDifficultyFails,
          required: 2,
          label: '高难度任务失败',
        }
      : undefined
  );

  add(
    'ethical-model',
    stats.ethicalChoices >= 2 && stats.unethicalChoices === 0,
    `伦理抉择 ${stats.ethicalChoices} 次，零违规`,
    stats.ethicalChoices < 2
      ? { current: stats.ethicalChoices, required: 2, label: '伦理抉择次数' }
      : undefined
  );
  add(
    'rule-breaker',
    stats.unethicalChoices >= 2,
    `违规抉择 ${stats.unethicalChoices} 次`,
    stats.unethicalChoices < 2
      ? { current: stats.unethicalChoices, required: 2, label: '违规抉择次数' }
      : undefined
  );

  add(
    'exhibition-star',
    stats.firstPlaceCount >= 1,
    `展示大会夺冠 ${stats.firstPlaceCount} 次`,
    stats.firstPlaceCount < 1
      ? { current: stats.firstPlaceCount, required: 1, label: '展示夺冠次数' }
      : undefined
  );
  add(
    'showpiece',
    stats.exhibitionCount >= 1,
    `参加展示大会 ${stats.exhibitionCount} 次`,
    stats.exhibitionCount < 1
      ? { current: stats.exhibitionCount, required: 1, label: '参展次数' }
      : undefined
  );

  const installedParts = Object.values(robot.parts).filter(Boolean) as Part[];
  const rareOrAbove = installedParts.filter(
    (p) => RARITY_ORDER.indexOf(p.rarity) >= RARITY_ORDER.indexOf('rare')
  ).length;

  add(
    'modification-master',
    stats.partsInstalled === 6 && rareOrAbove >= 3,
    `满配 ${stats.partsInstalled}/6，稀有以上 ${rareOrAbove} 件`,
    stats.partsInstalled < 6
      ? { current: stats.partsInstalled, required: 6, label: '装配零件数' }
      : undefined
  );
  add(
    'over-modified',
    stats.isOverloaded,
    stats.isOverloaded
      ? `当前能耗 ${robot.totalEnergy}，处于过载状态`
      : `当前能耗 ${robot.totalEnergy}，未过载`,
    undefined
  );
  add(
    'stock-config',
    stats.partsInstalled <= 2,
    `仅装配 ${stats.partsInstalled} 个零件`,
    undefined
  );

  add(
    'rookie',
    stats.totalMissions < 3,
    `完成任务 ${stats.totalMissions} 次（新手期）`,
    undefined
  );
  add(
    'veteran',
    stats.totalMissions >= 10,
    `完成任务 ${stats.totalMissions} 次`,
    stats.totalMissions < 10
      ? { current: stats.totalMissions, required: 10, label: '完成任务数' }
      : undefined
  );

  return evaluations;
}

export function buildReputationTimeline(
  robotId: string,
  missionRecords: MissionRecord[],
  repairRecords: RepairRecord[],
  ethicsRecords: EthicsRecord[],
  exhibitionRecords: ExhibitionRecord[]
): TimelineEvent[] {
  const events: Omit<TimelineEvent, 'reputationAfter'>[] = [];

  for (const rec of missionRecords.filter((r) => r.robotId === robotId)) {
    if (rec.success) {
      events.push({
        id: rec.id,
        timestamp: rec.completedAt,
        delta: 3,
        reason: `任务成功 · ${rec.missionName}`,
        category: 'mission',
        outcome: 'success',
      });
    } else {
      events.push({
        id: rec.id,
        timestamp: rec.completedAt,
        delta: -4,
        reason: `任务失败 · ${rec.missionName}`,
        category: 'mission',
        outcome: 'fail',
      });
    }
  }

  for (const rec of repairRecords.filter((r) => r.robotId === robotId)) {
    events.push({
      id: rec.id,
      timestamp: rec.repairedAt,
      delta: -1,
      reason: `维修 · 消耗 ${rec.materialCost} 材料`,
      category: 'repair',
      outcome: 'neutral',
    });
  }

  for (const rec of ethicsRecords.filter((r) => r.robotId === robotId)) {
    events.push({
      id: rec.id,
      timestamp: rec.completedAt,
      delta: rec.reputationChange,
      reason: `伦理抉择 · ${rec.scenarioTitle}：${rec.choiceLabel}`,
      category: 'ethics',
      outcome:
        rec.choiceType === 'ethical'
          ? 'success'
          : rec.choiceType === 'unethical'
          ? 'fail'
          : 'neutral',
    });
  }

  for (const rec of exhibitionRecords.filter((r) => r.robotId === robotId)) {
    events.push({
      id: rec.id,
      timestamp: rec.completedAt,
      delta: rec.reputationChange,
      reason: `展示大会 · ${rec.exhibitionName}（${rec.rankLabel}）`,
      category: 'exhibition',
      outcome: rec.rank <= 3 ? 'success' : 'neutral',
    });
  }

  events.sort((a, b) => a.timestamp - b.timestamp);

  let running = IDENTITY_BASE_REPUTATION;
  const timeline: TimelineEvent[] = events.map((e) => {
    running = clamp(running + e.delta, 0, 100);
    return { ...e, reputationAfter: running };
  });

  return timeline;
}

export function computeRobotIdentity(
  robot: Robot | undefined,
  missionRecords: MissionRecord[],
  repairRecords: RepairRecord[],
  ethicsRecords: EthicsRecord[],
  exhibitionRecords: ExhibitionRecord[]
): RobotIdentityResult {
  if (!robot) {
    const emptyStats: IdentityStats = {
      totalMissions: 0,
      missionSuccess: 0,
      missionFail: 0,
      missionByType: {
        transport: { success: 0, fail: 0 },
        cleaning: { success: 0, fail: 0 },
        rescue: { success: 0, fail: 0 },
        combat: { success: 0, fail: 0 },
      },
      highDifficultyFails: 0,
      overloadedFails: 0,
      repairCount: 0,
      ethicsScore: 0,
      ethicalChoices: 0,
      unethicalChoices: 0,
      exhibitionCount: 0,
      firstPlaceCount: 0,
      partsInstalled: 0,
      isOverloaded: false,
    };
    return {
      reputation: IDENTITY_BASE_REPUTATION,
      trust: IDENTITY_BASE_REPUTATION,
      rewardMultiplier: 0.8 + (IDENTITY_BASE_REPUTATION / 100) * 0.7,
      tier: getReputationTier(IDENTITY_BASE_REPUTATION),
      stats: emptyStats,
      tags: [],
      timeline: [],
      positiveTagCount: 0,
      negativeTagCount: 0,
    };
  }

  const stats = buildIdentityStats(
    robot,
    missionRecords,
    ethicsRecords,
    exhibitionRecords
  );
  const timeline = buildReputationTimeline(
    robot.id,
    missionRecords,
    repairRecords,
    ethicsRecords,
    exhibitionRecords
  );

  const reputation =
    timeline.length > 0
      ? timeline[timeline.length - 1].reputationAfter
      : IDENTITY_BASE_REPUTATION;

  const tagEvaluations = evaluateTags(stats, robot);
  const activeTags = tagEvaluations.filter((e) => e.active);
  const positiveTagCount = activeTags.filter(
    (e) => e.tag.tier === 'positive'
  ).length;
  const negativeTagCount = activeTags.filter(
    (e) => e.tag.tier === 'negative'
  ).length;

  const trust = clamp(
    Math.round(reputation + (positiveTagCount - negativeTagCount) * 2),
    0,
    100
  );
  const rewardMultiplier =
    Math.round((0.8 + (reputation / 100) * 0.7) * 100) / 100;

  return {
    reputation,
    trust,
    rewardMultiplier,
    tier: getReputationTier(reputation),
    stats,
    tags: tagEvaluations,
    timeline,
    positiveTagCount,
    negativeTagCount,
  };
}

export function getMissionRecommendations(
  robot: Robot,
  config: GameConfig,
  identity: RobotIdentityResult
): MissionRecommendation[] {
  const activeTagIds = new Set(
    identity.tags.filter((t) => t.active).map((t) => t.tag.id)
  );

  const recommendations: MissionRecommendation[] = MISSIONS.map((mission) => {
    const adaptability = calculateAdaptability(robot, mission, config);
    let affinity = 1;
    const reasons: string[] = [];

    const tagForType: Record<MissionType, IdentityTagId> = {
      transport: 'reliable-porter',
      cleaning: 'cleaning-expert',
      rescue: 'rescue-hero',
      combat: 'combat-champion',
    };

    if (activeTagIds.has(tagForType[mission.type])) {
      affinity *= 1.15;
      reasons.push('专精标签加成');
    }

    if (activeTagIds.has('all-rounder')) {
      affinity *= 1.05;
      reasons.push('全能选手适配');
    }

    if (activeTagIds.has('veteran')) {
      affinity *= 1.05;
      reasons.push('老兵经验加成');
    }

    if (activeTagIds.has('accident-prone') && mission.difficulty >= 4) {
      affinity *= 0.8;
      reasons.push('事故频发，高难度风险');
    }

    if (activeTagIds.has('over-modified')) {
      affinity *= 0.9;
      reasons.push('过度改装，状态不稳');
    }

    if (activeTagIds.has('dangerous-test') && mission.difficulty >= 4) {
      affinity *= 0.85;
      reasons.push('危险试验机，高难失败率高');
    }

    if (activeTagIds.has('rule-breaker')) {
      affinity *= 0.92;
      reasons.push('违规者，客户信任降低');
    }

    if (reasons.length === 0) {
      reasons.push('综合适配评估');
    }

    const score = Math.round(adaptability * affinity);

    return {
      mission,
      adaptability,
      score,
      rewardMultiplier: identity.rewardMultiplier,
      reasons,
    };
  });

  return recommendations.sort((a, b) => b.score - a.score);
}

export function computeExhibitionScore(robot: Robot, exhibition: Exhibition): number {
  const weights = exhibition.weights;
  const installedParts = Object.values(robot.parts).filter(Boolean) as Part[];
  if (installedParts.length === 0) return 0;

  const avgRarityIndex =
    installedParts.reduce((sum, p) => sum + RARITY_ORDER.indexOf(p.rarity), 0) /
    installedParts.length;
  const rarityScore = (avgRarityIndex / 4) * 100;
  const weightScore = Math.min(100, (robot.totalWeight / 100) * 100);
  const energyScore = Math.min(100, (robot.totalEnergy / 120) * 100);
  const skillScore = Math.min(100, (robot.totalSkillSlots / 12) * 100);
  const durabilityRatio =
    robot.maxDurability > 0 ? robot.durability / robot.maxDurability : 0;
  const durabilityScore = durabilityRatio * 100;

  const score =
    weightScore * weights.weight +
    energyScore * weights.energy +
    skillScore * weights.skill +
    durabilityScore * weights.durability +
    rarityScore * weights.rarity;

  return Math.round(score);
}
