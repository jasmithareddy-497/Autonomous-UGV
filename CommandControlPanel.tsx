import type {
  ControlMode,
  ManualCommand,
  CommandEntry,
  UGVState,
  Mission,
  Telemetry,
} from '@/types';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Square,
  Octagon,
  Radio,
  Battery,
  Gauge,
  MapPin,
  Navigation,
  Activity,
  Wifi,
  Clock,
  AlertTriangle,
  Play,
} from 'lucide-react';

interface CommandControlPanelProps {
  controlMode: ControlMode;
  onModeChange: (mode: ControlMode) => void;
  manualCommand: ManualCommand | null;
  onManualCommand: (cmd: ManualCommand) => void;
  speedScale: number;
  onSpeedChange: (val: number) => void;
  commandHistory: CommandEntry[];
  ugv: UGVState;
  mission: Mission;
  telemetry: Telemetry;
  connected: boolean;
  lastCommandTime: string;
  obstacleAhead: boolean;
  onResumeNavigation: () => void;
}

const statusColors: Record<string, string> = {
  SENT: 'text-sky-400',
  EXECUTING: 'text-amber-400',
  COMPLETED: 'text-green-400',
  BLOCKED: 'text-red-400',
};

const statusBg: Record<string, string> = {
  SENT: 'bg-sky-950/40 border-sky-700/30',
  EXECUTING: 'bg-amber-950/40 border-amber-700/30',
  COMPLETED: 'bg-green-950/40 border-green-700/30',
  BLOCKED: 'bg-red-950/40 border-red-700/30',
};

const cmdLabels: Record<string, string> = {
  FORWARD: 'FWD',
  BACKWARD: 'REV',
  TURN_LEFT: 'L TURN',
  TURN_RIGHT: 'R TURN',
  ROTATE: 'ROTATE',
  STOP: 'STOP',
  LEFT: 'L TURN',
  RIGHT: 'R TURN',
  REVERSE: 'REV',
  SLOW_DOWN: 'SLOW',
};

export default function CommandControlPanel({
  controlMode,
  onModeChange,
  manualCommand,
  onManualCommand,
  speedScale,
  onSpeedChange,
  commandHistory,
  ugv,
  mission,
  telemetry,
  connected,
  lastCommandTime,
  obstacleAhead,
  onResumeNavigation,
}: CommandControlPanelProps) {
  const isEmergency = mission.status === 'EMERGENCY_STOP';
  const speedPct = Math.round(speedScale * 100);
  const speedLabel = speedScale < 0.34 ? 'LOW' : speedScale < 0.67 ? 'MEDIUM' : 'HIGH';

  const dirBtn = (
    cmd: ManualCommand,
    icon: React.ReactNode,
    label: string,
    col: string,
    row: string,
  ) => {
    const isActive = manualCommand === cmd && controlMode === 'MANUAL';
    return (
      <button
        onClick={() => onManualCommand(cmd)}
        disabled={isEmergency}
        className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border transition-all ${
          col} ${row} ${
          isActive
            ? 'border-sky-400 bg-sky-950/50 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
            : isEmergency
            ? 'border-slate-800 bg-slate-900/30 text-slate-700 cursor-not-allowed'
            : 'border-slate-700/40 bg-slate-900/40 text-slate-400 hover:border-sky-600/40 hover:bg-slate-800/40 hover:text-sky-300'
        }`}
        style={{ minHeight: '42px' }}
      >
        {icon}
        <span className="text-[8px] font-mono font-bold tracking-wider">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2.5 p-3">
      {/* Control Mode Toggle */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-900/60 border border-slate-700/30">
        <button
          onClick={() => onModeChange('MANUAL')}
          className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-mono font-bold tracking-wider transition-all ${
            controlMode === 'MANUAL'
              ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40'
              : 'text-slate-500 hover:text-slate-400 border border-transparent'
          }`}
        >
          <Radio className="w-3 h-3" />
          MANUAL
        </button>
        <button
          onClick={() => onModeChange('AUTONOMOUS')}
          className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-mono font-bold tracking-wider transition-all ${
            controlMode === 'AUTONOMOUS'
              ? 'bg-green-600/30 text-green-300 border border-green-500/40'
              : 'text-slate-500 hover:text-slate-400 border border-transparent'
          }`}
        >
          <Navigation className="w-3 h-3" />
          AUTONOMOUS
        </button>
      </div>

      {/* UGV Status Card */}
      <div className="space-y-1 px-2.5 py-2 rounded-lg bg-slate-900/60 border border-slate-700/30">
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="flex items-center gap-1 text-slate-500">
            <Wifi className="w-2.5 h-2.5" />
            CONNECTION
          </span>
          <span className={connected ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="text-slate-500">MODE</span>
          <span className={`font-bold ${controlMode === 'MANUAL' ? 'text-sky-400' : 'text-green-400'}`}>
            {controlMode}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="text-slate-500">COMMAND</span>
          <span className="text-sky-400 font-bold">
            {isEmergency ? 'E-STOP' : manualCommand ?? ugv.command}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="text-slate-500">SPEED</span>
          <span className="text-sky-400 font-bold">{telemetry.speed.toFixed(1)} m/s</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="flex items-center gap-1 text-slate-500">
            <MapPin className="w-2.5 h-2.5" />
            POSITION
          </span>
          <span className="text-green-400 font-bold">
            {ugv.pos.x.toFixed(1)}, {ugv.pos.y.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="text-slate-500">NAV STATUS</span>
          <span className={`font-bold ${
            mission.status === 'NAVIGATING' ? 'text-green-400'
            : mission.status === 'EMERGENCY_STOP' ? 'text-red-400'
            : mission.status === 'COMPLETED' ? 'text-green-400'
            : mission.status === 'OBSTACLE_DETECTED' || mission.status === 'REPLANNING' ? 'text-amber-400'
            : 'text-slate-400'
          }`}>
            {mission.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="flex items-center gap-1 text-slate-500">
            <AlertTriangle className="w-2.5 h-2.5" />
            OBSTACLE
          </span>
          <span className={`font-bold ${obstacleAhead ? 'text-red-400' : 'text-slate-500'}`}>
            {obstacleAhead ? 'DETECTED' : 'CLEAR'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="flex items-center gap-1 text-slate-500">
            <Battery className="w-2.5 h-2.5" />
            BATTERY
          </span>
          <span className={`font-bold ${
            telemetry.battery > 50 ? 'text-green-400' : telemetry.battery > 20 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {telemetry.battery.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="w-2.5 h-2.5" />
            LAST CMD
          </span>
          <span className="text-slate-400 font-bold">{lastCommandTime}</span>
        </div>
      </div>

      {/* Directional Controls */}
      <div className="grid grid-cols-3 gap-1.5">
        {dirBtn('TURN_LEFT', <ArrowLeft className="w-4 h-4" />, 'L TURN', '', '')}
        {dirBtn('FORWARD', <ArrowUp className="w-4 h-4" />, 'FWD', '', '')}
        {dirBtn('TURN_RIGHT', <ArrowRight className="w-4 h-4" />, 'R TURN', '', '')}
        {dirBtn('ROTATE', <RotateCw className="w-4 h-4" />, 'ROTATE', '', '')}
        {dirBtn('STOP', <Square className="w-4 h-4" />, 'STOP', '', '')}
        {dirBtn('BACKWARD', <ArrowDown className="w-4 h-4" />, 'REV', '', '')}
      </div>

      {/* Emergency Stop + Resume */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => onManualCommand('STOP')}
          disabled={isEmergency}
          className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-slate-700/30 border border-slate-600/40 text-slate-300 text-[10px] font-mono font-bold hover:bg-slate-700/50 transition-all disabled:opacity-30"
        >
          <Square className="w-3 h-3" />
          STOP
        </button>
        <button
          onClick={() => {
            // This triggers emergency stop via parent
            const event = new CustomEvent('ugv-estop');
            window.dispatchEvent(event);
          }}
          className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg border-2 text-[10px] font-mono font-bold transition-all ${
            isEmergency
              ? 'bg-red-600/40 border-red-500 text-red-300 animate-pulse'
              : 'bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/40'
          }`}
        >
          <Octagon className="w-3 h-3" />
          E-STOP
        </button>
      </div>

      {isEmergency && (
        <button
          onClick={onResumeNavigation}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600/20 border border-green-600/40 text-green-400 text-[10px] font-mono font-bold hover:bg-green-600/30 transition-all"
        >
          <Play className="w-3 h-3" />
          RESUME NAVIGATION
        </button>
      )}

      {/* Speed Control */}
      <div className="px-2.5 py-2 rounded-lg bg-slate-900/60 border border-slate-700/30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500 tracking-wider">
            <Gauge className="w-2.5 h-2.5" />
            SPEED CONTROL
          </span>
          <span className="text-[9px] font-mono text-sky-400 font-bold">{speedPct}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={speedPct}
          onChange={(e) => onSpeedChange(Number(e.target.value) / 100)}
          className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500"
        />
        <div className="flex justify-between mt-1 text-[8px] font-mono">
          <span className={speedLabel === 'LOW' ? 'text-sky-400 font-bold' : 'text-slate-600'}>LOW</span>
          <span className={speedLabel === 'MEDIUM' ? 'text-sky-400 font-bold' : 'text-slate-600'}>MED</span>
          <span className={speedLabel === 'HIGH' ? 'text-sky-400 font-bold' : 'text-slate-600'}>HIGH</span>
        </div>
        <div className="text-center text-[9px] font-mono text-slate-500 mt-0.5">
          {speedLabel} — {(speedScale * 3.0).toFixed(1)} m/s max
        </div>
      </div>

      {/* Command History */}
      <div className="rounded-lg bg-slate-900/60 border border-slate-700/30 overflow-hidden">
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-700/20">
          <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500 tracking-wider">
            <Activity className="w-2.5 h-2.5" />
            COMMAND HISTORY
          </span>
          <span className="text-[8px] font-mono text-slate-600">{commandHistory.length} cmds</span>
        </div>
        <div className="max-h-32 overflow-y-auto">
          {commandHistory.length === 0 ? (
            <div className="px-2.5 py-2 text-[9px] font-mono text-slate-600 text-center">
              No commands sent
            </div>
          ) : (
            [...commandHistory].reverse().slice(0, 12).map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 border-b border-slate-800/30 ${statusBg[entry.status] || ''}`}
              >
                <span className={`text-[8px] font-mono font-bold w-12 ${statusColors[entry.status] || 'text-slate-400'}`}>
                  {entry.status}
                </span>
                <span className="text-[9px] font-mono text-slate-300 w-14">
                  {cmdLabels[entry.command] || entry.command}
                </span>
                <span className={`text-[7px] font-mono w-10 ${
                  entry.source === 'MANUAL' ? 'text-sky-500' : entry.source === 'AUTONOMOUS' ? 'text-green-500' : 'text-amber-500'
                }`}>
                  {entry.source.slice(0, 4)}
                </span>
                <span className="text-[7px] font-mono text-slate-600 ml-auto">
                  {entry.timestamp}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
