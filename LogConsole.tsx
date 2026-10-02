import { useEffect, useRef } from 'react';
import type { LogEntry } from '@/types';
import { Terminal } from 'lucide-react';

interface LogConsoleProps {
  logs: LogEntry[];
}

const levelColors: Record<string, string> = {
  INFO: 'text-sky-400',
  WARN: 'text-amber-400',
  ERROR: 'text-red-400',
  SUCCESS: 'text-green-400',
};

const levelBg: Record<string, string> = {
  INFO: 'bg-sky-950/30',
  WARN: 'bg-amber-950/30',
  ERROR: 'bg-red-950/30',
  SUCCESS: 'bg-green-950/30',
};

export default function LogConsole({ logs }: LogConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-sky-500/10">
        <Terminal className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-xs font-mono font-bold text-sky-300 tracking-wider">
          SYSTEM LOG
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-mono text-slate-500">{logs.length} entries</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-[11px]">
        {logs.length === 0 && (
          <div className="text-slate-600 text-center py-4">Awaiting commands...</div>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className={`px-2 py-0.5 rounded ${levelBg[log.level]} flex items-start gap-2 animate-fade-in`}
          >
            <span className="text-slate-600 flex-shrink-0">{log.time}</span>
            <span className={`flex-shrink-0 font-bold ${levelColors[log.level]}`}>
              [{log.level}]
            </span>
            <span className="text-slate-500 flex-shrink-0">{log.source}</span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
