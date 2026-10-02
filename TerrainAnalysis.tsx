import type { TerrainType } from '@/types';
import { SURFACE_LABELS, SURFACE_COLORS } from '@/types';
import { Layers } from 'lucide-react';

interface TerrainAnalysisProps {
  terrainAnalysis: { surface: string; confidence: number; terrainType: TerrainType }[];
}

const terrainColors: Record<TerrainType, string> = {
  safe: 'text-green-400',
  caution: 'text-amber-400',
  danger: 'text-red-400',
};

const terrainLabels: Record<TerrainType, string> = {
  safe: 'SAFE',
  caution: 'CAUTION',
  danger: 'DANGER',
};

export default function TerrainAnalysis({ terrainAnalysis }: TerrainAnalysisProps) {
  return (
    <div className="flex flex-col gap-1.5 p-2">
      <div className="flex items-center gap-1.5 px-1 pb-1">
        <Layers className="w-3 h-3 text-sky-400" />
        <span className="text-[10px] font-mono font-bold text-sky-300 tracking-wider">
          TERRAIN ANALYSIS
        </span>
        <span className="ml-auto text-[9px] font-mono text-slate-600">SIM</span>
      </div>

      {terrainAnalysis.length === 0 && (
        <div className="text-center py-3">
          <span className="text-[10px] font-mono text-slate-600">Awaiting terrain data...</span>
        </div>
      )}

      <div className="space-y-1 max-h-32 overflow-y-auto">
        {terrainAnalysis.map((item, idx) => {
          const surface = item.surface as keyof typeof SURFACE_LABELS;
          const color = SURFACE_COLORS[surface] || '#888';
          const terrainColor = terrainColors[item.terrainType];
          return (
            <div
              key={idx}
              className="flex items-center gap-2 px-2 py-1 rounded bg-slate-900/40 border border-slate-700/30 animate-fade-in"
            >
              {/* Surface color swatch */}
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: color }}
              />

              {/* Surface label */}
              <span className="text-[10px] font-mono font-bold text-slate-300 flex-1">
                {SURFACE_LABELS[surface] || item.surface}
              </span>

              {/* Terrain classification */}
              <span className={`text-[9px] font-mono font-bold ${terrainColor}`}>
                {terrainLabels[item.terrainType]}
              </span>

              {/* Confidence */}
              <div className="flex items-center gap-1 w-14">
                <div className="flex-1 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.confidence * 100}%`, background: color }}
                  />
                </div>
                <span className="text-[8px] font-mono text-slate-500 w-6 text-right">
                  {(item.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
