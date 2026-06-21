import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Package,
  Truck,
  Sparkles,
  Droplets,
  Users,
  Heart,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Star,
  ChevronRight,
  Trophy,
  AlertTriangle,
  RotateCcw,
  History,
  BadgeCheck,
  ShieldCheck,
  Coins,
  AlertOctagon,
} from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { RobotCard } from '../components/RobotCard';
import { StatBar } from '../components/StatBar';
import { Modal } from '../components/Modal';
import { useGameStore } from '../store/useGameStore';
import { MISSIONS } from '../data/defaultConfig';
import { formatDate, getRewardBreakdown } from '../utils/helpers';
import type { MissionType, Robot, Mission, MissionRecord } from '../types';

const missionIcons: Record<MissionType, typeof Package> = {
  transport: Truck,
  cleaning: Sparkles,
  rescue: Heart,
  combat: Swords,
};

const missionColors: Record<MissionType, string> = {
  transport: 'neon-blue',
  cleaning: 'neon-cyan',
  rescue: 'neon-green',
  combat: 'neon-red',
};

const missionBgClasses: Record<MissionType, string> = {
  transport: 'bg-neon-blue/20',
  cleaning: 'bg-neon-cyan/20',
  rescue: 'bg-neon-green/20',
  combat: 'bg-neon-red/20',
};

const missionTextClasses: Record<MissionType, string> = {
  transport: 'text-neon-blue',
  cleaning: 'text-neon-cyan',
  rescue: 'text-neon-green',
  combat: 'text-neon-red',
};

const missionRingClasses: Record<MissionType, string> = {
  transport: 'ring-2 ring-neon-blue shadow-neon-blue',
  cleaning: 'ring-2 ring-neon-cyan shadow-neon-cyan',
  rescue: 'ring-2 ring-neon-green shadow-neon-green',
  combat: 'ring-2 ring-neon-red shadow-neon-red',
};

export function MissionsPage() {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [missionResult, setMissionResult] = useState<MissionRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const robots = useGameStore((s) => s.robots);
  const missionRecords = useGameStore((s) => s.missionRecords);
  const repairRecords = useGameStore((s) => s.repairRecords);
  const ethicsRecords = useGameStore((s) => s.ethicsRecords);
  const exhibitionRecords = useGameStore((s) => s.exhibitionRecords);
  const accidentRecords = useGameStore((s) => s.accidentRecords);
  const calculateAdaptability = useGameStore((s) => s.calculateAdaptability);
  const executeMission = useGameStore((s) => s.executeMission);
  const computeRobotIdentity = useGameStore((s) => s.computeRobotIdentity);
  const config = useGameStore((s) => s.config);

  const availableRobots = useMemo(() => {
    return robots.filter((r) => r.durability > 0);
  }, [robots]);

  const adaptability = useMemo(() => {
    if (!selectedRobot || !selectedMission) return 0;
    return calculateAdaptability(selectedRobot, selectedMission);
  }, [selectedRobot, selectedMission, calculateAdaptability]);

  const selectedIdentity = useMemo(() => {
    if (!selectedRobot) return null;
    return computeRobotIdentity(selectedRobot.id);
  }, [
    selectedRobot,
    computeRobotIdentity,
    missionRecords,
    repairRecords,
    ethicsRecords,
    exhibitionRecords,
    accidentRecords,
  ]);

  const multiplier = selectedIdentity?.rewardMultiplier ?? 1;

  const breakdown = useMemo(
    () => (selectedIdentity ? getRewardBreakdown(selectedIdentity) : null),
    [selectedIdentity]
  );

  const robotAccidents = useMemo(() => {
    if (!selectedRobot) return [];
    return accidentRecords
      .filter((r) => r.robotId === selectedRobot.id)
      .sort((a, b) => b.recordedAt - a.recordedAt);
  }, [accidentRecords, selectedRobot]);

  const accidentTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const rec of robotAccidents) {
      counts[rec.accidentTypeName] = (counts[rec.accidentTypeName] ?? 0) + 1;
    }
    return Object.entries(counts);
  }, [robotAccidents]);

  const handleExecuteMission = () => {
    if (!selectedRobot || !selectedMission) return;

    setIsExecuting(true);
    setMissionResult(null);

    setTimeout(() => {
      const result = executeMission(selectedRobot.id, selectedMission.id);
      setMissionResult(result);
      setIsExecuting(false);
      setSelectedRobot(null);
    }, 2000);
  };

  const successRate = Math.min(95, Math.max(10, adaptability));

  return (
    <PageContainer
      title="任务派遣"
      subtitle={`可用机器人: ${availableRobots.length} | 已完成任务: ${missionRecords.filter((r) => r.success).length}`}
      actions={
        <button onClick={() => setShowHistory(true)} className="btn btn-secondary">
          <History className="w-4 h-4 mr-2" />
          任务记录
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <h3 className="font-display font-bold text-neon-blue mb-4 flex items-center gap-2">
            <Swords className="w-5 h-5" />
            可用任务
          </h3>
          <div className="space-y-4">
            {MISSIONS.map((mission, index) => {
              const Icon = missionIcons[mission.type];
              const isSelected = selectedMission?.id === mission.id;

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedMission(mission);
                    setMissionResult(null);
                  }}
                  className={`card p-4 cursor-pointer transition-all ${
                    isSelected ? missionRingClasses[mission.type] : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${missionBgClasses[mission.type]}`}>
                      <Icon className={`w-6 h-6 ${missionTextClasses[mission.type]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-display font-bold text-white">{mission.name}</h4>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < mission.difficulty ? 'text-neon-orange fill-neon-orange' : 'text-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-white/50 mb-2">{mission.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {mission.requirements.weight && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-neon-blue/20 text-neon-blue">
                            重量 ≥ {mission.requirements.weight}
                          </span>
                        )}
                        {mission.requirements.energy && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-neon-orange/20 text-neon-orange">
                            能耗 ≥ {mission.requirements.energy}
                          </span>
                        )}
                        {mission.requirements.skillSlots && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-neon-purple/20 text-neon-purple">
                            技能 ≥ {mission.requirements.skillSlots}
                          </span>
                        )}
                        {mission.requirements.durability && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-neon-green/20 text-neon-green">
                            耐久 ≥ {mission.requirements.durability}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border-subtle">
                        <span className="text-xs text-neon-green">
                          +{mission.rewards.credits} 信用点
                        </span>
                        <span className="text-xs text-neon-orange">
                          +{mission.rewards.materials} 材料
                        </span>
                        {mission.rewards.blindBox && (
                          <span className="text-xs text-neon-purple">
                            +{config.rarities[mission.rewards.blindBox].name}盲盒
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7">
          {selectedMission ? (
            <div className="space-y-4">
              <div className="card p-4">
                <h3 className="font-display font-bold text-neon-green mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  选择机器人
                </h3>
                {availableRobots.length === 0 ? (
                  <div className="text-center py-8 text-white/30">
                    <RotateCcw className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>没有可用的机器人</p>
                    <p className="text-xs mt-1">先去组装车间组装一个吧！</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableRobots.map((robot) => (
                      <RobotCard
                        key={robot.id}
                        robot={robot}
                        onClick={() => setSelectedRobot(robot)}
                        selected={selectedRobot?.id === robot.id}
                      />
                    ))}
                  </div>
                )}
              </div>

              {selectedRobot && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-6"
                >
                  <h3 className="font-display font-bold text-xl text-white mb-4 text-center">
                    任务预览
                  </h3>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-white/50 mb-1">任务</p>
                      <p className="font-display font-bold text-neon-blue">
                        {selectedMission.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-white/50 mb-1">执行者</p>
                      <p className="font-display font-bold text-neon-green">
                        {selectedRobot.name}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70">任务适配度</span>
                      <span
                        className={`font-mono font-bold text-xl ${
                          adaptability >= 70
                            ? 'text-neon-green'
                            : adaptability >= 40
                            ? 'text-neon-orange'
                            : 'text-neon-red'
                        }`}
                      >
                        {adaptability}%
                      </span>
                    </div>
                    <StatBar
                      label=""
                      value={adaptability}
                      max={100}
                      color={
                        adaptability >= 70
                          ? 'green'
                          : adaptability >= 40
                          ? 'orange'
                          : 'red'
                      }
                      showValue={false}
                    />
                    <p className="text-xs text-white/40 mt-2 text-center">
                      预计成功率: {successRate}%
                    </p>
                  </div>

                  <div className="mb-6 rounded-xl bg-background-tertiary p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-neon-blue" />
                        <span className="text-sm text-white/70">声誉等级</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            color: selectedIdentity?.tier.color,
                            backgroundColor: `${selectedIdentity?.tier.color}22`,
                          }}
                        >
                          {selectedIdentity?.tier.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono">
                        声誉 {selectedIdentity?.reputation}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-background rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-neon-green" />
                          <span className="text-[11px] text-white/50">客户信任</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono font-bold text-lg text-neon-green">
                            {selectedIdentity?.trust}
                          </span>
                          <span className="text-[10px] text-white/30">/100</span>
                        </div>
                        <div className="h-1.5 mt-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-neon-green"
                            style={{ width: `${selectedIdentity?.trust ?? 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="bg-background rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Coins className="w-3.5 h-3.5 text-neon-orange" />
                          <span className="text-[11px] text-white/50">奖励倍率</span>
                        </div>
                        <span className="font-mono font-bold text-lg text-neon-orange">
                          ×{multiplier.toFixed(2)}
                        </span>
                        <p className="text-[9px] text-white/30 mt-0.5">
                          0.8 + 信任×0.7/100
                        </p>
                      </div>
                    </div>

                    {robotAccidents.length > 0 && (
                      <div className="bg-neon-red/5 rounded-lg p-2.5 border border-neon-red/20">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <AlertOctagon className="w-3.5 h-3.5 text-neon-red" />
                          <span className="text-[11px] text-white/60">
                            事故来源 · {robotAccidents.length} 次（来源：事故档案）
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {accidentTypeCounts.map(([name, count]) => (
                            <span
                              key={name}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-red/15 text-neon-red"
                            >
                              {name} ×{count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {breakdown && (
                      <div className="bg-background rounded-lg p-2.5">
                        <p className="text-[11px] text-white/50 mb-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-neon-yellow" />
                          倍率变化原因
                        </p>
                        <ul className="space-y-1">
                          {breakdown.reasons.map((r, i) => (
                            <li
                              key={i}
                              className="text-[10px] text-white/60 flex items-start gap-1.5"
                            >
                              <span className="text-white/30 mt-px">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-background-tertiary rounded-xl p-3 text-center">
                      <p className="text-xs text-white/50 mb-1">信用点</p>
                      <p className="font-mono font-bold text-neon-orange">
                        <span className="text-white/30 line-through text-sm mr-1">
                          {selectedMission.rewards.credits}
                        </span>
                        {Math.round(selectedMission.rewards.credits * multiplier)}
                      </p>
                    </div>
                    <div className="bg-background-tertiary rounded-xl p-3 text-center">
                      <p className="text-xs text-white/50 mb-1">材料</p>
                      <p className="font-mono font-bold text-neon-green">
                        <span className="text-white/30 line-through text-sm mr-1">
                          {selectedMission.rewards.materials}
                        </span>
                        {Math.round(selectedMission.rewards.materials * multiplier)}
                      </p>
                    </div>
                  </div>

                  {selectedRobot.isOverloaded && (
                    <div className="flex items-center gap-2 p-3 bg-neon-red/10 rounded-lg border border-neon-red/30 mb-4">
                      <AlertTriangle className="w-4 h-4 text-neon-red" />
                      <span className="text-xs text-neon-red">
                        机器人处于过载状态，成功率下降 {config.overloadRules.performancePenalty}%
                      </span>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button
                      onClick={handleExecuteMission}
                      disabled={isExecuting}
                      className="btn btn-primary px-8"
                    >
                      {isExecuting ? (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                          执行中...
                        </>
                      ) : (
                        <>
                          <Swords className="w-4 h-4 mr-2" />
                          开始任务
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {missionResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`card p-6 text-center ${
                      missionResult.success
                        ? 'border-neon-green/50'
                        : 'border-neon-red/50'
                    }`}
                  >
                    {missionResult.success ? (
                      <>
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-neon-orange" />
                        <h3 className="font-display text-2xl font-bold text-neon-green mb-2 glow-text-green">
                          任务成功！
                        </h3>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-16 h-16 mx-auto mb-4 text-neon-red" />
                        <h3 className="font-display text-2xl font-bold text-neon-red mb-2 glow-text-red">
                          任务失败
                        </h3>
                      </>
                    )}

                    <p className="text-white/50 mb-4">
                      适配度: {missionResult.adaptability}% | 耐久损耗: -{missionResult.durabilityLoss}
                    </p>

                    <div className="flex items-center justify-center gap-4 mb-4 text-xs">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background-tertiary">
                        <ShieldCheck className="w-3.5 h-3.5 text-neon-green" />
                        <span className="text-white/50">结算信任</span>
                        <span className="font-mono font-bold text-neon-green">
                          {missionResult.trust ?? '—'}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background-tertiary">
                        <Coins className="w-3.5 h-3.5 text-neon-orange" />
                        <span className="text-white/50">结算倍率</span>
                        <span className="font-mono font-bold text-neon-orange">
                          ×{(missionResult.rewardMultiplier ?? 1).toFixed(2)}
                        </span>
                      </span>
                    </div>

                    {missionResult.success && (
                      <div className="flex items-center justify-center gap-6 mb-4">
                        <div className="text-center">
                          <p className="text-sm text-white/50">信用点</p>
                          <p className="font-mono font-bold text-xl text-neon-orange">
                            +{missionResult.rewards.credits}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-white/50">材料</p>
                          <p className="font-mono font-bold text-xl text-neon-green">
                            +{missionResult.rewards.materials}
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setMissionResult(null)}
                      className="btn btn-secondary"
                    >
                      继续
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Swords className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <h3 className="font-display text-xl text-white/50 mb-2">选择一个任务</h3>
              <p className="text-white/30">从左侧列表中选择要执行的任务</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="任务记录"
        size="xl"
      >
        {missionRecords.length === 0 ? (
          <div className="text-center py-8 text-white/30">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无任务记录</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {[...missionRecords].reverse().map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-4 p-3 bg-background-tertiary rounded-lg"
              >
                {record.success ? (
                  <CheckCircle className="w-6 h-6 text-neon-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-neon-red flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">
                      {record.missionName}
                    </span>
                    <span className="text-white/40">→</span>
                    <span className="text-neon-blue truncate">{record.robotName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/50 flex-wrap">
                    <span>适配度: {record.adaptability}%</span>
                    <span>耐久损耗: -{record.durabilityLoss}</span>
                    <span className="text-neon-orange">
                      +{record.rewards.credits} 信用点
                    </span>
                    <span className="text-neon-green">
                      +{record.rewards.materials} 材料
                    </span>
                    <span className="flex items-center gap-1 text-neon-green/80">
                      <ShieldCheck className="w-3 h-3" />
                      信任 {record.trust ?? '—'}
                    </span>
                    <span className="flex items-center gap-1 text-neon-orange/80">
                      <Coins className="w-3 h-3" />
                      ×{(record.rewardMultiplier ?? 1).toFixed(2)}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-white/30 flex-shrink-0">
                  {formatDate(record.completedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
