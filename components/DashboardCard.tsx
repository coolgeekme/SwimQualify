
import React from 'react';
import { Event, TimeEntry, QualifyingStandard } from '../types';
import { formatTime } from '../utils/time';
import { Trophy, TrendingUp, ChevronRight } from 'lucide-react';

interface Props {
  event: Event;
  bestTime: TimeEntry | undefined;
  standards: QualifyingStandard[];
  onClick: () => void;
}

const DashboardCard: React.FC<Props> = ({ event, bestTime, standards, onClick }) => {
  const regionalCut = standards.find(s => s.region === 'Regional');
  const stateCut = standards.find(s => s.region === 'State');

  const getGap = (target: number) => {
    if (!bestTime) return null;
    return bestTime.timeSeconds - target;
  };

  const getProgressColor = (gap: number | null) => {
    if (gap === null) return 'text-slate-400';
    if (gap <= 0) return 'text-green-600';
    if (gap < 2) return 'text-amber-600';
    return 'text-blue-600';
  };

  const regionalGap = regionalCut ? getGap(regionalCut.cutTimeSeconds) : null;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-blue-200 transition-all cursor-pointer active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">{event.name}</h3>
          <div className="flex items-center space-x-2">
            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{event.stroke}</p>
            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
            <p className="text-[10px] font-black text-blue-500 uppercase">{event.course}</p>
          </div>
        </div>
        <div className="bg-blue-50 p-2 rounded-lg">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Season Best</p>
          <p className="text-xl font-black text-slate-900">
            {bestTime ? formatTime(bestTime.timeSeconds) : '--.--'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Gap to Reg.</p>
          <p className={`text-xl font-black ${getProgressColor(regionalGap)}`}>
            {regionalGap !== null ? (regionalGap <= 0 ? 'CUT!' : `+${regionalGap.toFixed(2)}s`) : 'N/A'}
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-50">
        {regionalCut && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Regional Cut:</span>
            <span className="text-slate-800 font-bold">{formatTime(regionalCut.cutTimeSeconds)}</span>
          </div>
        )}
        {stateCut && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">State Cut:</span>
            <span className="text-slate-800 font-bold">{formatTime(stateCut.cutTimeSeconds)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center text-blue-600 text-xs font-bold justify-end group">
        Details <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default DashboardCard;
