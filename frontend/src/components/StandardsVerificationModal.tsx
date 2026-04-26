import React, { useState } from 'react';
import { X, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import { 
  getEventStandards, 
  getAvailableEvents, 
  getSupportedAgeGroups, 
  getSupportedCourses,
  formatTimeFromSeconds,
  getLevelColor,
  getLevelDescription
} from '../utils/motivationalTimes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialAgeGroup?: string;
  initialGender?: 'M' | 'F';
  initialCourse?: string;
}

const StandardsVerificationModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  initialAgeGroup = '11-12',
  initialGender = 'M',
  initialCourse = 'SCY'
}) => {
  const [selectedCourse, setSelectedCourse] = useState(initialCourse);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(initialAgeGroup);
  const [selectedGender, setSelectedGender] = useState<'M' | 'F'>(initialGender);

  if (!isOpen) return null;

  const courses = getSupportedCourses();
  const ageGroups = getSupportedAgeGroups(selectedCourse);
  const events = getAvailableEvents(selectedAgeGroup, selectedGender, selectedCourse);

  const levels: Array<'B' | 'BB' | 'A' | 'AA' | 'AAA' | 'AAAA'> = ['B', 'BB', 'A', 'AA', 'AAA', 'AAAA'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="glass-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-start">
          <div>
            <h2 className="font-display text-2xl font-bold text-white uppercase">
              USA Swimming Time Standards
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Official 2024-2028 Motivational Time Standards
            </p>
            <div className="flex gap-2 mt-2">
              <a href="https://www.usaswimming.org/times/time-standards" target="_blank" rel="noopener noreferrer"
                 className="flex items-center space-x-1 text-[9px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded transition-colors">
                <ExternalLink className="w-3 h-3" /><span>USA Swimming Official</span>
              </a>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-white/5 bg-slate-900/40">
          <div className="flex flex-wrap gap-3">
            {/* Course Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-widest">
                Course
              </label>
              <div className="flex gap-1">
                {courses.map(course => (
                  <button
                    key={course}
                    onClick={() => setSelectedCourse(course)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      selectedCourse === course
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {course}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-widest">
                Age Group
              </label>
              <div className="flex gap-1 flex-wrap">
                {ageGroups.map(ag => (
                  <button
                    key={ag}
                    onClick={() => setSelectedAgeGroup(ag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      selectedAgeGroup === ag
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {ag}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-widest">
                Gender
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedGender('M')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    selectedGender === 'M'
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Boys
                </button>
                <button
                  onClick={() => setSelectedGender('F')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    selectedGender === 'F'
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Girls
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-b border-white/5 bg-slate-900/20">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Levels:</span>
            {levels.map(level => {
              const colors = getLevelColor(level);
              const desc = getLevelDescription(level);
              return (
                <div 
                  key={level} 
                  className={`${colors.bg} ${colors.border} border px-2 py-1 rounded flex items-center space-x-1.5`}
                  title={desc}
                >
                  <span className={`text-xs font-bold ${colors.text}`}>{level}</span>
                  <span className="text-[9px] text-slate-500">{desc.replace(' nationally', '')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Standards Table */}
        <div className="flex-1 overflow-auto p-4">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No standards available for this selection</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Event
                    </th>
                    {levels.map(level => {
                      const colors = getLevelColor(level);
                      return (
                        <th 
                          key={level} 
                          className={`text-center py-3 px-2 text-[10px] font-bold uppercase tracking-widest ${colors.text}`}
                        >
                          {level}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, idx) => {
                    const standards = getEventStandards(event, selectedAgeGroup, selectedGender, selectedCourse);
                    if (!standards) return null;
                    
                    return (
                      <tr 
                        key={event} 
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          idx % 2 === 0 ? 'bg-slate-900/20' : ''
                        }`}
                      >
                        <td className="py-3 px-2 font-display font-bold text-white text-sm">
                          {event}
                        </td>
                        {levels.map(level => {
                          const time = standards[level];
                          const colors = getLevelColor(level);
                          return (
                            <td 
                              key={level} 
                              className={`text-center py-3 px-2 font-mono text-sm ${colors.text}`}
                            >
                              {formatTimeFromSeconds(time)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-500 text-xs">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Verified against official USA Swimming standards</span>
            </div>
            <a 
              href="https://www.usaswimming.org/times/time-standards"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-sky-400 text-xs font-bold hover:text-sky-300 transition-colors"
            >
              <span>View Official Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardsVerificationModal;
