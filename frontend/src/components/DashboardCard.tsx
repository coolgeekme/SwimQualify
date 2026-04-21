import React, { useState } from 'react';
import { Event, TimeEntry, QualifyingStandard } from '../types';
import { formatTime, parseTime } from '../utils/time';
import { getAchievementLevel, getLevelColor, getNextLevel, getEventStandards, formatTimeFromSeconds } from '../utils/motivationalTimes';
import { Trophy, TrendingUp, ChevronRight, Star, CheckCircle2, Zap, Edit3, X, Save } from 'lucide-react';

interface Props {
  event: Event;
  bestTime: TimeEntry | undefined;
  standards: QualifyingStandard[];
  athleteGender: 'M' | 'F';
  onClick: () => void;
  onEditStandard?: (standardId: string, newTime: number) => void;
  onCreateStandard?: (region: 'Regional' | 'State', cutTimeSeconds: number) => void;
  verification?: { overallScore: string; confidence: string; regionalScore: string; stateScore: string; sources: any[] } | null;
}

const DashboardCard: React.FC<Props> = ({ event, bestTime, standards, athleteGender, onClick, onEditStandard, onCreateStandard, verification }) => {
  const [editingCut, setEditingCut] = useState<string | null>(null); // 'regional' | 'state' | null
  const [editValue, setEditValue] = useState('');

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

  const handleStartEdit = (type: 'regional' | 'state', e: React.MouseEvent) => {
    e.stopPropagation();
    const cut = type === 'regional' ? regionalCut : stateCut;
    setEditValue(cut ? formatTime(cut.cutTimeSeconds) : '');
    setEditingCut(type);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const parsed = parseTime(editValue);
    if (!parsed || parsed <= 0) {
      setEditingCut(null);
      return;
    }
    
    const region = editingCut === 'regional' ? 'Regional' : 'State';
    const existingCut = editingCut === 'regional' ? regionalCut : stateCut;
    
    if (existingCut && onEditStandard) {
      onEditStandard(existingCut.id, parsed);
    } else if (!existingCut && onCreateStandard) {
      onCreateStandard(region as 'Regional' | 'State', parsed);
    }
    
    setEditingCut(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCut(null);
  };

  const renderCutLine = (label: string, type: 'regional' | 'state', cut: QualifyingStandard | undefined, qualified: boolean, gap: number | null) => {
    const isEditing = editingCut === type;
    
    return (
      <div className="flex justify-between items-center text-xs" data-testid={`${type}-cut-row-${event.id}`}>
        <div className="flex items-center space-x-2">
          {qualified && (type === 'state' ? <Trophy className="w-3 h-3 text-amber-400" /> : <CheckCircle2 className="w-3 h-3 text-green-400" />)}
          <span className={`font-medium ${qualified ? (type === 'state' ? 'text-amber-400' : 'text-green-400') : 'text-slate-500'}`}>
            {label}:
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
              <input
                data-testid={`edit-cut-input-${type}-${event.id}`}
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(e as any); if (e.key === 'Escape') handleCancelEdit(e as any); }}
                className="w-20 bg-slate-800 border border-sky-500/50 rounded px-1.5 py-0.5 text-xs font-mono text-white outline-none"
                placeholder="mm:ss.xx"
                autoFocus
              />
              <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300 p-0.5"><Save className="w-3 h-3" /></button>
              <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300 p-0.5"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <div 
              className="flex items-center space-x-1 group/edit cursor-pointer"
              onClick={e => handleStartEdit(type, e)}
              data-testid={`edit-cut-btn-${type}-${event.id}`}
            >
              <span className={`font-display font-bold ${qualified ? (type === 'state' ? 'text-amber-400' : 'text-green-400') : 'text-white'} group-hover/edit:text-sky-400 transition-colors`}>
                {cut ? formatTime(cut.cutTimeSeconds) : '--:--'}
              </span>
              {bestTime && !qualified && gap !== null && cut && (
                <span className="text-[10px] text-sky-400 font-bold">+{gap.toFixed(2)}s</span>
              )}
              <Edit3 className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      </div>
    );
  };

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

      {/* Cut Times - Editable */}
      <div className="space-y-2 pt-3 border-t border-white/5">
        {renderCutLine('Regional Cut', 'regional', regionalCut, !!qualifiedRegional, regionalGap)}
        {renderCutLine('State Cut', 'state', stateCut, !!qualifiedState, stateGap)}
        {/* Verification Badge */}
        {verification && (
          <div data-testid={`verification-badge-${event.id}`} className={`flex items-center justify-between mt-2 px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase ${
            verification.confidence === 'high' ? 'bg-green-500/10 text-green-400' :
            verification.confidence === 'medium' ? 'bg-amber-500/10 text-amber-400' :
            'bg-red-500/10 text-red-400'
          }`}>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified: {verification.overallScore}</span>
            </div>
            <div className="flex items-center space-x-2 text-[8px]">
              <span>Reg: {verification.regionalScore}</span>
              <span>State: {verification.stateScore}</span>
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
