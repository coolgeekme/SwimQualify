
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, ChevronLeft, ChevronRight, History, Target, AlertCircle, LogIn, 
  UserPlus, Layers, Mail, Lock, Search, Sparkles, ExternalLink, RefreshCw, 
  CheckCircle2, MapPin, Key, Upload, Camera, Trophy, Home, Users, Settings, LogOut,
  Zap, Brain, Calendar, ShieldCheck, User as UserIcon, Heart, Trash2, Edit3, FileText, X, Filter, Ruler, Info, Save, CheckSquare, Square, Baby, Lightbulb, Activity, Clock, Award
} from 'lucide-react';
import Layout from './components/Layout';
import DashboardCard from './components/DashboardCard';
import { EVENTS, MOCK_STANDARDS, MOCK_TIMES, MOCK_ATHLETES, MOCK_USERS } from './constants';
import { formatTime, calculatePace, parseTime, getAgeGroup, getAgeGroupAtDate } from './utils/time';
import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { User, Role, Athlete, TimeEntry, Event, Stroke, QualifyingStandard, WeeklyCheckIn, Course } from './types';

type Screen = 'dashboard' | 'event-detail' | 'roster' | 'focus' | 'admin' | 'add-time' | 'add-athlete' | 'add-event' | 'login' | 'register' | 'manage-swimmer-events';

interface ResearchResult {
  name: string;
  regionalTimeStr?: string;
  stateTimeStr?: string;
  ageGroup?: string;
  gender?: string;
  course?: Course;
  distance?: number;
  stroke?: Stroke;
}

const STORAGE_KEYS = {
  AUTH: 'sq_prod_session_v3'
};

const getSessionHeaders = (user: User | null) => ({
  'Content-Type': 'application/json',
  ...(user ? { 'X-User-Session': JSON.stringify(user) } : {})
});

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [times, setTimes] = useState<TimeEntry[]>([]);
  const [standards, setStandards] = useState<QualifyingStandard[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);

  useEffect(() => { 
    if (currentUser) localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(currentUser));
    else localStorage.removeItem(STORAGE_KEYS.AUTH);
  }, [currentUser]);

  useEffect(() => {
    const loadAllData = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        await fetch('/api/seed', { method: 'POST' });

        const [eventsRes, standardsRes, athletesRes, timesRes, usersRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/standards'),
          fetch('/api/athletes', { headers: getSessionHeaders(currentUser) }),
          fetch('/api/times', { headers: getSessionHeaders(currentUser) }),
          fetch('/api/auth/users')
        ]);

        if (eventsRes.ok) {
          const dbEvents = await eventsRes.json();
          setEvents(dbEvents.length > 0 ? dbEvents : EVENTS);
        } else {
          setEvents(EVENTS);
        }

        if (standardsRes.ok) {
          const dbStandards = await standardsRes.json();
          setStandards(dbStandards.length > 0 ? dbStandards : MOCK_STANDARDS);
        } else {
          setStandards(MOCK_STANDARDS);
        }

        if (athletesRes.ok) {
          const dbAthletes = await athletesRes.json();
          setAthletes(dbAthletes.length > 0 ? dbAthletes : MOCK_ATHLETES);
        } else {
          setAthletes(MOCK_ATHLETES);
        }

        if (timesRes.ok) {
          const dbTimes = await timesRes.json();
          setTimes(dbTimes.length > 0 ? dbTimes : MOCK_TIMES);
        } else {
          setTimes(MOCK_TIMES);
        }

        if (usersRes.ok) {
          const dbUsers = await usersRes.json();
          const mergedUsers = [...MOCK_USERS];
          for (const dbUser of dbUsers) {
            if (!mergedUsers.some(u => u.email?.toLowerCase() === dbUser.email?.toLowerCase())) {
              mergedUsers.push({
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                role: dbUser.role as Role,
                teamId: dbUser.teamId
              });
            }
          }
          setUsers(mergedUsers);
        }

        setDataInitialized(true);
      } catch (err) {
        console.error('Failed to load data:', err);
        setEvents(EVENTS);
        setStandards(MOCK_STANDARDS);
        setAthletes(MOCK_ATHLETES);
        setTimes(MOCK_TIMES);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllData();
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentScreen, setCurrentScreen] = useState<Screen>(currentUser ? 'dashboard' : 'login');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  
  // Management State
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);
  const [adminMode, setAdminMode] = useState<'search' | 'scan' | 'events' | 'explorer'>('explorer');
  const [explorerFilter, setExplorerFilter] = useState<{ ageGroup: string; gender: 'M' | 'F'; course: Course }>({ ageGroup: '11-12', gender: 'M', course: Course.YARDS });

  // AI Insights State
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [strokeInsights, setStrokeInsights] = useState<{[key: string]: string}>({});

  // AI Research & Scan State
  const [isResearching, setIsResearching] = useState(false);
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
  const [groundingLinks, setGroundingLinks] = useState<{title: string, uri: string}[]>([]);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadMimeType, setUploadMimeType] = useState<string>('image/png');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentScreen(tab as Screen);
    if (tab !== 'admin') {
      setResearchResults([]);
      setGroundingLinks([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadMimeType(file.type);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const visibleAthletes = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === Role.ADMIN || currentUser.role === Role.COACH) return athletes;
    if (currentUser.role === Role.PARENT) return athletes.filter(a => a.parentId === currentUser.id);
    if (currentUser.role === Role.SWIMMER) return athletes.filter(a => a.userId === currentUser.id);
    return [];
  }, [currentUser, athletes]);

  const currentAthlete = useMemo(() => {
    if (!currentUser) return null;
    if (selectedAthleteId) {
      const athlete = visibleAthletes.find(a => a.id === selectedAthleteId);
      if (athlete) return athlete;
    }
    return visibleAthletes[0] || null;
  }, [visibleAthletes, selectedAthleteId, currentUser]);

  const getBestTime = (eventId: string, athleteId: string) => {
    const eventTimes = times.filter(t => t.eventId === eventId && t.athleteId === athleteId);
    if (eventTimes.length === 0) return undefined;
    return eventTimes.reduce((prev, curr) => (prev.timeSeconds < curr.timeSeconds ? prev : curr));
  };

  const handleToggleEventSelection = async (eventId: string) => {
    if (!currentAthlete || !currentUser) return;
    const isSelected = currentAthlete.selectedEventIds.includes(eventId);
    const newSelected = isSelected 
      ? currentAthlete.selectedEventIds.filter(id => id !== eventId)
      : [...currentAthlete.selectedEventIds, eventId];

    setAthletes(prev => prev.map(a => a.id === currentAthlete.id ? { ...a, selectedEventIds: newSelected } : a));
    
    try {
      await fetch(`/api/athletes/${currentAthlete.id}`, {
        method: 'PUT',
        headers: getSessionHeaders(currentUser),
        body: JSON.stringify({ ...currentAthlete, selectedEventIds: newSelected })
      });
    } catch (err) {
      console.error('Failed to update athlete events:', err);
    }
  };

  const handleGenerateStrokeInsights = async () => {
    if (!currentAthlete) return;
    setIsGeneratingInsights(true);
    try {
      const athleteTimes = times.filter(t => t.athleteId === currentAthlete.id);
      const timeData = athleteTimes.map(t => {
        const ev = events.find(e => e.id === t.eventId);
        return {
          stroke: ev?.stroke,
          distance: ev?.distance,
          time: formatTime(t.timeSeconds),
          date: t.date,
          ageGroup: t.ageGroupAtTime
        };
      });

      const response = await fetch('/api/ai/stroke-insights', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Session': JSON.stringify(currentUser)
        },
        body: JSON.stringify({
          athleteName: currentAthlete.name,
          ageGroup: currentAthlete.ageGroup,
          gender: currentAthlete.gender,
          timeData
        })
      });

      if (!response.ok) throw new Error('Failed to generate insights');
      
      const data = await response.json();
      if (data.insights) {
        setStrokeInsights(data.insights);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate stroke insights.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!uploadPreview) return;
    setIsResearching(true);
    setResearchResults([]);
    setGroundingLinks([]);
    try {
      const base64Data = uploadPreview.split(',')[1];
      
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Session': JSON.stringify(currentUser)
        },
        body: JSON.stringify({
          imageData: base64Data,
          mimeType: uploadMimeType || 'image/png'
        })
      });

      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setResearchResults(data.results);
      } else {
        alert(data.error || "No standards found in document. Please ensure the text is clear.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Analysis failed. Try a clearer document or photo.");
    } finally {
      setIsResearching(false);
    }
  };

  const handleResearchStandards = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsResearching(true);
    setResearchResults([]);
    setGroundingLinks([]);
    try {
      const response = await fetch('/api/ai/research-standards', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Session': JSON.stringify(currentUser)
        },
        body: JSON.stringify({
          ageGroup: formData.get('ageGroup'),
          gender: formData.get('gender'),
          stateLocation: formData.get('stateLocation'),
          course: formData.get('course')
        })
      });

      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setResearchResults(data.results);
      } else {
        alert(data.error || "Could not extract specific times. Please check sources or try a different location.");
      }

      if (data.citations && data.citations.length > 0) {
        setGroundingLinks(data.citations);
      }
    } catch (err: any) {
      console.error(err);
      alert("Search failed. Please try again.");
    } finally {
      setIsResearching(false);
    }
  };

  const syncSingleResult = async (res: ResearchResult) => {
    if (!res.name || !currentUser) return;

    const normalizeCourse = (c: any): Course => {
      if (c === Course.YARDS || c === Course.METERS) return c;
      if (typeof c === 'string') {
        const lower = c.toLowerCase();
        if (lower.includes('meter') || lower === 'lcm') return Course.METERS;
      }
      return Course.YARDS;
    };

    const normalizedCourse = normalizeCourse(res.course);
    const genderVal: 'M' | 'F' = (res.gender === 'Women' || res.gender === 'F' || res.gender === 'Girls' ? 'F' : 'M');
    const ageVal = res.ageGroup || '11-12';

    let existingEvent = events.find(e => 
      e.name.toLowerCase() === res.name.toLowerCase() && 
      e.course === normalizedCourse &&
      e.ageGroup === ageVal
    );

    let eventId: string;

    if (existingEvent) {
      eventId = existingEvent.id;
    } else {
      const newEvent: Event = {
        id: `e-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: res.name,
        distance: res.distance || 50,
        stroke: res.stroke || Stroke.FREE,
        course: normalizedCourse,
        ageGroup: ageVal
      };
      
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: getSessionHeaders(currentUser),
          body: JSON.stringify(newEvent)
        });
        if (response.ok) {
          const savedEvent = await response.json();
          setEvents(prev => [...prev, savedEvent]);
          eventId = savedEvent.id;
        } else {
          setEvents(prev => [...prev, newEvent]);
          eventId = newEvent.id;
        }
      } catch (err) {
        setEvents(prev => [...prev, newEvent]);
        eventId = newEvent.id;
      }
    }

    const newStandards: QualifyingStandard[] = [];

    if (res.regionalTimeStr) {
      newStandards.push({
        id: `s-reg-${Date.now()}-${Math.random()}`,
        eventId, region: 'Regional', ageGroup: ageVal, gender: genderVal, course: normalizedCourse,
        cutTimeSeconds: parseTime(res.regionalTimeStr), season: '2025'
      });
    }

    if (res.stateTimeStr) {
      newStandards.push({
        id: `s-state-${Date.now()}-${Math.random()}`,
        eventId, region: 'State', ageGroup: ageVal, gender: genderVal, course: normalizedCourse,
        cutTimeSeconds: parseTime(res.stateTimeStr), season: '2025'
      });
    }

    if (newStandards.length > 0) {
      try {
        const response = await fetch('/api/standards/bulk', {
          method: 'POST',
          headers: getSessionHeaders(currentUser),
          body: JSON.stringify({ standards: newStandards })
        });
        if (response.ok) {
          const savedStandards = await response.json();
          setStandards(prev => {
            const filtered = prev.filter(s => 
              !(s.eventId === eventId && s.gender === genderVal && s.ageGroup === ageVal && s.course === normalizedCourse)
            );
            return [...filtered, ...savedStandards];
          });
        } else {
          setStandards(prev => {
            const filtered = prev.filter(s => 
              !(s.eventId === eventId && s.gender === genderVal && s.ageGroup === ageVal && s.course === normalizedCourse)
            );
            return [...filtered, ...newStandards];
          });
        }
      } catch (err) {
        setStandards(prev => {
          const filtered = prev.filter(s => 
            !(s.eventId === eventId && s.gender === genderVal && s.ageGroup === ageVal && s.course === normalizedCourse)
          );
          return [...filtered, ...newStandards];
        });
      }
    }
  };

  const handleApplyResults = async () => {
    for (const res of researchResults) {
      await syncSingleResult(res);
    }
    setResearchResults([]);
    setGroundingLinks([]);
    setUploadPreview(null);
    alert("Database updated for all relevant profiles.");
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).toLowerCase().trim();
    const password = formData.get('password') as string;
    
    // First try mock users for demo accounts
    const mockUser = MOCK_USERS.find(u => u.email?.toLowerCase() === email && u.password === password);
    if (mockUser) {
      setCurrentUser(mockUser);
      handleTabChange(mockUser.role === Role.COACH || mockUser.role === Role.ADMIN ? 'roster' : 'dashboard');
      return;
    }

    // Try database login
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const user = await response.json();
        const userWithRole: User = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          teamId: user.teamId
        };
        setCurrentUser(userWithRole);
        handleTabChange(userWithRole.role === Role.COACH || userWithRole.role === Role.ADMIN ? 'roster' : 'dashboard');
      } else {
        const error = await response.json();
        setLoginError(error.error || 'Invalid credentials.');
      }
    } catch (err) {
      setLoginError('Login failed. Please try again.');
    }
  };

  const quickLogin = (email: string) => {
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      handleTabChange(user.role === Role.COACH || user.role === Role.ADMIN ? 'roster' : 'dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('login');
    setActiveTab('dashboard');
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError(null);
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string).trim();
    const email = (formData.get('email') as string).toLowerCase().trim();
    const password = formData.get('password') as string;
    const role = formData.get('role') as Role;

    // Check mock users first
    if (MOCK_USERS.some(u => u.email?.toLowerCase() === email)) {
      setRegisterError('An account with this email already exists.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      if (response.ok) {
        const user = await response.json();
        const newUser: User = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          teamId: user.teamId
        };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        handleTabChange(role === Role.COACH ? 'roster' : 'dashboard');
      } else {
        const error = await response.json();
        setRegisterError(error.error || 'Registration failed.');
      }
    } catch (err) {
      setRegisterError('Registration failed. Please try again.');
    }
  };

  const handleUpdateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEvent) return;
    const formData = new FormData(e.currentTarget);
    const ageGroup = formData.get('ageGroup') as string;
    const course = formData.get('course') as Course;

    // Standard updates for both genders
    const regCutM = formData.get('regCutM') as string;
    const stateCutM = formData.get('stateCutM') as string;
    const regCutF = formData.get('regCutF') as string;
    const stateCutF = formData.get('stateCutF') as string;

    setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? { 
      ...ev, 
      name: formData.get('name') as string, 
      distance: parseInt(formData.get('distance') as string), 
      stroke: formData.get('stroke') as Stroke, 
      course, 
      ageGroup 
    } : ev));

    setStandards(prev => {
      // Clear standards for this specific demographic to ensure they are replaced correctly
      let nextStandards = prev.filter(s => !(s.eventId === editingEvent.id && s.ageGroup === ageGroup && s.course === course));

      const addStd = (gender: 'M' | 'F', region: 'Regional' | 'State', time: string) => {
        if (time) nextStandards.push({ id: `s-${gender}-${region}-${Date.now()}`, eventId: editingEvent.id, region, ageGroup, gender, course, cutTimeSeconds: parseTime(time), season: '2025' });
      };

      addStd('M', 'Regional', regCutM);
      addStd('M', 'State', stateCutM);
      addStd('F', 'Regional', regCutF);
      addStd('F', 'State', stateCutF);

      return nextStandards;
    });

    setEditingEvent(null);
    alert("Global standards updated for both Boys and Girls.");
  };

  const handleAddAthlete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    const formData = new FormData(e.currentTarget);
    const dob = formData.get('dob') as string;
    const newAthlete: Athlete = {
      id: `a${Date.now()}`,
      parentId: currentUser.role === Role.PARENT ? currentUser.id : undefined,
      name: formData.get('name') as string,
      dob,
      gender: formData.get('gender') as 'M' | 'F',
      ageGroup: getAgeGroupAtDate(dob, new Date().toISOString()),
      selectedEventIds: []
    };
    
    try {
      const response = await fetch('/api/athletes', {
        method: 'POST',
        headers: getSessionHeaders(currentUser),
        body: JSON.stringify(newAthlete)
      });
      if (response.ok) {
        const savedAthlete = await response.json();
        setAthletes(prev => [...prev, savedAthlete]);
        setCurrentScreen('roster');
      } else {
        alert('Failed to save athlete. Please try again.');
      }
    } catch (err) {
      console.error('Failed to save athlete:', err);
      alert('Failed to save athlete. Please try again.');
    }
  };

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEvent: Event = {
      id: `e${Date.now()}`,
      name: formData.get('name') as string,
      distance: parseInt(formData.get('distance') as string),
      stroke: formData.get('stroke') as Stroke,
      course: formData.get('course') as Course,
      ageGroup: formData.get('ageGroup') as string
    };
    
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: getSessionHeaders(currentUser),
        body: JSON.stringify(newEvent)
      });
      if (response.ok) {
        const savedEvent = await response.json();
        setEvents(prev => [...prev, savedEvent]);
        e.currentTarget.reset();
        alert("Event created. Use Explorer or Edit to add cut times.");
      } else {
        alert("Failed to save event. Please try again.");
      }
    } catch (err) {
      console.error('Failed to save event:', err);
      alert("Failed to save event. Please try again.");
    }
  };

  const handleAddTime = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEventId || !currentAthlete || !currentUser) return;
    const formData = new FormData(e.currentTarget);
    const timeStr = formData.get('time') as string;
    const dateStr = formData.get('date') as string || new Date().toISOString().split('T')[0];
    const meetNameStr = formData.get('meetName') as string || '';
    
    const newTime: TimeEntry = {
      id: `t${Date.now()}`,
      athleteId: currentAthlete.id,
      eventId: selectedEventId,
      timeSeconds: parseTime(timeStr),
      date: dateStr,
      meetName: meetNameStr || undefined,
      ageGroupAtTime: currentAthlete.ageGroup,
      course: events.find(e => e.id === selectedEventId)?.course || Course.YARDS
    };
    
    try {
      const response = await fetch('/api/times', {
        method: 'POST',
        headers: getSessionHeaders(currentUser),
        body: JSON.stringify(newTime)
      });
      if (response.ok) {
        const savedTime = await response.json();
        setTimes(prev => [...prev, savedTime]);
        setCurrentScreen('event-detail');
      } else {
        alert("Failed to save time. Please try again.");
      }
    } catch (err) {
      console.error('Failed to save time:', err);
      alert("Failed to save time. Please try again.");
    }
  };

  const handleUpdateTime = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTimeEntry || !currentUser) return;
    const formData = new FormData(e.currentTarget);
    const timeStr = formData.get('time') as string;
    const dateStr = formData.get('date') as string || editingTimeEntry.date;
    const meetNameStr = formData.get('meetName') as string || '';

    const updatedTime = {
      ...editingTimeEntry,
      timeSeconds: parseTime(timeStr),
      date: dateStr,
      meetName: meetNameStr || undefined
    };

    try {
      const response = await fetch(`/api/times/${editingTimeEntry.id}`, {
        method: 'PUT',
        headers: getSessionHeaders(currentUser),
        body: JSON.stringify(updatedTime)
      });
      if (response.ok) {
        const savedTime = await response.json();
        setTimes(prev => prev.map(t => t.id === savedTime.id ? savedTime : t));
        setEditingTimeEntry(null);
      } else {
        alert("Failed to update time. Please try again.");
      }
    } catch (err) {
      console.error('Failed to update time:', err);
      alert("Failed to update time. Please try again.");
    }
  };

  const renderDashboard = () => {
    if (!currentAthlete) return <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200"><Users className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-400 font-bold mb-4 uppercase text-xs">No Athlete Selected</p><button onClick={() => handleTabChange('roster')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs">Choose Swimmer</button></div>;
    const selectedEvents = events.filter(e => currentAthlete.selectedEventIds.includes(e.id));
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black italic">{currentAthlete.name.charAt(0)}</div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Profile</p><h2 className="text-2xl font-black text-slate-800 italic uppercase leading-none">{currentAthlete.name}</h2><p className="text-xs font-bold text-blue-600 mt-1">{currentAthlete.ageGroup} • {currentAthlete.gender === 'M' ? 'Male' : 'Female'}</p></div>
          </div>
          <button onClick={() => setCurrentScreen('manage-swimmer-events')} className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-100 transition-all"><Edit3 className="w-5 h-5" /></button>
        </div>
        {selectedEvents.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200"><Info className="w-10 h-10 text-slate-200 mx-auto mb-4" /><p className="text-slate-500 font-bold text-sm uppercase mb-4">No events selected</p><button onClick={() => setCurrentScreen('manage-swimmer-events')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs">Manage My Events</button></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{selectedEvents.map(event => <DashboardCard key={event.id} event={event} bestTime={getBestTime(event.id, currentAthlete.id)} standards={standards.filter(s => s.eventId === event.id && s.gender === currentAthlete.gender && s.ageGroup === event.ageGroup)} onClick={() => { setSelectedEventId(event.id); setCurrentScreen('event-detail'); }} />)}</div>}
      </div>
    );
  };

  const renderAdmin = () => (
    <div className="space-y-6 pb-20">
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <Sparkles className="absolute -right-2 -top-2 w-24 h-24 text-blue-500/10" />
        <div className="flex space-x-6 mb-8 relative z-10 border-b border-slate-800 pb-4 overflow-x-auto no-scrollbar">
          {['explorer', 'search', 'events'].map(mode => <button key={mode} onClick={() => setAdminMode(mode as any)} className={`pb-2 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${adminMode === mode ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500'}`}>{mode}</button>)}
        </div>

        <div className="relative z-10">
          {adminMode === 'explorer' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center space-x-2"><Filter className="w-4 h-4 text-blue-500" /><select value={explorerFilter.ageGroup} onChange={e => setExplorerFilter({...explorerFilter, ageGroup: e.target.value})} className="bg-transparent text-xs font-black uppercase outline-none focus:text-white"><option value="10U">10U</option><option value="11-12">11-12</option><option value="13-14">13-14</option><option value="15-16">15-16</option><option value="17-18">17-18</option></select></div>
                <div className="flex items-center space-x-2 border-l border-slate-700 pl-3"><UserIcon className="w-4 h-4 text-pink-500" /><select value={explorerFilter.gender} onChange={e => setExplorerFilter({...explorerFilter, gender: e.target.value as 'M' | 'F'})} className="bg-transparent text-xs font-black uppercase outline-none focus:text-white"><option value="M">Boys</option><option value="F">Girls</option></select></div>
                <div className="flex items-center space-x-2 border-l border-slate-700 pl-3"><Ruler className="w-4 h-4 text-blue-400" /><select value={explorerFilter.course} onChange={e => setExplorerFilter({...explorerFilter, course: e.target.value as Course})} className="bg-transparent text-xs font-black uppercase outline-none focus:text-white"><option value={Course.YARDS}>SCY (Yards)</option><option value={Course.METERS}>LCM (Meters)</option></select></div>
              </div>
              <div className="space-y-3">
                  {events.filter(e => e.course === explorerFilter.course && e.ageGroup === explorerFilter.ageGroup).map(ev => {
                    const evCuts = standards.filter(s => s.eventId === ev.id && s.ageGroup === explorerFilter.ageGroup && s.gender === explorerFilter.gender && s.course === explorerFilter.course);
                    return (
                      <div key={ev.id} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
                        <div><p className="font-bold text-sm">{ev.name}</p><p className="text-[9px] text-slate-500 font-black uppercase">{ev.stroke}</p></div>
                        <div className="flex space-x-4">
                            {evCuts.length === 0 ? <p className="text-[9px] text-slate-600 font-black uppercase italic">No cuts</p> : evCuts.map(cut => <div key={cut.id} className="text-right"><p className="text-[8px] font-black uppercase text-slate-500">{cut.region}</p><p className="font-mono text-blue-400 font-black text-xs">{formatTime(cut.cutTimeSeconds)}</p></div>)}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {adminMode === 'search' && (
            <div className="space-y-6">
              <form onSubmit={handleResearchStandards} className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Search className="w-4 h-4 text-blue-500" />
                  <p className="text-[10px] font-black uppercase text-slate-400">AI Research Standards</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select name="ageGroup" required className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white">
                    <option value="10U">10U</option>
                    <option value="11-12">11-12</option>
                    <option value="13-14">13-14</option>
                    <option value="15-16">15-16</option>
                    <option value="17-18">17-18</option>
                  </select>
                  <select name="gender" required className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white">
                    <option value="M">Boys</option>
                    <option value="F">Girls</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="stateLocation" type="text" placeholder="State (e.g. Texas, California)" required className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white placeholder:text-slate-600" />
                  <select name="course" required className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white">
                    <option value={Course.YARDS}>SCY (Yards)</option>
                    <option value={Course.METERS}>LCM (Meters)</option>
                  </select>
                </div>
                <button type="submit" disabled={isResearching} className="w-full bg-blue-600 py-3 rounded-lg font-black uppercase text-[10px] flex items-center justify-center hover:bg-blue-500 transition-all disabled:opacity-50">
                  {isResearching ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Searching...</> : <><Search className="w-4 h-4 mr-2" /> Research Standards</>}
                </button>
              </form>

              {groundingLinks.length > 0 && (
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <p className="text-[9px] font-black uppercase text-slate-500 mb-2">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {groundingLinks.map((link, i) => (
                      <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-[10px] text-blue-400 hover:text-blue-300">
                        <ExternalLink className="w-3 h-3" />
                        <span>{link.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {researchResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-slate-400">Found {researchResults.length} Events</p>
                    <button onClick={() => researchResults.forEach(res => syncSingleResult(res))} className="bg-green-600 hover:bg-green-500 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center space-x-1">
                      <Save className="w-3 h-3" />
                      <span>Apply All</span>
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {researchResults.map((res, i) => (
                      <div key={i} className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm">{res.name}</p>
                          <p className="text-[9px] text-slate-500 font-black uppercase">{res.ageGroup} • {res.gender}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-[8px] font-black uppercase text-slate-500">Regional</p>
                            <p className="font-mono text-blue-400 font-bold text-xs">{res.regionalTimeStr || '-'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-black uppercase text-slate-500">State</p>
                            <p className="font-mono text-green-400 font-bold text-xs">{res.stateTimeStr || '-'}</p>
                          </div>
                          <button onClick={() => syncSingleResult(res)} className="bg-blue-600/20 hover:bg-blue-600/40 p-2 rounded-lg transition-all">
                            <Plus className="w-4 h-4 text-blue-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isResearching && researchResults.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-xs font-bold">Enter filters above and search to find qualifying standards</p>
                </div>
              )}
            </div>
          )}

          {adminMode === 'events' && (
            <div className="space-y-6">
              {editingEvent ? (
                <form onSubmit={handleUpdateEvent} className="bg-slate-800 p-5 rounded-xl border border-blue-500/50 space-y-4 shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase text-blue-400">Editing {editingEvent.name}</p><button type="button" onClick={() => setEditingEvent(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button></div>
                  <div className="grid grid-cols-2 gap-2"><input name="name" type="text" defaultValue={editingEvent.name} required className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-blue-500" /><input name="distance" type="number" defaultValue={editingEvent.distance} required className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <select name="stroke" defaultValue={editingEvent.stroke} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-xs font-bold text-white">{Object.values(Stroke).map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <select name="course" defaultValue={editingEvent.course} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-xs font-bold text-white">{Object.values(Course).map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <div><select name="ageGroup" defaultValue={editingEvent.ageGroup} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-xs font-bold text-white"><option value="10U">10U</option><option value="11-12">11-12</option><option value="13-14">13-14</option><option value="15-16">15-16</option><option value="17-18">17-18</option></select></div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4 mt-2">
                    <div className="space-y-3">
                      <p className="text-[9px] font-black uppercase text-blue-400">Boys Cuts</p>
                      <input name="regCutM" type="text" placeholder="Reg (mm:ss.xx)" defaultValue={formatTime(standards.find(s => s.eventId === editingEvent.id && s.gender === 'M' && s.region === 'Regional' && s.ageGroup === editingEvent.ageGroup && s.course === editingEvent.course)?.cutTimeSeconds || 0) || ''} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white" />
                      <input name="stateCutM" type="text" placeholder="State (mm:ss.xx)" defaultValue={formatTime(standards.find(s => s.eventId === editingEvent.id && s.gender === 'M' && s.region === 'State' && s.ageGroup === editingEvent.ageGroup && s.course === editingEvent.course)?.cutTimeSeconds || 0) || ''} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[9px] font-black uppercase text-pink-400">Girls Cuts</p>
                      <input name="regCutF" type="text" placeholder="Reg (mm:ss.xx)" defaultValue={formatTime(standards.find(s => s.eventId === editingEvent.id && s.gender === 'F' && s.region === 'Regional' && s.ageGroup === editingEvent.ageGroup && s.course === editingEvent.course)?.cutTimeSeconds || 0) || ''} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white" />
                      <input name="stateCutF" type="text" placeholder="State (mm:ss.xx)" defaultValue={formatTime(standards.find(s => s.eventId === editingEvent.id && s.gender === 'F' && s.region === 'State' && s.ageGroup === editingEvent.ageGroup && s.course === editingEvent.course)?.cutTimeSeconds || 0) || ''} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white" />
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full bg-green-600 py-3 rounded-lg font-black uppercase text-[10px] hover:bg-green-500 transition-colors mt-4">Save Changes</button>
                </form>
              ) : (
                <div className="space-y-4">
                  <form onSubmit={handleAddEvent} className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-500">New Master Event</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input name="name" type="text" placeholder="50 Free" required className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white" />
                      <input name="distance" type="number" placeholder="Distance" required className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select name="stroke" required className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white">
                        {Object.values(Stroke).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select name="course" required className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white">
                        {Object.values(Course).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <select name="ageGroup" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white">
                      <option value="10U">10U</option>
                      <option value="11-12">11-12</option>
                      <option value="13-14">13-14</option>
                      <option value="15-16">15-16</option>
                      <option value="17-18">17-18</option>
                    </select>
                    <button type="submit" className="w-full bg-blue-600 py-3 rounded-lg font-black uppercase text-[10px] flex items-center justify-center"><Plus className="w-4 h-4 mr-2" /> Create</button>
                  </form>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {events.map(ev => <div key={ev.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex justify-between items-center group"><div><p className="font-bold text-xs">{ev.name}</p><p className="text-[9px] text-slate-500 font-bold uppercase">{ev.stroke} • {ev.ageGroup}</p></div><div className="flex space-x-2"><button onClick={() => setEditingEvent(ev)} className="text-slate-500 hover:text-blue-400 p-1"><Edit3 className="w-4 h-4" /></button></div></div>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const getContent = () => {
    switch (currentScreen) {
      case 'dashboard': return renderDashboard();
      case 'event-detail': return selectedEventId && currentAthlete ? <div className="space-y-6 pb-10"><button onClick={() => setCurrentScreen('dashboard')} className="flex items-center text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-800"><ChevronLeft className="w-4 h-4 mr-1" /> Back</button><div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><div className="flex justify-between items-start mb-8"><div><h3 className="text-3xl font-black text-slate-900 italic uppercase">{events.find(e => e.id === selectedEventId)?.name}</h3><div className="flex items-center space-x-2 mt-1"><p className="text-sm font-bold text-slate-400 uppercase">{events.find(e => e.id === selectedEventId)?.stroke}</p></div></div><button onClick={() => setCurrentScreen('add-time')} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:bg-blue-500 transition-all"><Plus className="w-6 h-6" /></button></div><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><RechartsLine data={times.filter(t => t.eventId === selectedEventId && t.athleteId === currentAthlete.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(t => ({ date: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), time: t.timeSeconds }))}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="date" tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} /><YAxis hide domain={['auto', 'auto']} /><Tooltip formatter={(v: number) => [formatTime(v), 'Result']} /><Line type="monotone" dataKey="time" stroke="#2563eb" strokeWidth={4} dot={{r: 5, fill: '#2563eb'}} /></RechartsLine></ResponsiveContainer></div></div><div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center"><History className="w-4 h-4 mr-2" /> Time History</h4><div className="space-y-3">{times.filter(t => t.eventId === selectedEventId && t.athleteId === currentAthlete.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100"><div><p className="font-black text-blue-600 text-lg">{formatTime(t.timeSeconds)}</p><div className="flex items-center space-x-2 mt-1"><Calendar className="w-3 h-3 text-slate-400" /><span className="text-xs text-slate-500 font-bold">{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>{t.meetName && <><span className="w-1 h-1 bg-slate-300 rounded-full"></span><span className="text-xs text-slate-600 font-bold">{t.meetName}</span></>}</div></div><button onClick={() => setEditingTimeEntry(t)} className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all"><Edit3 className="w-4 h-4" /></button></div>)}{times.filter(t => t.eventId === selectedEventId && t.athleteId === currentAthlete.id).length === 0 && <p className="text-center text-slate-400 text-sm py-8">No times recorded yet</p>}</div></div>{editingTimeEntry && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-900 italic uppercase">Edit Time</h3><button onClick={() => setEditingTimeEntry(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div><form onSubmit={handleUpdateTime} className="space-y-4"><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Time (mm:ss.xx)</label><input name="time" type="text" defaultValue={formatTime(editingTimeEntry.timeSeconds)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-600" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Meet Date</label><input name="date" type="date" defaultValue={editingTimeEntry.date} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-600" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Meet Name (optional)</label><input name="meetName" type="text" defaultValue={editingTimeEntry.meetName || ''} placeholder="e.g. Regional Championships" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-600" /></div><div className="flex space-x-3 pt-2"><button type="button" onClick={() => setEditingTimeEntry(null)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black uppercase text-xs">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-xs">Save Changes</button></div></form></div></div>}</div> : null;
      case 'manage-swimmer-events': return currentAthlete ? <div className="space-y-6"><button onClick={() => setCurrentScreen('dashboard')} className="flex items-center text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-800"><ChevronLeft className="w-4 h-4 mr-1" /> Back</button><div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><h3 className="text-xl font-black text-slate-900 italic uppercase mb-2">Track Your Events</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Age Group: {currentAthlete.ageGroup}</p><div className="space-y-3">{events.filter(e => e.ageGroup === currentAthlete.ageGroup).map(e => <div key={e.id} onClick={() => handleToggleEventSelection(e.id)} className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${currentAthlete.selectedEventIds.includes(e.id) ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white'}`}><div><p className="font-bold text-sm text-slate-800">{e.name}</p></div>{currentAthlete.selectedEventIds.includes(e.id) ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-slate-300" />}</div>)}</div></div></div> : null;
      case 'focus': return <div className="space-y-6 pb-20"><div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden"><Sparkles className="absolute -right-2 -top-2 w-24 h-24 text-blue-500/10" /><div className="flex items-center justify-between mb-6 relative z-10"><div className="flex items-center space-x-3"><div className="bg-blue-600 p-2 rounded-lg"><Lightbulb className="w-5 h-5 text-white" /></div><div><h3 className="text-lg font-black italic uppercase">AI Technique Coach</h3></div></div><button onClick={handleGenerateStrokeInsights} disabled={isGeneratingInsights} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all">{isGeneratingInsights ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}</button></div></div></div>;
      case 'roster': return <div className="space-y-4">{(currentUser?.role === Role.PARENT || currentUser?.role === Role.COACH || currentUser?.role === Role.ADMIN) && <button onClick={() => setCurrentScreen('add-athlete')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center space-x-2 hover:bg-blue-500 transition-all shadow-lg"><Plus className="w-5 h-5" /><span>Add Swimmer</span></button>}{visibleAthletes.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200"><Users className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-400 font-bold mb-2 uppercase text-xs">No swimmers yet</p><p className="text-slate-400 text-sm">Click the button above to add your first swimmer</p></div> : visibleAthletes.map(a => <div key={a.id} onClick={() => { setSelectedAthleteId(a.id); setCurrentScreen('dashboard'); setActiveTab('dashboard'); }} className={`bg-white p-5 rounded-2xl border ${selectedAthleteId === a.id ? 'border-blue-600 shadow-blue-50' : 'border-slate-100'} shadow-sm flex justify-between items-center cursor-pointer hover:border-blue-200 transition-all group`}><div className="flex items-center space-x-4"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors"><UserIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-600" /></div><div><p className="font-black text-slate-800 uppercase italic leading-none mb-1">{a.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{a.ageGroup} • {a.gender}</p></div></div><ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" /></div>)}</div>;
      case 'admin': return renderAdmin();
      case 'add-time': return selectedEventId && currentAthlete ? <div className="max-w-md mx-auto space-y-6"><button onClick={() => setCurrentScreen('event-detail')} className="flex items-center text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-800 transition-colors"><ChevronLeft className="w-4 h-4 mr-1" /> Back</button><div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6"><div className="border-b border-slate-100 pb-6 mb-2"><div className="flex items-center space-x-3 mb-2"><div className="bg-blue-600 p-2 rounded-lg"><Clock className="w-5 h-5 text-white" /></div><h3 className="text-2xl font-black text-slate-900 italic uppercase">Add Result</h3></div><div className="flex items-center space-x-2 mt-1"><span className="font-black text-slate-800 text-sm uppercase">{events.find(e => e.id === selectedEventId)?.name}</span><span className="w-1 h-1 bg-slate-200 rounded-full"></span><span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{currentAthlete.name}</span></div></div><form onSubmit={handleAddTime} className="space-y-6"><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Time (mm:ss.xx)</label><input name="time" type="text" placeholder="1:05.42" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-600" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Meet Date</label><input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-600" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Meet Name (optional)</label><input name="meetName" type="text" placeholder="e.g. Regional Championships" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-600" /></div><button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl">Save Record</button></form></div></div> : null;
      case 'add-athlete': return <div className="max-w-md mx-auto"><button onClick={() => setCurrentScreen('roster')} className="flex items-center text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-800 mb-6"><ChevronLeft className="w-4 h-4 mr-1" /> Back</button><div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6"><h3 className="text-2xl font-black text-slate-900 italic uppercase">New Swimmer</h3><form onSubmit={handleAddAthlete} className="space-y-6"><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Name</label><input name="name" type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-600" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Birth Date</label><input name="dob" type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-600" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Gender</label><select name="gender" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-600"><option value="M">Male</option><option value="F">Female</option></select></div><button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl">Add Athlete</button></form></div></div>;
      default: return renderDashboard();
    }
  };

  if (currentScreen === 'login') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"><Trophy className="text-white w-10 h-10" /></div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-10">SwimQualify</h1>
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <input name="email" type="email" placeholder="alex@team.com" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white font-bold outline-none" />
            <input name="password" type="password" placeholder="••••••••" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white font-bold outline-none" />
            {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
            <button type="submit" className="w-full py-4 rounded-xl font-black uppercase bg-blue-600 text-white shadow-xl hover:bg-blue-500 transition-all">Log In</button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-sm text-slate-400">Don't have an account? <button onClick={() => { setCurrentScreen('register'); setLoginError(null); }} className="text-blue-500 font-bold hover:text-blue-400">Register</button></p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest text-center">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {['alex@team.com', 'maria@parent.com', 'sarah@team.com', 'admin@swim.com'].map(e => <button key={e} onClick={() => quickLogin(e)} className="bg-slate-900 hover:bg-blue-900/40 border border-slate-700 rounded-lg p-2 text-[9px] font-black uppercase text-slate-500 truncate transition-all">{e.split('@')[0]}</button>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (currentScreen === 'register') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"><UserPlus className="text-white w-10 h-10" /></div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-10">Create Account</h1>
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <input name="name" type="text" placeholder="Your Name" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white font-bold outline-none" />
            <input name="email" type="email" placeholder="email@example.com" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white font-bold outline-none" />
            <input name="password" type="password" placeholder="Password" required minLength={6} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white font-bold outline-none" />
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest text-left">I am a...</label>
              <select name="role" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white font-bold outline-none">
                <option value={Role.SWIMMER}>Swimmer</option>
                <option value={Role.PARENT}>Parent</option>
                <option value={Role.COACH}>Coach</option>
              </select>
            </div>
            {registerError && <p className="text-red-500 text-xs font-bold">{registerError}</p>}
            <button type="submit" className="w-full py-4 rounded-xl font-black uppercase bg-blue-600 text-white shadow-xl hover:bg-blue-500 transition-all">Create Account</button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-sm text-slate-400">Already have an account? <button onClick={() => { setCurrentScreen('login'); setRegisterError(null); }} className="text-blue-500 font-bold hover:text-blue-400">Log In</button></p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={handleTabChange} 
      title={activeTab === 'dashboard' ? 'Season Best' : activeTab === 'roster' ? 'Team Profile' : activeTab === 'focus' ? 'Performance' : 'Admin Tools'} 
      user={currentUser!} 
      onLogout={handleLogout}
    >
      {getContent()}
    </Layout>
  );
};

export default App;
