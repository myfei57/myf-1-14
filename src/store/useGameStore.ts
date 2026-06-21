import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Store,
  Part,
  PartType,
  Rarity,
  Robot,
  MissionRecord,
  RepairRecord,
  EthicsRecord,
  ExhibitionRecord,
  AccidentRecord,
  AccidentType,
  AssemblyPlan,
  GameConfig,
} from '../types';
import {
  DEFAULT_CONFIG,
  MISSIONS,
  INITIAL_CREDITS,
  INITIAL_MATERIALS,
  BLIND_BOX_PRICES,
  ETHICS_SCENARIOS,
  EXHIBITIONS,
  ACCIDENT_TYPES,
} from '../data/defaultConfig';
import {
  generateId,
  generateRandomPart,
  calculateRobotStats as calcStats,
  calculateAdaptability as calcAdapt,
  computeRobotIdentity as computeIdentity,
  getMissionRecommendations,
  computeExhibitionScore,
  clamp,
} from '../utils/helpers';

const EMPTY_SELECTED_PARTS: Record<PartType, Part | null> = {
  head: null,
  body: null,
  arm: null,
  leg: null,
  core: null,
  tool: null,
};

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      parts: [],
      robots: [],
      credits: INITIAL_CREDITS,
      materials: INITIAL_MATERIALS,
      missionRecords: [],
      repairRecords: [],
      assemblyPlans: [],
      ethicsRecords: [],
      exhibitionRecords: [],
      accidentRecords: [],
      config: DEFAULT_CONFIG,
      selectedParts: { ...EMPTY_SELECTED_PARTS },

      addPart: (part) => set((state) => ({ parts: [...state.parts, part] })),

      removePart: (partId) =>
        set((state) => ({
          parts: state.parts.filter((p) => p.id !== partId),
        })),

      updatePart: (partId, updates) =>
        set((state) => ({
          parts: state.parts.map((p) =>
            p.id === partId ? { ...p, ...updates } : p
          ),
        })),

      addRobot: (robot) => set((state) => ({ robots: [...state.robots, robot] })),

      removeRobot: (robotId) =>
        set((state) => ({
          robots: state.robots.filter((r) => r.id !== robotId),
        })),

      updateRobot: (robotId, updates) =>
        set((state) => ({
          robots: state.robots.map((r) =>
            r.id === robotId ? { ...r, ...updates } : r
          ),
        })),

      addCredits: (amount) =>
        set((state) => ({ credits: state.credits + amount })),

      spendCredits: (amount) => {
        const state = get();
        if (state.credits >= amount) {
          set({ credits: state.credits - amount });
          return true;
        }
        return false;
      },

      addMaterials: (amount) =>
        set((state) => ({ materials: state.materials + amount })),

      spendMaterials: (amount) => {
        const state = get();
        if (state.materials >= amount) {
          set({ materials: state.materials - amount });
          return true;
        }
        return false;
      },

      addMissionRecord: (record) =>
        set((state) => ({ missionRecords: [...state.missionRecords, record] })),

      addRepairRecord: (record) =>
        set((state) => ({ repairRecords: [...state.repairRecords, record] })),

      addAssemblyPlan: (plan) =>
        set((state) => ({ assemblyPlans: [...state.assemblyPlans, plan] })),

      removeAssemblyPlan: (planId) =>
        set((state) => ({
          assemblyPlans: state.assemblyPlans.filter((p) => p.id !== planId),
        })),

      updateConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),

      resetConfig: () => set({ config: DEFAULT_CONFIG }),

      setSelectedPart: (slot, part) =>
        set((state) => ({
          selectedParts: {
            ...state.selectedParts,
            [slot]: part,
          },
        })),

      clearSelectedParts: () => set({ selectedParts: { ...EMPTY_SELECTED_PARTS } }),

      recyclePart: (partId) => {
        const state = get();
        const part = state.parts.find((p) => p.id === partId);
        if (!part) return;

        const recycleRate = state.config.recyclingRates[part.rarity];
        const materialsGained = Math.floor(part.maxDurability * recycleRate);

        set((s) => ({
          parts: s.parts.filter((p) => p.id !== partId),
          materials: s.materials + materialsGained,
        }));
      },

      repairRobot: (robotId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        if (!robot) return { success: false, cost: 0, restored: 0 };

        const { repairRules } = state.config;
        
        if (robot.repairCount >= repairRules.maxRepairs) {
          return { success: false, cost: 0, restored: 0 };
        }

        const durabilityNeeded = robot.maxDurability - robot.durability;
        const cost = durabilityNeeded * repairRules.materialCostPerPoint;

        if (!state.spendMaterials(cost)) {
          return { success: false, cost, restored: 0 };
        }

        const successRate = clamp(
          repairRules.baseSuccessRate - robot.repairCount * repairRules.degradeRate,
          0.1,
          repairRules.baseSuccessRate
        );
        const success = Math.random() < successRate;

        let restored = 0;
        if (success) {
          restored = durabilityNeeded;
          state.updateRobot(robotId, {
            durability: robot.maxDurability,
            repairCount: robot.repairCount + 1,
          });
        } else {
          state.updateRobot(robotId, {
            repairCount: robot.repairCount + 1,
          });
        }

        const record: RepairRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          materialCost: cost,
          success,
          durabilityRestored: restored,
          repairedAt: Date.now(),
        };
        state.addRepairRecord(record);

        return { success, cost, restored };
      },

      executeMission: (robotId, missionId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        const mission = MISSIONS.find((m) => m.id === missionId);

        if (!robot || !mission) {
          throw new Error('Robot or mission not found');
        }

        const adaptability = state.calculateAdaptability(robot, mission);
        const successChance = clamp(adaptability / 100, 0.1, 0.95);
        const success = Math.random() < successChance;

        let durabilityLoss = Math.floor(mission.difficulty * 5 * Math.random() + 5);
        if (robot.isOverloaded) {
          durabilityLoss += state.config.overloadRules.durabilityPenalty;
        }

        const newDurability = clamp(robot.durability - durabilityLoss, 0, robot.maxDurability);
        state.updateRobot(robotId, { durability: newDurability });

        const identity = computeIdentity(
          robot,
          state.missionRecords,
          state.repairRecords,
          state.ethicsRecords,
          state.exhibitionRecords,
          state.accidentRecords
        );
        const multiplier = identity.rewardMultiplier;

        let rewards = { credits: 0, materials: 0 };
        if (success) {
          rewards = {
            credits: Math.round(mission.rewards.credits * multiplier),
            materials: Math.round(mission.rewards.materials * multiplier),
          };
          state.addCredits(rewards.credits);
          state.addMaterials(rewards.materials);

          if (mission.rewards.blindBox) {
            const bonusParts = state.openBlindBox(mission.rewards.blindBox, true);
            bonusParts.forEach((p) => state.addPart(p));
          }
        }

        const record: MissionRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          missionId: mission.id,
          missionName: mission.name,
          success,
          adaptability,
          rewards,
          durabilityLoss,
          rewardMultiplier: multiplier,
          trust: identity.trust,
          completedAt: Date.now(),
        };
        state.addMissionRecord(record);

        return record;
      },

      calculateRobotStats: (parts) => {
        const state = get();
        return calcStats(parts, state.config);
      },

      calculateAdaptability: (robot, mission) => {
        const state = get();
        return calcAdapt(robot, mission, state.config);
      },

      generateRandomPart: (minRarity) => {
        const state = get();
        return generateRandomPart(state.config, minRarity);
      },

      openBlindBox: (type, free = false) => {
        const state = get();
        const price = BLIND_BOX_PRICES[type];

        if (!free && !state.spendCredits(price)) {
          return [];
        }

        const parts: Part[] = [];
        const count = type === 'legendary' ? 5 : type === 'epic' ? 4 : type === 'rare' ? 3 : 2;

        for (let i = 0; i < count; i++) {
          const part = generateRandomPart(state.config, type);
          parts.push(part);
        }

        return parts;
      },

      recordEthicsDecision: (robotId, scenarioId, choiceId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        const scenario = ETHICS_SCENARIOS.find((s) => s.id === scenarioId);
        if (!robot || !scenario) {
          throw new Error('Robot or ethics scenario not found');
        }
        const choice = scenario.choices.find((c) => c.id === choiceId);
        if (!choice) {
          throw new Error('Ethics choice not found');
        }

        const record: EthicsRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          scenarioId: scenario.id,
          scenarioTitle: scenario.title,
          choiceId: choice.id,
          choiceLabel: choice.label,
          choiceType: choice.type,
          reputationChange: choice.reputationChange,
          completedAt: Date.now(),
        };
        set((s) => ({ ethicsRecords: [...s.ethicsRecords, record] }));
        return record;
      },

      participateInExhibition: (robotId, exhibitionId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        const exhibition = EXHIBITIONS.find((e) => e.id === exhibitionId);
        if (!robot || !exhibition) {
          throw new Error('Robot or exhibition not found');
        }

        if (!state.spendCredits(exhibition.entryFee)) {
          throw new Error('Insufficient credits for entry fee');
        }

        const displayScore = computeExhibitionScore(robot, exhibition);
        const tier = exhibition.tiers.find((t) => displayScore >= t.minScore) ??
          exhibition.tiers[exhibition.tiers.length - 1];

        state.addCredits(tier.reward);

        const record: ExhibitionRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          exhibitionId: exhibition.id,
          exhibitionName: exhibition.name,
          displayScore,
          rank: tier.rank,
          rankLabel: tier.label,
          reward: tier.reward,
          reputationChange: tier.reputationChange,
          completedAt: Date.now(),
        };
        set((s) => ({ exhibitionRecords: [...s.exhibitionRecords, record] }));
        return record;
      },

      recordAccident: (robotId, accidentType, description) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        if (!robot) {
          throw new Error('Robot not found');
        }
        const typeConfig = ACCIDENT_TYPES.find((t) => t.id === accidentType);
        if (!typeConfig) {
          throw new Error('Accident type not found');
        }

        const record: AccidentRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          accidentType: typeConfig.id,
          accidentTypeName: typeConfig.name,
          severity: typeConfig.severity,
          description: description.trim() || typeConfig.description,
          reputationChange: typeConfig.reputationChange,
          recordedAt: Date.now(),
        };
        set((s) => ({ accidentRecords: [...s.accidentRecords, record] }));
        return record;
      },

      computeRobotIdentity: (robotId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        return computeIdentity(
          robot,
          state.missionRecords,
          state.repairRecords,
          state.ethicsRecords,
          state.exhibitionRecords,
          state.accidentRecords
        );
      },

      getRecommendedMissions: (robotId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        if (!robot) return [];
        const identity = computeIdentity(
          robot,
          state.missionRecords,
          state.repairRecords,
          state.ethicsRecords,
          state.exhibitionRecords,
          state.accidentRecords
        );
        return getMissionRecommendations(robot, state.config, identity);
      },

      loadFromStorage: () => {},

      resetGame: () =>
        set({
          parts: [],
          robots: [],
          credits: INITIAL_CREDITS,
          materials: INITIAL_MATERIALS,
          missionRecords: [],
          repairRecords: [],
          assemblyPlans: [],
          ethicsRecords: [],
          exhibitionRecords: [],
          accidentRecords: [],
          selectedParts: { ...EMPTY_SELECTED_PARTS },
        }),
    }),
    {
      name: 'robot-workshop-storage',
      partialize: (state) => ({
        parts: state.parts,
        robots: state.robots,
        credits: state.credits,
        materials: state.materials,
        missionRecords: state.missionRecords,
        repairRecords: state.repairRecords,
        assemblyPlans: state.assemblyPlans,
        ethicsRecords: state.ethicsRecords,
        exhibitionRecords: state.exhibitionRecords,
        accidentRecords: state.accidentRecords,
        config: state.config,
      }),
    }
  )
);
