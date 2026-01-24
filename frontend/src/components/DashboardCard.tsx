
import React from 'react';
import { Event, TimeEntry, QualifyingStandard } from '../types';
import { formatTime } from '../utils/time';
import { Trophy, TrendingUp, ChevronRight, Award, Star, CheckCircle2 } from 'lucide-react';

interface Props {
  event: Event;
  bestTime: TimeEntry | undefined;
  standards: QualifyingStandard[];
  onClick: () => void;
}

const DashboardCard: React.FC<Props> = ({ event, bestTime, standards, onClick }) => {
  const regionalCut = standards.find(s => s.region === 'Regional');
  const stateCut = standards.find(s => s.region === 'State');

  // Qualification checks - swimmer qualifies if their best time is <= cut time
  const qualifiedRegional = bestTime && regionalCut && bestTime.timeSeconds <= regionalCut.cutTimeSeconds;
  const qualifiedState = bestTime && stateCut && bestTime.timeSeconds <= stateCut.cutTimeSeconds;

  const getGap = (target: number) => {
    if (!bestTime) return null;
    return bestTime.timeSeconds - target;
  };

  const regionalGap = regionalCut ? getGap(regionalCut.cutTimeSeconds) : null;
  const stateGap = stateCut ? getGap(stateCut.cutTimeSeconds) : null;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-blue-200 transition-all cursor-pointer active:scale-[0.98]"
      data-testid={`event-card-${event.id}`}
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

      {/* Best Time Display */}
      <div className="bg-slate-50 rounded-lg p-3 mb-3">
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Best Time</p>
        <p className="text-2xl font-black text-slate-900" data-testid={`best-time-${event.id}`}>
          {bestTime ? formatTime(bestTime.timeSeconds) : '--.--'}
        </p>
      </div>

      {/* Qualification Status Badges */}
      {bestTime && (regionalCut || stateCut) && (
        <div className="flex flex-wrap gap-2 mb-3" data-testid={`qualification-status-${event.id}`}>
          {qualifiedState ? (
            <div className="flex items-center space-x-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              <Trophy className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase">State Qualified!</span>
            </div>
          ) : qualifiedRegional ? (
            <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase">Regional Qualified!</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
              <Star className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase">
                {regionalGap !== null ? `${regionalGap.toFixed(2)}s to Regional` : 'No cuts set'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Cut Times with Qualification Indicators */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        {regionalCut && (
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center space-x-2">
              {qualifiedRegional && <CheckCircle2 className="w-3 h-3 text-green-600" />}
              <span className={`font-medium ${qualifiedRegional ? 'text-green-600' : 'text-slate-500'}`}>
                Regional Cut:
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-bold ${qualifiedRegional ? 'text-green-600' : 'text-slate-800'}`}>
                {formatTime(regionalCut.cutTimeSeconds)}
              </span>
              {bestTime && !qualifiedRegional && regionalGap !== null && (
                <span className="text-[10px] text-blue-500 font-bold">+{regionalGap.toFixed(2)}s</span>
              )}
            </div>
          </div>
        )}
        {stateCut && (
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center space-x-2">
              {qualifiedState && <Trophy className="w-3 h-3 text-amber-600" />}
              <span className={`font-medium ${qualifiedState ? 'text-amber-600' : 'text-slate-500'}`}>
                State Cut:
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-bold ${qualifiedState ? 'text-amber-600' : 'text-slate-800'}`}>
                {formatTime(stateCut.cutTimeSeconds)}
              </span>
              {bestTime && !qualifiedState && stateGap !== null && (
                <span className="text-[10px] text-slate-400 font-bold">+{stateGap.toFixed(2)}s</span>
              )}
            </div>
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
