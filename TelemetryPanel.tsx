import type { Telemetry, NavigationCommand, CameraMode, MissionStatus, AIStats } from '@/types';
import { getCompassDirection } from '@/sim/vehicle';
import {
  Compass,
  Gauge,
  Battery,
  Cpu,
  Wifi,
  MapPin,
  Signal,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Timer,
  Camera,
  Eye,
  Route,
  ScanLine,
  Crosshair,
  ShieldCheck,
} from 'lucide-react';

interface TelemetryPanelProps {
  telemetry: Telemetry;
  command: NavigationCommand;
  cameraMode: CameraMode;
  cameraEnabled: boolean;
  missionStatus: MissionStatus;
  aiStats?: AIStats;
}

export default function TelemetryPanel({ telemetry, command, cameraMode, cameraEnabled, missionStatus, aiStats }: TelemetryPanelProps) {
  const commandColors: Record<NavigationCommand, string> = {
    FORWARD: 'text-green-400',
    LEFT: 'text-sky-400',
    RIGHT: 'text-sky-400',
    REVERSE: 'text-amber-400',
    STOP: 'text-red-400',
    SLOW_DOWN: 'text-amber-400',
  };

  const batteryColor =
    telemetry.battery > 60 ? 'text-green-400' : telemetry.battery > 25 ? 'text-amber-400' : 'text-red-400';

  const riskColor = telemetry.riskLevel > 70 ? 'text-red-400' : telemetry.riskLevel > 40 ? 'text-amber-400' : 'text-green-400';
  const riskBg = telemetry.riskLevel > 70 ? 'bg-red-950/40 border-red-700/40' : telemetry.riskLevel > 40 ? 'bg-amber-950/40 border-amber-700/40' : 'bg-green-950/30 border-green-700/30';

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* Main telemetry grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="px-2.5 py-2 rounded bg-slate-900/60 border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono">
            <MapPin className="w-2.5 h-2.5" /> POS X
          </div>
          <div className="text-lg font-mono font-bold text-sky-300">
            {telemetry.x.toFixed(1)}
            <span className="text-xs text-slate-600 ml-1">m</span>
          </div>
        </div>

        <div className="px-2.5 py-2 rounded bg-slate-900/60 border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono">
            <MapPin className="w-2.5 h-2.5" /> POS Y
          </div>
          <div className="text-lg font-mono font-bold text-sky-300">
            {telemetry.y.toFixed(1)}
            <span className="text-xs text-slate-600 ml-1">m</span>
          </div>
        </div>

        <div className="px-2.5 py-2 rounded bg-slate-900/60 border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono">
            <Compass className="w-2.5 h-2.5" /> HEADING
          </div>
          <div className="text-lg font-mono font-bold text-sky-300">
            {telemetry.heading.toFixed(0)}°
            <span className="text-xs text-slate-600 ml-1">{getCompassDirection(telemetry.heading * Math.PI / 180)}</span>
          </div>
        </div>

        <div className="px-2.5 py-2 rounded bg-slate-900/60 border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono">
            <Gauge className="w-2.5 h-2.5" /> SPEED
          </div>
          <div className="text-lg font-mono font-bold text-sky-300">
            {telemetry.speed.toFixed(2)}
            <span className="text-xs text-slate-600 ml-1">m/s</span>
          </div>
          <div className="text-[9px] font-mono text-amber-500/60">
            LIM: {telemetry.adaptiveSpeedLimit.toFixed(1)}m/s
          </div>
        </div>
      </div>

      {/* Distance bars */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
            <span>DISTANCE TRAVELED</span>
            <span className="text-sky-400">{telemetry.distanceTraveled.toFixed(1)}m</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, telemetry.distanceTraveled)}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
            <span>DISTANCE REMAINING</span>
            <span className="text-amber-400">{telemetry.distanceRemaining.toFixed(1)}m</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, telemetry.distanceRemaining)}%` }} />
          </div>
        </div>
      </div>

      {/* Risk & Safety */}
      <div className={`px-3 py-2 rounded-lg border ${riskBg}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className={`w-3 h-3 ${riskColor}`} />
            <span className="text-[10px] font-mono text-slate-500">RISK LEVEL</span>
          </div>
          <span className={`text-sm font-mono font-bold ${riskColor}`}>
            {telemetry.riskLevel.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${
            telemetry.riskLevel > 70 ? 'bg-red-500' : telemetry.riskLevel > 40 ? 'bg-amber-500' : 'bg-green-500'
          }`} style={{ width: `${telemetry.riskLevel}%` }} />
        </div>
        {telemetry.collisionWarning && (
          <div className="flex items-center gap-1.5 mt-1.5 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-[10px] font-mono font-bold text-red-400">COLLISION WARNING — AUTO E-STOP</span>
          </div>
        )}
      </div>

      {/* System stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="px-2 py-1.5 rounded bg-slate-900/60 border border-slate-700/40">
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
            <Battery className="w-2.5 h-2.5" /> BAT
          </div>
          <div className={`text-sm font-mono font-bold ${batteryColor}`}>
            {telemetry.battery.toFixed(0)}%
          </div>
          <div className="h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
            <div className={`h-full rounded-full ${telemetry.battery > 60 ? 'bg-green-500' : telemetry.battery > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${telemetry.battery}%` }} />
          </div>
        </div>

        <div className="px-2 py-1.5 rounded bg-slate-900/60 border border-slate-700/40">
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
            <Cpu className="w-2.5 h-2.5" /> CPU
          </div>
          <div className="text-sm font-mono font-bold text-sky-400">
            {telemetry.cpuLoad.toFixed(0)}%
          </div>
          <div className="h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 rounded-full transition-all"
              style={{ width: `${telemetry.cpuLoad}%` }} />
          </div>
        </div>

        <div className="px-2 py-1.5 rounded bg-slate-900/60 border border-slate-700/40">
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
            <Signal className="w-2.5 h-2.5" /> SIG
          </div>
          <div className="text-sm font-mono font-bold text-sky-400">
            {telemetry.signal.toFixed(0)}%
          </div>
          <div className="h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full"
              style={{ width: `${telemetry.signal}%` }} />
          </div>
        </div>
      </div>

      {/* Navigation Command */}
      <div className="px-3 py-2 rounded bg-slate-900/60 border border-slate-700/40">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500">NAV COMMAND</span>
          <span className={`text-sm font-mono font-bold ${commandColors[command]}`}>
            {command.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="space-y-1">
        <StatusRow
          icon={<Camera className="w-2.5 h-2.5" />}
          label="CAMERA"
          value={cameraEnabled && cameraMode === 'live' ? 'LIVE' : 'SIM'}
          active={cameraEnabled}
          activeColor="text-green-400"
        />
        <StatusRow
          icon={<ScanLine className="w-2.5 h-2.5" />}
          label="AI DETECTION"
          value={
            aiStats?.modelStatus === 'ready' ? `ACTIVE ${aiStats.fps.toFixed(0)}FPS`
              : aiStats?.modelStatus === 'loading' ? 'LOADING'
              : aiStats?.modelStatus === 'error' ? 'OFFLINE'
              : 'OFFLINE'
          }
          active={aiStats?.modelStatus === 'ready'}
          activeColor="text-green-400"
          warningColor={aiStats?.modelStatus === 'error' || aiStats?.modelStatus === 'offline' ? 'text-red-400' : undefined}
        />
        <StatusRow
          icon={<Activity className="w-2.5 h-2.5" />}
          label="PERCEPTION"
          value={missionStatus === 'NAVIGATING' || missionStatus === 'OBSTACLE_DETECTED' || missionStatus === 'REPLANNING' ? 'ACTIVE' : 'STANDBY'}
          active={missionStatus !== 'IDLE'}
          activeColor="text-green-400"
        />
        <StatusRow
          icon={<Eye className="w-2.5 h-2.5" />}
          label="LOCALIZATION"
          value={telemetry.gpsMode === 'ACTIVE' ? 'GPS MODE' : 'VISUAL MODE'}
          active={true}
          activeColor={telemetry.gpsMode === 'ACTIVE' ? 'text-green-400' : 'text-sky-400'}
        />
        <StatusRow
          icon={<Route className="w-2.5 h-2.5" />}
          label="PATH PLANNER"
          value={missionStatus === 'REPLANNING' ? 'REPLANNING' : missionStatus === 'NAVIGATING' ? 'ACTIVE' : 'IDLE'}
          active={missionStatus === 'NAVIGATING' || missionStatus === 'REPLANNING'}
          activeColor="text-sky-400"
        />
        <StatusRow
          icon={<ShieldCheck className="w-2.5 h-2.5" />}
          label="COLLISION AVOIDANCE"
          value={telemetry.collisionWarning ? 'WARNING' : 'ACTIVE'}
          active={!telemetry.collisionWarning}
          activeColor="text-green-400"
          warningColor={telemetry.collisionWarning ? 'text-red-400' : undefined}
        />
      </div>

      {/* GPS Status */}
      <div className={`px-3 py-2 rounded border flex items-center justify-between ${
        telemetry.gpsMode === 'ACTIVE'
          ? 'bg-green-950/40 border-green-700/30'
          : 'bg-red-950/40 border-red-700/30'
      }`}>
        <div className="flex items-center gap-2">
          {telemetry.gpsMode === 'ACTIVE' ? (
            <Wifi className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Activity className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          )}
          <span className="text-xs font-mono font-bold">
            {telemetry.gpsMode === 'ACTIVE' ? (
              <span className="text-green-400">GPS ACTIVE</span>
            ) : (
              <span className="text-red-400">GPS DENIED — VISUAL SLAM</span>
            )}
          </span>
        </div>
      </div>

      {/* AI Confidence Breakdown */}
      <div className="px-3 py-2 rounded bg-slate-900/60 border border-slate-700/40 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-slate-500">AI CONFIDENCE</span>
          <span className="text-xs font-mono font-bold text-sky-400">
            {(telemetry.aiConfidence * 100).toFixed(0)}%
          </span>
        </div>
        <ConfidenceBar label="Obstacle" value={telemetry.confidence.obstacle} />
        <ConfidenceBar label="Terrain" value={telemetry.confidence.terrain} />
        <ConfidenceBar label="Path" value={telemetry.confidence.path} />
        <ConfidenceBar label="Localiz." value={telemetry.confidence.localization} />
      </div>
    </div>
  );
}

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  const pct = value * 100;
  const color = pct > 80 ? 'from-green-600 to-green-400' : pct > 60 ? 'from-sky-600 to-sky-400' : 'from-amber-600 to-amber-400';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-slate-500 w-16">{label}</span>
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-mono text-slate-400 w-8 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  value,
  active,
  activeColor,
  warningColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active: boolean;
  activeColor: string;
  warningColor?: string;
}) {
  return (
    <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-900/60 border border-slate-700/40">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-[10px] font-mono tracking-wider">{label}</span>
      </div>
      <span className={`text-[10px] font-mono font-bold ${warningColor ?? (active ? activeColor : 'text-slate-600')}`}>
        {value}
      </span>
    </div>
  );
}
