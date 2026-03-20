import React from 'react';
import { Event, TimeEntry, QualifyingStandard } from '../types';
import { formatTime } from '../utils/time';
import { getAchievementLevel, getLevelColor, getNextLevel } from '../utils/motivationalTimes';
import { Trophy, TrendingUp, ChevronRight, Star, CheckCircle2, Zap } from 'lucide-react';

interface Props {
  event: Event;
  bestTime: TimeEntry | undefined;
  standards: QualifyingStandard[];
  athleteGender: 'M' | 'F';
  onClick: () => void;
}

const DashboardCard: React.FC<Props> = ({ event, bestTime, standards, athleteGender, onClick }) => {
  const regionalCut = standards.find(s => s.region === 'Regional');
  const stateCut = standards.find(s => s.region === 'State');

  const qualifiedRegional = bestTime && regionalCut && bestTime.timeSeconds <= regionalCut.cutTimeSeconds;
  const qualifiedState = bestTime && stateCut && bestTime.timeSeconds <= stateCut.cutTimeSeconds;

  const getGap = (target: number) => {
    if (!bestTime) return null;
    return bestTime.timeSeconds - target;
  };

  const regionalGap = regionalCut ? getGap(regionalCut.cutTimeSeconds) : null;
  const stateGap = stateCut ? getGap(stateCut.cutTimeSeconds) : null;

  const achievementLevel = bestTime 
    ? getAchievementLevel(bestTime.timeSeconds, event.name, event.ageGroup, athleteGender, event.course)
    : null;
  
  const nextLevelInfo = bestTime 
    ? getNextLevel(bestTime.timeSeconds, event.name, event.ageGroup, athleteGender, event.course)
    : null;

  // Level colors for dark theme
  const getLevelStyles = (level: string | null) => {
    switch (level) {
      case 'AAAA': return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' };
      case 'AAA': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
      case 'AA': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
      case 'A': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
      case 'BB': return { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' };
      case 'B': return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
      default: return { bg: 'bg-slate-800/50', text: 'text-slate-500', border: 'border-slate-700/30' };
    }
  };

  const levelStyles = getLevelStyles(achievementLevel);

  return (
    <div 
      onClick={onClick}
      className="glass-card rounded-2xl p-4 cursor-pointer group animate-slide-up"
      data-testid={`event-card-${event.id}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            {event.stroke}
          </p>
          <h3 className="font-display text-xl font-bold text-white uppercase tracking-tight">
            {event.name}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-1 rounded">
            {event.course}
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
            <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-sky-400" />
          </div>
        </div>
      </div>

      {/* Time Display */}
      <div className="bg-slate-900/60 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Best Time
            </p>
            <p className="font-display text-4xl font-black text-white time-display" data-testid={`best-time-${event.id}`}>
              {bestTime ? formatTime(bestTime.timeSeconds) : '--.--'}
            </p>
          </div>
          
          {/* Motivational Standard Badge */}
          {achievementLevel && (
            <div 
              className={`${levelStyles.bg} ${levelStyles.border} border px-4 py-2 rounded-xl text-center badge-shine`}
              data-testid={`motivational-level-${event.id}`}
            >
              <p className={`font-display text-2xl font-black ${levelStyles.text}`}>
                {achievementLevel}
              </p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                USA Time
              </p>
            </div>
          )}
        </div>
        
        {/* Next Level Target */}
        {nextLevelInfo && bestTime && (
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center space-x-2">
            <Zap className="w-3 h-3 text-amber-400" />
            <p className="text-xs text-slate-400">
              <span className="font-display font-bold text-white">{formatTime(nextLevelInfo.timeNeeded)}</span>
              {' '}for{' '}
              <span className="font-display font-bold text-amber-400">{nextLevelInfo.level}</span>
            </p>
          </div>
        )}
      </div>

      {/* Qualification Status */}
      {bestTime && (regionalCut || stateCut) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {qualifiedState ? (
            <div className="flex items-center space-x-1.5 bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full">
              <Trophy className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">State Qualified!</span>
            </div>
          ) : qualifiedRegional ? (
            <div className="flex items-center space-x-1.5 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Regional Qualified!</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-sky-500/10 text-sky-400 px-3 py-1.5 rounded-full">
              <Star className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {regionalGap !== null ? `${regionalGap.toFixed(2)}s to Regional` : 'No cuts set'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Cut Times */}
      <div className="space-y-2 pt-3 border-t border-white/5">
        {regionalCut && (
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center space-x-2">
              {qualifiedRegional && <CheckCircle2 className="w-3 h-3 text-green-400" />}
              <span className={`font-medium ${qualifiedRegional ? 'text-green-400' : 'text-slate-500'}`}>
                Regional Cut:
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-display font-bold ${qualifiedRegional ? 'text-green-400' : 'text-white'}`}>
                {formatTime(regionalCut.cutTimeSeconds)}
              </span>
              {bestTime && !qualifiedRegional && regionalGap !== null && (
                <span className="text-[10px] text-sky-400 font-bold">+{regionalGap.toFixed(2)}s</span>
              )}
            </div>
          </div>
        )}
        {stateCut && (
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center space-x-2">
              {qualifiedState && <Trophy className="w-3 h-3 text-amber-400" />}
              <span className={`font-medium ${qualifiedState ? 'text-amber-400' : 'text-slate-500'}`}>
                State Cut:
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-display font-bold ${qualifiedState ? 'text-amber-400' : 'text-white'}`}>
                {formatTime(stateCut.cutTimeSeconds)}
              </span>
              {bestTime && !qualifiedState && stateGap !== null && (
                <span className="text-[10px] text-slate-500 font-bold">+{stateGap.toFixed(2)}s</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Details Link */}
      <div className="mt-4 flex items-center text-sky-400 text-xs font-bold justify-end group-hover:text-sky-300 transition-colors">
        <span className="uppercase tracking-wider">Details</span>
        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default DashboardCard;
