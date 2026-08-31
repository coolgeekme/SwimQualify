import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { Athlete, Event, TimeEntry, QualifyingStandard } from '../types';
import { formatTime } from '../utils/time';

interface Props {
  athlete: Athlete;
  times: TimeEntry[];
  events: Event[];
  standards: QualifyingStandard[];
}

const COLORS = [
  '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899',
  '#14b8a6', '#f97316', '#3b82f6', '#84cc16', '#eab308', '#06b6d4',
  '#8b5cf6', '#f43f5e', '#10b981', '#6366f1', '#d946ef', '#e11d48',
  '#0d9488', '#ca8a04', '#64748b', '#fb7185',
];

const COURSES = ['SCY', 'LCM', 'SCM'] as const;

const shortDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const tickDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });

const ProgressChart: React.FC<Props> = ({ athlete, times, events, standards }) => {
  const athleteTimes = useMemo(
    () => times.filter((t) => t.athleteId === athlete.id && !t.isDQ),
    [times, athlete.id]
  );

  const availableCourses = useMemo(
    () => COURSES.filter((c) => athleteTimes.some((t) => events.find((e) => e.id === t.eventId)?.course === c)),
    [athleteTimes, events]
  );

  const [course, setCourse] = useState<string>(availableCourses[0] ?? 'SCY');
  const [focusKey, setFocusKey] = useState<string | null>(null); // event name when single-event view

  // Build one series per event name (within the selected course).
  const series = useMemo(() => {
    const map = new Map<string, { key: string; event: Event; points: { date: string; secs: number }[]; color: string }>();
    for (const t of athleteTimes) {
      const ev = events.find((e) => e.id === t.eventId);
      if (!ev || ev.course !== course) continue;
      let s = map.get(ev.name);
      if (!s) {
        s = { key: ev.name, event: ev, points: [], color: '' };
        map.set(ev.name, s);
      }
      s.points.push({ date: t.date, secs: t.timeSeconds });
    }
    const arr = Array.from(map.values());
    arr.forEach((s, i) => {
      s.color = COLORS[i % COLORS.length];
      s.points.sort((a, b) => a.date.localeCompare(b.date));
    });
    return arr;
  }, [athleteTimes, events, course]);

  // Merge all points onto a shared numeric time axis. Same-day duplicates for a
  // single event get a 1s offset so prelims/finals stay distinct points.
  const merged = useMemo(() => {
    const rowsByT = new Map<number, Record<string, any>>();
    series.forEach((s) => {
      const seen = new Map<string, number>();
      s.points.forEach((p) => {
        const c = seen.get(p.date) ?? 0;
        seen.set(p.date, c + 1);
        const t = new Date(p.date + 'T00:00:00').getTime() + c * 1000;
        let row = rowsByT.get(t);
        if (!row) {
          row = { t, label: shortDate(p.date) };
          rowsByT.set(t, row);
        }
        row[s.key] = p.secs;
      });
    });
    return Array.from(rowsByT.values()).sort((a, b) => a.t - b.t);
  }, [series]);

  const focusedSeries = focusKey ? series.find((s) => s.key === focusKey) : null;

  // Cut lines for the focused event (regional = amber, state = green).
  const focusedCuts = useMemo(() => {
    if (!focusedSeries) return { regional: undefined as number | undefined, state: undefined as number | undefined };
    const ev = focusedSeries.event;
    let matched = standards.filter(
      (s) => s.eventId === ev.id && s.gender === athlete.gender && s.ageGroup === ev.ageGroup
    );
    if (matched.length === 0) {
      matched = standards.filter((s) => {
        const se = events.find((e) => e.id === s.eventId);
        return se && se.name === ev.name && se.course === ev.course && s.gender === athlete.gender && s.ageGroup === ev.ageGroup;
      });
    }
    return {
      regional: matched.find((s) => s.region === 'Regional')?.cutTimeSeconds,
      state: matched.find((s) => s.region === 'State')?.cutTimeSeconds,
    };
  }, [focusedSeries, standards, events, athlete.gender]);

  if (athleteTimes.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500">No times recorded yet for {athlete.name.split(' ')[0]}.</p>
      </div>
    );
  }

  const tooltipStyle = {
    background: '#1e293b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
  };

  const focusedData = focusedSeries
    ? focusedSeries.points.map((p) => ({ t: new Date(p.date + 'T00:00:00').getTime(), time: p.secs, label: shortDate(p.date) }))
    : [];

  return (
    <div className="space-y-4">
      {/* Course toggle */}
      {availableCourses.length > 1 && (
        <div className="flex items-center space-x-2">
          {availableCourses.map((c) => (
            <button
              key={c}
              onClick={() => { setCourse(c); setFocusKey(null); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all btn-press border ${
                course === c
                  ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/30'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="glass-card rounded-2xl p-4">
        {!focusedSeries ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={merged} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={tickDate}
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => formatTime(v)}
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={46}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  formatter={(v: number, name: string) => [formatTime(v), name]}
                />
                {series.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: s.color }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                    onClick={() => setFocusKey(s.key)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <div>
                <h4 className="font-display text-lg font-bold text-white uppercase leading-tight">
                  {focusedSeries.key} <span className="text-sky-400">· {course}</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-bold">
                  Best {formatTime(Math.min(...focusedSeries.points.map((p) => p.secs)))}
                </p>
              </div>
              <button
                onClick={() => setFocusKey(null)}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                ← All events
              </button>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={focusedData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={tickDate}
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatTime(v)}
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    formatter={(v: number) => [formatTime(v), 'Result']}
                  />
                  {focusedCuts.regional !== undefined && (
                    <ReferenceLine y={focusedCuts.regional} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1.5}
                      label={{ value: `Regional ${formatTime(focusedCuts.regional)}`, fill: '#f59e0b', fontSize: 9, position: 'insideBottomRight' }} />
                  )}
                  {focusedCuts.state !== undefined && (
                    <ReferenceLine y={focusedCuts.state} stroke="#22c55e" strokeDasharray="5 5" strokeWidth={1.5}
                      label={{ value: `State ${formatTime(focusedCuts.state)}`, fill: '#22c55e', fontSize: 9, position: 'insideBottomRight' }} />
                  )}
                  <Line
                    type="monotone"
                    dataKey="time"
                    stroke={focusedSeries.color}
                    strokeWidth={3}
                    dot={{ r: 5, fill: focusedSeries.color }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Event chips (tap to focus) */}
      <div className="flex flex-wrap gap-2">
        {series.map((s) => {
          const best = Math.min(...s.points.map((p) => p.secs));
          const active = focusKey === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setFocusKey(active ? null : s.key)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all btn-press border ${
                active
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/15'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span>{s.key}</span>
              <span className="text-slate-500">{formatTime(best)}</span>
            </button>
          );
        })}
      </div>

      {!focusKey && series.length > 1 && (
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> tap an event to see its Regional / State cut lines
        </p>
      )}
    </div>
  );
};

export default ProgressChart;
