export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type PartType = 'head' | 'body' | 'arm' | 'leg' | 'core' | 'tool';

export type MissionType = 'transport' | 'cleaning' | 'rescue' | 'combat';

export interface Part {
  id: string;
  name: string;
  type: PartType;
  rarity: Rarity;
  weight: number;
  energy: number;
  skillSlots: number;
  compatibility: PartType[];
  setBonus: string | null;
  durability: number;
  maxDurability: number;
  description: string;
  icon: string;
}

export interface Robot {
  id: string;
  name: string;
  parts: Record<PartType, Part | null>;
  totalWeight: number;
  totalEnergy: number;
  totalSkillSlots: number;
  durability: number;
  maxDurability: number;
  repairCount: number;
  isOverloaded: boolean;
  compatibilityIssues: string[];
  activeSetBonuses: string[];
  createdAt: number;
}

export interface Mission {
  id: string;
  name: string;
  type: MissionType;
  difficulty: number;
  requirements: {
    weight?: number;
    energy?: number;
    skillSlots?: number;
    durability?: number;
    partTypes?: PartType[];
  };
  rewards: {
    credits: number;
    materials: number;
    blindBox?: Rarity;
  };
  description: string;
  icon: string;
}

export interface MissionRecord {
  id: string;
  robotId: string;
  robotName: string;
  missionId: string;
  missionName: string;
  success: boolean;
  adaptability: number;
  rewards: { credits: number; materials: number };
  durabilityLoss: number;
  completedAt: number;
}

export interface RepairRecord {
  id: string;
  robotId: string;
  robotName: string;
  materialCost: number;
  success: boolean;
  durabilityRestored: number;
  repairedAt: number;
}

export interface AssemblyPlan {
  id: string;
  name: string;
  parts: Record<PartType, Part | null>;
  savedAt: number;
}

export type IdentityCategory =
  | 'task'
  | 'repair'
  | 'accident'
  | 'ethics'
  | 'exhibition'
  | 'modification'
  | 'general';

export type IdentityTagTier = 'positive' | 'neutral' | 'negative';

export type IdentityTagId =
  | 'reliable-porter'
  | 'rescue-hero'
  | 'cleaning-expert'
  | 'combat-champion'
  | 'all-rounder'
  | 'battle-scarred'
  | 'frequent-repair'
  | 'accident-prone'
  | 'dangerous-test'
  | 'ethical-model'
  | 'rule-breaker'
  | 'exhibition-star'
  | 'showpiece'
  | 'over-modified'
  | 'stock-config'
  | 'modification-master'
  | 'rookie'
  | 'veteran';

export interface IdentityTag {
  id: IdentityTagId;
  name: string;
  description: string;
  category: IdentityCategory;
  tier: IdentityTagTier;
  icon: string;
}

export type EthicsChoiceType = 'ethical' | 'neutral' | 'unethical';

export interface EthicsChoice {
  id: string;
  label: string;
  type: EthicsChoiceType;
  reputationChange: number;
  consequence: string;
}

export interface EthicsScenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  choices: EthicsChoice[];
}

export interface ExhibitionTier {
  minScore: number;
  rank: number;
  label: string;
  reward: number;
  reputationChange: number;
}

export interface ExhibitionWeights {
  weight: number;
  energy: number;
  skill: number;
  durability: number;
  rarity: number;
}

export interface Exhibition {
  id: string;
  name: string;
  description: string;
  icon: string;
  entryFee: number;
  weights: ExhibitionWeights;
  tiers: ExhibitionTier[];
}

export interface EthicsRecord {
  id: string;
  robotId: string;
  robotName: string;
  scenarioId: string;
  scenarioTitle: string;
  choiceId: string;
  choiceLabel: string;
  choiceType: EthicsChoiceType;
  reputationChange: number;
  completedAt: number;
}

export interface ExhibitionRecord {
  id: string;
  robotId: string;
  robotName: string;
  exhibitionId: string;
  exhibitionName: string;
  displayScore: number;
  rank: number;
  rankLabel: string;
  reward: number;
  reputationChange: number;
  completedAt: number;
}

export type AccidentType = 'overload' | 'collision' | 'operation' | 'system';

export interface AccidentTypeConfig {
  id: AccidentType;
  name: string;
  description: string;
  reputationChange: number;
  severity: number;
  icon: string;
}

export interface AccidentRecord {
  id: string;
  robotId: string;
  robotName: string;
  accidentType: AccidentType;
  accidentTypeName: string;
  severity: number;
  description: string;
  reputationChange: number;
  recordedAt: number;
}

export interface ReputationTier {
  id: string;
  name: string;
  min: number;
  max: number;
  color: string;
  description: string;
}

export interface IdentityStats {
  totalMissions: number;
  missionSuccess: number;
  missionFail: number;
  missionByType: Record<MissionType, { success: number; fail: number }>;
  highDifficultyFails: number;
  accidentCount: number;
  severeAccidents: number;
  overloadAccidents: number;
  repairCount: number;
  ethicsScore: number;
  ethicalChoices: number;
  unethicalChoices: number;
  exhibitionCount: number;
  firstPlaceCount: number;
  partsInstalled: number;
  isOverloaded: boolean;
}

export interface TagEvaluation {
  tag: IdentityTag;
  active: boolean;
  source: string;
  progress?: { current: number; required: number; label: string };
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  delta: number;
  reputationAfter: number;
  reason: string;
  source: string;
  category: 'mission' | 'repair' | 'ethics' | 'exhibition' | 'accident';
  outcome: 'success' | 'fail' | 'neutral';
}

export interface RobotIdentityResult {
  reputation: number;
  trust: number;
  rewardMultiplier: number;
  tier: ReputationTier;
  stats: IdentityStats;
  tags: TagEvaluation[];
  timeline: TimelineEvent[];
  positiveTagCount: number;
  negativeTagCount: number;
}

export interface MissionRecommendation {
  mission: Mission;
  adaptability: number;
  score: number;
  rank: number;
  rewardMultiplier: number;
  reasons: string[];
}

export interface RarityConfig {
  name: string;
  probability: number;
  color: string;
  bgColor: string;
  glowColor: string;
}

export interface SetBonusConfig {
  name: string;
  description: string;
  requiredParts: number;
  effects: {
    weightBonus?: number;
    energyBonus?: number;
    skillBonus?: number;
    durabilityBonus?: number;
  };
}

export interface OverloadRules {
  threshold: number;
  durabilityPenalty: number;
  performancePenalty: number;
}

export interface RepairRules {
  baseSuccessRate: number;
  degradeRate: number;
  maxRepairs: number;
  materialCostPerPoint: number;
}

export interface MissionWeights {
  weight: number;
  energy: number;
  skillSlots: number;
  durability: number;
}

export interface GameConfig {
  rarities: Record<Rarity, RarityConfig>;
  setBonuses: Record<string, SetBonusConfig>;
  overloadRules: OverloadRules;
  repairRules: RepairRules;
  missionWeights: Record<MissionType, MissionWeights>;
  recyclingRates: Record<Rarity, number>;
}

export interface GameState {
  parts: Part[];
  robots: Robot[];
  credits: number;
  materials: number;
  missionRecords: MissionRecord[];
  repairRecords: RepairRecord[];
  assemblyPlans: AssemblyPlan[];
  ethicsRecords: EthicsRecord[];
  exhibitionRecords: ExhibitionRecord[];
  accidentRecords: AccidentRecord[];
  config: GameConfig;
  selectedParts: Record<PartType, Part | null>;
}

export interface GameActions {
  addPart: (part: Part) => void;
  removePart: (partId: string) => void;
  updatePart: (partId: string, updates: Partial<Part>) => void;
  addRobot: (robot: Robot) => void;
  removeRobot: (robotId: string) => void;
  updateRobot: (robotId: string, updates: Partial<Robot>) => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  addMaterials: (amount: number) => void;
  spendMaterials: (amount: number) => boolean;
  addMissionRecord: (record: MissionRecord) => void;
  addRepairRecord: (record: RepairRecord) => void;
  addAssemblyPlan: (plan: AssemblyPlan) => void;
  removeAssemblyPlan: (planId: string) => void;
  updateConfig: (config: Partial<GameConfig>) => void;
  resetConfig: () => void;
  setSelectedPart: (slot: PartType, part: Part | null) => void;
  clearSelectedParts: () => void;
  recyclePart: (partId: string) => void;
  repairRobot: (robotId: string) => { success: boolean; cost: number; restored: number };
  executeMission: (robotId: string, missionId: string) => MissionRecord;
  calculateRobotStats: (parts: Record<PartType, Part | null>) => {
    totalWeight: number;
    totalEnergy: number;
    totalSkillSlots: number;
    maxDurability: number;
    isOverloaded: boolean;
    compatibilityIssues: string[];
    activeSetBonuses: string[];
  };
  calculateAdaptability: (robot: Robot, mission: Mission) => number;
  generateRandomPart: (minRarity?: Rarity) => Part;
  openBlindBox: (type: Rarity, free?: boolean) => Part[];
  recordEthicsDecision: (robotId: string, scenarioId: string, choiceId: string) => EthicsRecord;
  participateInExhibition: (robotId: string, exhibitionId: string) => ExhibitionRecord;
  recordAccident: (robotId: string, accidentType: AccidentType, description: string) => AccidentRecord;
  computeRobotIdentity: (robotId: string) => RobotIdentityResult;
  getRecommendedMissions: (robotId: string) => MissionRecommendation[];
  loadFromStorage: () => void;
  resetGame: () => void;
}

export type Store = GameState & GameActions;
