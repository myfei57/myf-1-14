import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  BadgeCheck,
  ScrollText,
  Target,
  Trophy,
  Scale,
  Gauge,
  Layers,
  Wrench,
  Heart,
  Bot,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  History,
  ChevronRight,
  Coins,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Truck,
  Swords,
  Flame,
  Skull,
  Star,
  Zap,
  Package,
  Award,
  Shield,
  Medal,
  Dumbbell,
  Crosshair,
  Crown,
  AlertOctagon,
  type LucideIcon,
} from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { useGameStore } from '../store/useGameStore';
import {
  REPUTATION_TIERS,
  ETHICS_SCENARIOS,
  EXHIBITIONS,
  ACCIDENT_TYPES,
} from '../data/defaultConfig';
import { formatDate } from '../utils/helpers';
import type {
  Robot,
  EthicsRecord,
  ExhibitionRecord,
  AccidentRecord,
  AccidentType,
  IdentityCategory,
  MissionType,
} from '../types';

const ICON_MAP: Record<string, LucideIcon> = {
  Truck,
  Heart,
  Sparkles,
  Swords,
  Award,
  Shield,
  Wrench,
  AlertTriangle,
  Flame,
  BadgeCheck,
  Skull,
  Trophy,
  Star,
  Zap,
  Package,
  Cpu,
  ShieldCheck,
  Medal,
  Bot,
  Dumbbell,
  Crosshair,
  Crown,
  AlertOctagon,
};

const TIMELINE_CATEGORY_LABEL: Record<string, string> = {
  mission: '任务',
  repair: '维修',
  ethics: '伦理',
  exhibition: '展示',
  accident: '事故',
};

function IdentityIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICON_MAP[name] ?? Award;
  return <Cmp className={className} />;
}

const CATEGORY_LABELS: Record<IdentityCategory, string> = {
  task: '任务选择',
  repair: '维修次数',
  accident: '事故记录',
  ethics: '伦理行为',
  exhibition: '展示经历',
  modification: '改装程度',
  general: '综合资历',
};

const TIER_COLOR_CLASS: Record<string, string> = {
  risk: 'text-neon-red',
  observation: 'text-neon-orange',
  regular: 'text-neon-blue',
  trusted: 'text-neon-green',
  legendary: 'text-neon-orange',
};

const TIER_BG_CLASS: Record<string, string> = {
  risk: 'bg-neon-red/20',
  observation: 'bg-neon-orange/20',
  regular: 'bg-neon-blue/20',
  trusted: 'bg-neon-green/20',
  legendary: 'bg-neon-orange/20',
};

const missionTypeIcon: Record<MissionType, LucideIcon> = {
  transport: Truck,
  cleaning: Sparkles,
  rescue: Heart,
  combat: Swords,
};

const missionTypeText: Record<MissionType, string> = {
  transport: '运输',
  cleaning: '清洁',
  rescue: '救援',
  combat: '战斗',
};

const missionTypeColor: Record<MissionType, string> = {
  transport: 'text-neon-blue',
  cleaning: 'text-neon-cyan',
  rescue: 'text-neon-green',
  combat: 'text-neon-red',
};

type TabId = 'profile' | 'accident' | 'ethics' | 'exhibition' | 'recommend';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: '成长档案', icon: ScrollText },
  { id: 'accident', label: '事故记录', icon: AlertOctagon },
  { id: 'ethics', label: '伦理评估', icon: BadgeCheck },
  { id: 'exhibition', label: '展示大会', icon: Trophy },
  { id: 'recommend', label: '任务推荐', icon: Target },
];

function StatBox({
  label,
  value,
  icon: Icon,
  color = 'text-white',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}) {
  return (
    <div className="bg-background-tertiary rounded-xl p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <p className="text-lg font-mono font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/50">{label}</p>
    </div>
  );
}

export function IdentityPage() {
  const robots = useGameStore((s) => s.robots);
  const missionRecords = useGameStore((s) => s.missionRecords);
  const repairRecords = useGameStore((s) => s.repairRecords);
  const ethicsRecords = useGameStore((s) => s.ethicsRecords);
  const exhibitionRecords = useGameStore((s) => s.exhibitionRecords);
  const accidentRecords = useGameStore((s) => s.accidentRecords);
  const credits = useGameStore((s) => s.credits);
  const computeRobotIdentity = useGameStore((s) => s.computeRobotIdentity);
  const getRecommendedMissions = useGameStore((s) => s.getRecommendedMissions);
  const recordEthicsDecision = useGameStore((s) => s.recordEthicsDecision);
  const participateInExhibition = useGameStore((s) => s.participateInExhibition);
  const recordAccident = useGameStore((s) => s.recordAccident);

  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(
    robots[0]?.id ?? null
  );
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    null
  );
  const [ethicsResult, setEthicsResult] = useState<EthicsRecord | null>(null);
  const [exhibitionResult, setExhibitionResult] =
    useState<ExhibitionRecord | null>(null);
  const [exhibitionError, setExhibitionError] = useState<string | null>(null);
  const [accidentType, setAccidentType] = useState<AccidentType>('overload');
  const [accidentDesc, setAccidentDesc] = useState('');
  const [accidentResult, setAccidentResult] =
    useState<AccidentRecord | null>(null);

  const selectedRobot = robots.find((r) => r.id === selectedRobotId) ?? null;

  const identity = useMemo(() => {
    if (!selectedRobotId) return null;
    return computeRobotIdentity(selectedRobotId);
  }, [
    selectedRobotId,
    computeRobotIdentity,
    missionRecords,
    repairRecords,
    ethicsRecords,
    exhibitionRecords,
    accidentRecords,
  ]);

  const recommendations = useMemo(() => {
    if (!selectedRobotId) return [];
    return getRecommendedMissions(selectedRobotId).slice(0, 4);
  }, [selectedRobotId, getRecommendedMissions, missionRecords, repairRecords, ethicsRecords, exhibitionRecords, accidentRecords]);

  const doneScenarioIds = useMemo(() => {
    if (!selectedRobotId) return new Set<string>();
    return new Set(
      ethicsRecords
        .filter((r) => r.robotId === selectedRobotId)
        .map((r) => r.scenarioId)
    );
  }, [ethicsRecords, selectedRobotId]);

  const robotExhibitions = useMemo(() => {
    if (!selectedRobotId) return [];
    return exhibitionRecords
      .filter((r) => r.robotId === selectedRobotId)
      .sort((a, b) => b.completedAt - a.completedAt);
  }, [exhibitionRecords, selectedRobotId]);

  const robotAccidents = useMemo(() => {
    if (!selectedRobotId) return [];
    return accidentRecords
      .filter((r) => r.robotId === selectedRobotId)
      .sort((a, b) => b.recordedAt - a.recordedAt);
  }, [accidentRecords, selectedRobotId]);

  const handleEthicsChoice = (scenarioId: string, choiceId: string) => {
    if (!selectedRobotId) return;
    const result = recordEthicsDecision(selectedRobotId, scenarioId, choiceId);
    setEthicsResult(result);
  };

  const handleExhibition = (exhibitionId: string) => {
    if (!selectedRobotId) return;
    setExhibitionError(null);
    try {
      const result = participateInExhibition(selectedRobotId, exhibitionId);
      setExhibitionResult(result);
    } catch (e) {
      setExhibitionError(
        e instanceof Error ? e.message : '参展失败，信用点不足'
      );
    }
  };

  const handleRecordAccident = () => {
    if (!selectedRobotId) return;
    const result = recordAccident(selectedRobotId, accidentType, accidentDesc);
    setAccidentResult(result);
    setAccidentDesc('');
  };

  const handleSelectRobot = (robot: Robot) => {
    setSelectedRobotId(robot.id);
    setEthicsResult(null);
    setExhibitionResult(null);
    setExhibitionError(null);
    setSelectedScenarioId(null);
    setAccidentResult(null);
    setAccidentDesc('');
  };

  const activeTags = identity?.tags.filter((t) => t.active) ?? [];
  const progressTags =
    identity?.tags.filter((t) => !t.active && t.progress) ?? [];

  const nextTierIndex = identity
    ? REPUTATION_TIERS.findIndex((t) => t.id === identity.tier.id) + 1
    : -1;
  const nextTier = nextTierIndex < REPUTATION_TIERS.length ? REPUTATION_TIERS[nextTierIndex] : null;
  const progressToNext =
    identity && nextTier
      ? Math.min(
          100,
          ((identity.reputation - identity.tier.min) /
            (nextTier.min - identity.tier.min)) *
            100
        )
      : 100;

  return (
    <PageContainer
      title="身份档案"
      subtitle={`机器人社会评价系统 | 已建档: ${robots.length} 台`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-neon-blue" />
            机器人名册
          </h2>
          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-2 scrollbar-thin">
            {robots.length === 0 ? (
              <div className="card p-8 text-center">
                <Bot className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">暂无机器人</p>
                <p className="text-xs text-white/30 mt-1">
                  先去组装车间组装一台机器人
                </p>
              </div>
            ) : (
              robots.map((robot) => {
                const rid = computeRobotIdentity(robot.id);
                const isSel = selectedRobotId === robot.id;
                return (
                  <motion.div
                    key={robot.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handleSelectRobot(robot)}
                    className={`card p-4 cursor-pointer transition-all ${
                      isSel ? 'ring-2 ring-neon-blue shadow-neon-blue' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${rid.tier.color}22` }}
                      >
                        <Bot
                          className="w-6 h-6"
                          style={{ color: rid.tier.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-white truncate">
                          {robot.name}
                        </h3>
                        <p
                          className="text-xs font-medium"
                          style={{ color: rid.tier.color }}
                        >
                          {rid.tier.name}
                        </p>
                        <div className="mt-1.5 h-1.5 bg-background rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: rid.tier.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${rid.reputation}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono font-bold text-white text-lg">
                          {rid.reputation}
                        </p>
                        <p className="text-[9px] text-white/40">声誉</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedRobot && identity ? (
              <motion.div
                key={selectedRobot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="card p-6">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${identity.tier.color}22` }}
                    >
                      <Bot
                        className="w-10 h-10"
                        style={{ color: identity.tier.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display text-2xl font-bold text-white">
                        {selectedRobot.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-sm font-display font-bold px-2 py-0.5 rounded-full"
                          style={{
                            color: identity.tier.color,
                            backgroundColor: `${identity.tier.color}22`,
                          }}
                        >
                          {identity.tier.name}
                        </span>
                        <span className="text-xs text-white/50">
                          {identity.tier.description}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/60">
                            社会声誉
                          </span>
                          <span
                            className="font-mono font-bold text-lg"
                            style={{ color: identity.tier.color }}
                          >
                            {identity.reputation}
                            <span className="text-xs text-white/40">/100</span>
                          </span>
                        </div>
                        <div className="h-3 bg-background-tertiary rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: identity.tier.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${identity.reputation}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                      <div className="bg-background-tertiary rounded-xl p-3 text-center min-w-[110px]">
                        <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-neon-green" />
                        <p className="text-xl font-mono font-bold text-neon-green">
                          {identity.trust}
                        </p>
                        <p className="text-[10px] text-white/50">客户信任</p>
                      </div>
                      <div className="bg-background-tertiary rounded-xl p-3 text-center min-w-[110px]">
                        <Coins className="w-4 h-4 mx-auto mb-1 text-neon-orange" />
                        <p className="text-xl font-mono font-bold text-neon-orange">
                          ×{identity.rewardMultiplier.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-white/50">奖励倍率</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="text-xs text-white/50 self-center">
                      正向 {identity.positiveTagCount} · 负面{' '}
                      {identity.negativeTagCount}
                    </span>
                    {activeTags.slice(0, 4).map(({ tag }) => (
                      <span
                        key={tag.id}
                        className={`text-[11px] px-2 py-1 rounded-full flex items-center gap-1 ${
                          tag.tier === 'positive'
                            ? 'bg-neon-green/20 text-neon-green'
                            : tag.tier === 'negative'
                            ? 'bg-neon-red/20 text-neon-red'
                            : 'bg-background-tertiary text-white/70'
                        }`}
                      >
                        <IdentityIcon name={tag.icon} className="w-3 h-3" />
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card p-2">
                  <div className="flex flex-wrap gap-1">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-display font-semibold text-sm transition-all ${
                          activeTab === tab.id
                            ? 'bg-neon-blue/20 text-neon-blue'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'profile' && (
                      <div className="space-y-6">
                        <div className="card p-6">
                          <h3 className="font-display font-bold text-neon-blue mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            身份成长路径
                          </h3>
                          <div className="space-y-2">
                            {REPUTATION_TIERS.map((tier, idx) => {
                              const isCurrent = tier.id === identity.tier.id;
                              const isPassed = identity.reputation >= tier.max;
                              return (
                                <div
                                  key={tier.id}
                                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                                    isCurrent
                                      ? 'bg-background-tertiary ring-1 ring-neon-blue/40'
                                      : 'bg-background/40'
                                  }`}
                                >
                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor: tier.color,
                                      opacity: isPassed || isCurrent ? 1 : 0.3,
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="font-display font-bold text-sm"
                                        style={{
                                          color: isPassed || isCurrent ? tier.color : 'rgba(255,255,255,0.4)',
                                        }}
                                      >
                                        {tier.name}
                                      </span>
                                      <span className="text-[10px] text-white/40 font-mono">
                                        {tier.min}-{tier.max}
                                      </span>
                                      {isCurrent && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-blue/20 text-neon-blue">
                                          当前
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-white/40 mt-0.5">
                                      {tier.description}
                                    </p>
                                  </div>
                                  <span className="text-[10px] text-white/30 font-mono">
                                    {idx + 1}/{REPUTATION_TIERS.length}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {nextTier ? (
                            <div className="mt-4 p-3 bg-background-tertiary rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-white/60">
                                  距离下一阶段 · {nextTier.name}
                                </span>
                                <span className="text-xs font-mono text-white">
                                  {identity.reputation}/{nextTier.min}
                                </span>
                              </div>
                              <div className="h-2 bg-background rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: nextTier.color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressToNext}%` }}
                                  transition={{ duration: 0.6 }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 p-3 bg-neon-orange/10 rounded-xl border border-neon-orange/30 flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-neon-orange" />
                              <span className="text-xs text-neon-orange">
                                已抵达最高声誉阶段，传奇之名实至名归
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="card p-6">
                          <h3 className="font-display font-bold text-neon-purple mb-4 flex items-center gap-2">
                            <BadgeCheck className="w-5 h-5" />
                            身份标签与来源
                          </h3>
                          {activeTags.length === 0 ? (
                            <div className="text-center py-6 text-white/40">
                              <Award className="w-10 h-10 mx-auto mb-2 opacity-40" />
                              <p className="text-sm">尚未获得任何身份标签</p>
                              <p className="text-xs mt-1">
                                完成任务、参与伦理评估和展示大会即可解锁
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {activeTags.map(({ tag, source }) => (
                                <div
                                  key={tag.id}
                                  className={`p-3 rounded-xl border ${
                                    tag.tier === 'positive'
                                      ? 'bg-neon-green/5 border-neon-green/30'
                                      : tag.tier === 'negative'
                                      ? 'bg-neon-red/5 border-neon-red/30'
                                      : 'bg-background-tertiary border-border-subtle'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <IdentityIcon
                                      name={tag.icon}
                                      className={`w-4 h-4 ${
                                        tag.tier === 'positive'
                                          ? 'text-neon-green'
                                          : tag.tier === 'negative'
                                          ? 'text-neon-red'
                                          : 'text-white/70'
                                      }`}
                                    />
                                    <span className="font-display font-bold text-sm text-white">
                                      {tag.name}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-background-tertiary text-white/40 ml-auto">
                                      {CATEGORY_LABELS[tag.category]}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-white/50 mb-1">
                                    {tag.description}
                                  </p>
                                  <p className="text-[11px] font-mono text-neon-blue">
                                    来源：{source}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {progressTags.length > 0 && (
                            <>
                              <h4 className="text-sm font-display font-bold text-white/60 mt-5 mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                培育中的标签
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {progressTags.map(({ tag, progress }) => (
                                  <div
                                    key={tag.id}
                                    className="p-3 rounded-xl bg-background-tertiary/50 border border-border-subtle"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <IdentityIcon
                                        name={tag.icon}
                                        className="w-4 h-4 text-white/50"
                                      />
                                      <span className="font-display font-bold text-sm text-white/70">
                                        {tag.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
                                      <span>{progress?.label}</span>
                                      <span className="font-mono">
                                        {progress?.current}/{progress?.required}
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                      <motion.div
                                        className="h-full rounded-full bg-neon-blue/60"
                                        initial={{ width: 0 }}
                                        animate={{
                                          width: `${Math.min(
                                            100,
                                            ((progress?.current ?? 0) /
                                              (progress?.required ?? 1)) *
                                              100
                                          )}%`,
                                        }}
                                        transition={{ duration: 0.5 }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="card p-6">
                          <h3 className="font-display font-bold text-neon-cyan mb-4 flex items-center gap-2">
                            <History className="w-5 h-5" />
                            声誉变化
                          </h3>
                          {identity.timeline.length === 0 ? (
                            <div className="text-center py-6 text-white/40">
                              <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
                              <p className="text-sm">暂无声誉变化记录</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
                              {[...identity.timeline].reverse().map((ev) => (
                                <div
                                  key={ev.id}
                                  className="flex items-center gap-3 p-2.5 bg-background-tertiary rounded-lg"
                                >
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                      ev.outcome === 'success'
                                        ? 'bg-neon-green/20'
                                        : ev.outcome === 'fail'
                                        ? 'bg-neon-red/20'
                                        : 'bg-background'
                                    }`}
                                  >
                                    {ev.delta >= 0 ? (
                                      <TrendingUp className="w-4 h-4 text-neon-green" />
                                    ) : (
                                      <TrendingDown className="w-4 h-4 text-neon-red" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                          ev.category === 'accident'
                                            ? 'bg-neon-red/20 text-neon-red'
                                            : ev.category === 'ethics'
                                            ? 'bg-neon-green/20 text-neon-green'
                                            : ev.category === 'exhibition'
                                            ? 'bg-neon-orange/20 text-neon-orange'
                                            : ev.category === 'repair'
                                            ? 'bg-neon-purple/20 text-neon-purple'
                                            : 'bg-neon-blue/20 text-neon-blue'
                                        }`}
                                      >
                                        {TIMELINE_CATEGORY_LABEL[ev.category] ?? ev.category}
                                      </span>
                                      <span className="text-[10px] text-white/40 truncate">
                                        来源：{ev.source}
                                      </span>
                                    </div>
                                    <p className="text-xs text-white truncate">
                                      {ev.reason}
                                    </p>
                                    <p className="text-[10px] text-white/30">
                                      {formatDate(ev.timestamp)} · 声誉→
                                      {ev.reputationAfter}
                                    </p>
                                  </div>
                                  <span
                                    className={`font-mono font-bold text-sm flex-shrink-0 ${
                                      ev.delta >= 0
                                        ? 'text-neon-green'
                                        : 'text-neon-red'
                                    }`}
                                  >
                                    {ev.delta >= 0 ? '+' : ''}
                                    {ev.delta}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="card p-6">
                          <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-neon-blue" />
                            身份数据总览
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatBox
                              label="任务成功"
                              value={identity.stats.missionSuccess}
                              icon={CheckCircle}
                              color="text-neon-green"
                            />
                            <StatBox
                              label="任务失败"
                              value={identity.stats.missionFail}
                              icon={XCircle}
                              color="text-neon-red"
                            />
                            <StatBox
                              label="事故记录"
                              value={identity.stats.accidentCount}
                              icon={AlertOctagon}
                              color="text-neon-red"
                            />
                            <StatBox
                              label="返修次数"
                              value={identity.stats.repairCount}
                              icon={Wrench}
                              color="text-neon-orange"
                            />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                            {(['transport', 'cleaning', 'rescue', 'combat'] as MissionType[]).map(
                              (type) => {
                                const Icon = missionTypeIcon[type];
                                const data = identity.stats.missionByType[type];
                                return (
                                  <div
                                    key={type}
                                    className="bg-background-tertiary rounded-xl p-3 text-center"
                                  >
                                    <Icon
                                      className={`w-4 h-4 mx-auto mb-1 ${missionTypeColor[type]}`}
                                    />
                                    <p className="text-sm font-mono font-bold text-white">
                                      {data.success}/{data.success + data.fail}
                                    </p>
                                    <p className="text-[10px] text-white/50">
                                      {missionTypeText[type]}
                                    </p>
                                  </div>
                                );
                              }
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                            <StatBox
                              label="参展次数"
                              value={identity.stats.exhibitionCount}
                              icon={Trophy}
                              color="text-neon-purple"
                            />
                            <StatBox
                              label="伦理抉择"
                              value={identity.stats.ethicalChoices}
                              icon={BadgeCheck}
                              color="text-neon-green"
                            />
                            <StatBox
                              label="违规抉择"
                              value={identity.stats.unethicalChoices}
                              icon={AlertTriangle}
                              color="text-neon-red"
                            />
                            <StatBox
                              label="装配零件"
                              value={`${identity.stats.partsInstalled}/6`}
                              icon={Cpu}
                              color="text-neon-blue"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'accident' && (
                      <div className="card p-6">
                        <h3 className="font-display font-bold text-neon-red mb-1 flex items-center gap-2">
                          <AlertOctagon className="w-5 h-5" />
                          事故记录
                        </h3>
                        <p className="text-xs text-white/50 mb-4">
                          独立登记机体事故。事故与任务失败分别计账，会直接拉低声誉与客户信任，并催生「事故频发」「危险试验机」等身份标签。
                        </p>

                        <div className="rounded-xl border border-neon-red/30 bg-neon-red/5 p-4 mb-4">
                          <p className="text-sm font-display font-bold text-white mb-3">
                            登记新事故
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                            {ACCIDENT_TYPES.map((at) => {
                              const selected = accidentType === at.id;
                              return (
                                <button
                                  key={at.id}
                                  onClick={() => setAccidentType(at.id)}
                                  className={`p-2.5 rounded-lg border text-left transition-all ${
                                    selected
                                      ? 'border-neon-red/60 bg-neon-red/15'
                                      : 'border-border-subtle bg-background hover:border-neon-red/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <AlertOctagon
                                      className={`w-3.5 h-3.5 ${
                                        selected ? 'text-neon-red' : 'text-white/50'
                                      }`}
                                    />
                                    <span
                                      className={`text-xs font-display font-bold ${
                                        selected ? 'text-white' : 'text-white/70'
                                      }`}
                                    >
                                      {at.name}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-white/40">
                                    严重度 {at.severity} · 声誉 {at.reputationChange}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                          <textarea
                            value={accidentDesc}
                            onChange={(e) => setAccidentDesc(e.target.value)}
                            placeholder={
                              ACCIDENT_TYPES.find((t) => t.id === accidentType)
                                ?.description ?? '补充事故细节（可选）'
                            }
                            rows={2}
                            className="w-full bg-background rounded-lg p-2.5 text-sm text-white placeholder-white/30 border border-border-subtle focus:border-neon-red/50 focus:outline-none resize-none"
                          />
                          <button
                            onClick={handleRecordAccident}
                            className="mt-3 w-full py-2.5 rounded-lg font-display font-semibold text-sm bg-gradient-to-r from-neon-red to-neon-orange text-white hover:shadow-lg hover:shadow-neon-red/20"
                          >
                            提交事故记录
                          </button>
                        </div>

                        <AnimatePresence>
                          {accidentResult && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mb-4 p-3 rounded-lg bg-neon-red/10 border border-neon-red/30 flex items-center gap-3"
                            >
                              <AlertOctagon className="w-5 h-5 text-neon-red flex-shrink-0" />
                              <div>
                                <p className="text-sm text-white">
                                  事故已登记：{accidentResult.accidentTypeName}
                                </p>
                                <p className="text-[11px] text-white/60">
                                  严重度 {accidentResult.severity} · 声誉{' '}
                                  <span className="text-neon-red">
                                    {accidentResult.reputationChange}
                                  </span>
                                  ，客户信任随之下降
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {robotAccidents.length === 0 ? (
                          <div className="text-center py-6 text-white/40">
                            <AlertOctagon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">暂无事故记录</p>
                            <p className="text-xs mt-1">该机体保持清白之身</p>
                          </div>
                        ) : (
                          <div>
                            <h4 className="text-sm font-display font-bold text-white/60 mb-2 flex items-center gap-2">
                              <History className="w-4 h-4" />
                              事故档案 ({robotAccidents.length})
                            </h4>
                            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                              {robotAccidents.map((rec) => (
                                <div
                                  key={rec.id}
                                  className="flex items-start gap-3 p-3 bg-background-tertiary rounded-lg"
                                >
                                  <span
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                      rec.severity >= 4
                                        ? 'bg-neon-red/20 text-neon-red'
                                        : 'bg-neon-orange/20 text-neon-orange'
                                    }`}
                                  >
                                    <AlertOctagon className="w-4 h-4" />
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-display font-bold text-white">
                                        {rec.accidentTypeName}
                                      </p>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-red/20 text-neon-red">
                                        严重度 {rec.severity}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-white/50 mt-0.5 line-clamp-2">
                                      {rec.description}
                                    </p>
                                    <p className="text-[10px] text-white/30 mt-0.5">
                                      {formatDate(rec.recordedAt)}
                                    </p>
                                  </div>
                                  <span className="text-[11px] font-mono font-bold text-neon-red flex-shrink-0">
                                    {rec.reputationChange}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'ethics' && (
                      <div className="card p-6">
                        <h3 className="font-display font-bold text-neon-green mb-1 flex items-center gap-2">
                          <BadgeCheck className="w-5 h-5" />
                          伦理评估
                        </h3>
                        <p className="text-xs text-white/50 mb-4">
                          面对伦理困境的抉择将塑造机器人的社会形象，每个情境每台机器人仅可抉择一次。
                        </p>
                        <div className="space-y-3">
                          {ETHICS_SCENARIOS.map((scenario) => {
                            const done = doneScenarioIds.has(scenario.id);
                            const doneRecord = ethicsRecords.find(
                              (r) =>
                                r.robotId === selectedRobot.id &&
                                r.scenarioId === scenario.id
                            );
                            const isExpanded =
                              selectedScenarioId === scenario.id;
                            return (
                              <div
                                key={scenario.id}
                                className={`rounded-xl border transition-all ${
                                  isExpanded
                                    ? 'border-neon-blue/50 bg-background-tertiary'
                                    : 'border-border-subtle bg-background-tertiary/50'
                                }`}
                              >
                                <button
                                  onClick={() => {
                                    setSelectedScenarioId(
                                      isExpanded ? null : scenario.id
                                    );
                                    setEthicsResult(doneRecord ?? null);
                                  }}
                                  className="w-full flex items-center gap-3 p-4 text-left"
                                >
                                  <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center flex-shrink-0">
                                    <IdentityIcon
                                      name={scenario.icon}
                                      className="w-5 h-5 text-neon-purple"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-display font-bold text-white text-sm">
                                      {scenario.title}
                                    </p>
                                    <p className="text-[11px] text-white/50 truncate">
                                      {scenario.description}
                                    </p>
                                  </div>
                                  {done && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      已评估
                                    </span>
                                  )}
                                  <ChevronRight
                                    className={`w-4 h-4 text-white/40 transition-transform ${
                                      isExpanded ? 'rotate-90' : ''
                                    }`}
                                  />
                                </button>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-4 pb-4 space-y-2">
                                        {scenario.choices.map((choice) => {
                                          const chosen =
                                            doneRecord?.choiceId === choice.id;
                                          return (
                                            <button
                                              key={choice.id}
                                              disabled={done}
                                              onClick={() =>
                                                handleEthicsChoice(
                                                  scenario.id,
                                                  choice.id
                                                )
                                              }
                                              className={`w-full text-left p-3 rounded-lg border transition-all ${
                                                chosen
                                                  ? choice.type === 'ethical'
                                                    ? 'border-neon-green/50 bg-neon-green/10'
                                                    : choice.type === 'unethical'
                                                    ? 'border-neon-red/50 bg-neon-red/10'
                                                    : 'border-border-moderate bg-background'
                                                  : done
                                                  ? 'border-border-subtle bg-background/50 opacity-50 cursor-not-allowed'
                                                  : 'border-border-subtle bg-background hover:border-neon-blue/50 hover:bg-background-tertiary'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-white">
                                                  {choice.label}
                                                </span>
                                                <span
                                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                    choice.type === 'ethical'
                                                      ? 'bg-neon-green/20 text-neon-green'
                                                      : choice.type === 'unethical'
                                                      ? 'bg-neon-red/20 text-neon-red'
                                                      : 'bg-background-tertiary text-white/50'
                                                  }`}
                                                >
                                                  {choice.reputationChange >= 0
                                                    ? `+${choice.reputationChange}`
                                                    : choice.reputationChange}
                                                </span>
                                              </div>
                                              <p className="text-[11px] text-white/50">
                                                {choice.consequence}
                                              </p>
                                            </button>
                                          );
                                        })}
                                        {ethicsResult &&
                                          ethicsResult.scenarioId ===
                                            scenario.id && (
                                            <div className="mt-2 p-3 rounded-lg bg-neon-blue/10 border border-neon-blue/30 flex items-center gap-3">
                                              <BadgeCheck className="w-5 h-5 text-neon-blue flex-shrink-0" />
                                              <div>
                                                <p className="text-sm text-white">
                                                  抉择已记录：{
                                                    ethicsResult.choiceLabel
                                                  }
                                                </p>
                                                <p className="text-[11px] text-white/60">
                                                  声誉{' '}
                                                  <span
                                                    className={
                                                      ethicsResult.reputationChange >=
                                                      0
                                                        ? 'text-neon-green'
                                                        : 'text-neon-red'
                                                    }
                                                  >
                                                    {ethicsResult.reputationChange >=
                                                    0
                                                      ? '+'
                                                      : ''}
                                                    {
                                                      ethicsResult.reputationChange
                                                    }
                                                  </span>
                                                  ，身份标签将随之演化
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {activeTab === 'exhibition' && (
                      <div className="card p-6">
                        <h3 className="font-display font-bold text-neon-orange mb-1 flex items-center gap-2">
                          <Trophy className="w-5 h-5" />
                          展示大会
                        </h3>
                        <p className="text-xs text-white/50 mb-4">
                          缴纳报名费参加展示大会，根据机体表现获得名次、奖励与声誉。名次越高声誉加成越大。
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {EXHIBITIONS.map((ex) => {
                            const canAfford = credits >= ex.entryFee;
                            return (
                              <div
                                key={ex.id}
                                className="p-4 rounded-xl bg-background-tertiary border border-border-subtle"
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-lg bg-neon-orange/20 flex items-center justify-center">
                                    <IdentityIcon
                                      name={ex.icon}
                                      className="w-5 h-5 text-neon-orange"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-display font-bold text-white text-sm">
                                      {ex.name}
                                    </p>
                                    <p className="text-[11px] text-white/50">
                                      报名费 {ex.entryFee} 信用点
                                    </p>
                                  </div>
                                </div>
                                <p className="text-[11px] text-white/50 mb-3">
                                  {ex.description}
                                </p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {ex.tiers.map((tier) => (
                                    <span
                                      key={tier.rank}
                                      className="text-[9px] px-1.5 py-0.5 rounded bg-background text-white/50 font-mono"
                                    >
                                      {tier.label} +{tier.reputationChange}
                                    </span>
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleExhibition(ex.id)}
                                  disabled={!canAfford}
                                  className={`w-full py-2 rounded-lg font-display font-semibold text-sm transition-all ${
                                    canAfford
                                      ? 'bg-gradient-to-r from-neon-orange to-neon-red text-white hover:shadow-lg hover:shadow-neon-orange/20'
                                      : 'bg-background text-white/30 cursor-not-allowed'
                                  }`}
                                >
                                  {canAfford ? '报名参展' : '信用点不足'}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {exhibitionError && (
                          <div className="mt-4 p-3 rounded-lg bg-neon-red/10 border border-neon-red/30 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-neon-red" />
                            <span className="text-xs text-neon-red">
                              {exhibitionError}
                            </span>
                          </div>
                        )}

                        <AnimatePresence>
                          {exhibitionResult && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`mt-4 p-4 rounded-xl border ${
                                exhibitionResult.rank === 1
                                  ? 'bg-neon-orange/10 border-neon-orange/40'
                                  : exhibitionResult.rank <= 3
                                  ? 'bg-neon-blue/10 border-neon-blue/30'
                                  : 'bg-background-tertiary border-border-subtle'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Trophy
                                  className={`w-8 h-8 ${
                                    exhibitionResult.rank === 1
                                      ? 'text-neon-orange'
                                      : 'text-neon-blue'
                                  }`}
                                />
                                <div className="flex-1">
                                  <p className="font-display font-bold text-white">
                                    {exhibitionResult.exhibitionName} ·{' '}
                                    {exhibitionResult.rankLabel}
                                  </p>
                                  <p className="text-xs text-white/60">
                                    展示评分 {exhibitionResult.displayScore} ·
                                    奖励 +{exhibitionResult.reward} 信用点 ·
                                    声誉{' '}
                                    <span className="text-neon-green">
                                      +{exhibitionResult.reputationChange}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {robotExhibitions.length > 0 && (
                          <div className="mt-5">
                            <h4 className="text-sm font-display font-bold text-white/60 mb-2 flex items-center gap-2">
                              <History className="w-4 h-4" />
                              参展记录
                            </h4>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                              {robotExhibitions.map((rec) => (
                                <div
                                  key={rec.id}
                                  className="flex items-center gap-3 p-2.5 bg-background-tertiary rounded-lg"
                                >
                                  <span
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 ${
                                      rec.rank === 1
                                        ? 'bg-neon-orange/20 text-neon-orange'
                                        : rec.rank <= 3
                                        ? 'bg-neon-blue/20 text-neon-blue'
                                        : 'bg-background text-white/50'
                                    }`}
                                  >
                                    {rec.rank}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white truncate">
                                      {rec.exhibitionName} · {rec.rankLabel}
                                    </p>
                                    <p className="text-[10px] text-white/30">
                                      {formatDate(rec.completedAt)} · 评分{' '}
                                      {rec.displayScore}
                                    </p>
                                  </div>
                                  <span className="text-[11px] font-mono text-neon-green flex-shrink-0">
                                    +{rec.reputationChange}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'recommend' && (
                      <div className="card p-6">
                        <h3 className="font-display font-bold text-neon-blue mb-1 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          任务推荐
                        </h3>
                        <p className="text-xs text-white/50 mb-4">
                          基于身份标签、客户信任与机体适配度综合排序，当前奖励倍率 ×
                          {identity.rewardMultiplier.toFixed(2)}（由客户信任 {identity.trust} 驱动）。
                        </p>
                        <div className="space-y-3">
                          {recommendations.map(({ mission, adaptability, score, rank, reasons }) => {
                            const Icon = missionTypeIcon[mission.type];
                            return (
                              <div
                                key={mission.id}
                                className={`p-4 rounded-xl border ${
                                  rank === 1
                                    ? 'bg-neon-orange/5 border-neon-orange/40'
                                    : 'bg-background-tertiary border-border-subtle'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-mono font-bold ${
                                      rank === 1
                                        ? 'bg-neon-orange/20 text-neon-orange'
                                        : rank <= 3
                                        ? 'bg-neon-blue/20 text-neon-blue'
                                        : 'bg-background text-white/50'
                                    }`}
                                  >
                                    #{rank}
                                  </div>
                                  <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${missionTypeColor[mission.type].replace(
                                      'text-',
                                      'bg-'
                                    )}/20`}
                                  >
                                    <Icon
                                      className={`w-5 h-5 ${missionTypeColor[mission.type]}`}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-display font-bold text-white text-sm">
                                        {mission.name}
                                      </p>
                                      <span className="text-xs font-mono text-neon-orange flex-shrink-0">
                                        +{Math.round(mission.rewards.credits * identity.rewardMultiplier)} 信用
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-white/50">
                                      <span className="flex items-center gap-1">
                                        <Scale className="w-3 h-3" />
                                        适配 {adaptability}%
                                      </span>
                                      <span className="flex items-center gap-1 text-neon-blue">
                                        <TrendingUp className="w-3 h-3" />
                                        综评 {score}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {reasons.map((r, i) => (
                                        <span
                                          key={i}
                                          className="text-[10px] px-1.5 py-0.5 rounded bg-neon-blue/10 text-neon-blue"
                                        >
                                          {r}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <NavLink
                          to="/missions"
                          className="btn btn-secondary w-full mt-4 justify-center"
                        >
                          <Swords className="w-4 h-4 mr-2" />
                          前往任务派遣
                        </NavLink>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-12 text-center"
              >
                <BadgeCheck className="w-16 h-16 text-white/10 mx-auto mb-4" />
                <p className="text-white/50">选择一台机器人查看身份档案</p>
                <p className="text-xs text-white/30 mt-2">
                  身份档案记录任务选择、维修次数、事故记录、伦理行为、展示经历与改装程度
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageContainer>
  );
}
