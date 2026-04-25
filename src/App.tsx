/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  StickyNote, 
  Bell, 
  CheckSquare, 
  Code, 
  Settings as SettingsIcon, 
  Plus, 
  Search, 
  Trash2, 
  MoreVertical,
  X,
  Palette,
  AlertCircle,
  Clock,
  ExternalLink,
  CheckCircle,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Note, Reminder, Todo, HtmlSnippet, AppSettings } from './types';

// Components (will be defined below or moved to separate files if needed)
export default function App() {
  const [activeTab, setActiveTab] = useState<'notes' | 'reminder' | 'todo' | 'html' | 'settings'>('notes');
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  // Persistence
  const [notes, setNotes] = useState<Note[]>(() => JSON.parse(localStorage.getItem('notes') || '[]'));
  const [reminders, setReminders] = useState<Reminder[]>(() => JSON.parse(localStorage.getItem('reminders') || '[]'));
  const [todos, setTodos] = useState<Todo[]>(() => JSON.parse(localStorage.getItem('todos') || '[]'));
  const [htmlSnippets, setHtmlSnippets] = useState<HtmlSnippet[]>(() => JSON.parse(localStorage.getItem('htmlSnippets') || '[]'));
  const [settings, setSettings] = useState<AppSettings>(() => JSON.parse(localStorage.getItem('settings') || '{"fontStyle": "font-sans", "fontSize": "text-base"}'));

  const [searchQuery, setSearchQuery] = useState('');
  const [showImportantOnly, setShowImportantOnly] = useState(false);

  // Editor states
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [editingHtml, setEditingHtml] = useState<HtmlSnippet | null>(null);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('htmlSnippets', JSON.stringify(htmlSnippets));
  }, [htmlSnippets]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  // Reminder Alert System
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      reminders.forEach(r => {
        if (!r.isCompleted && r.time <= now) {
          alert(`Reminder: ${r.text}`);
          setReminders(prev => prev.map(rem => rem.id === r.id ? { ...rem, isCompleted: true } : rem));
        }
      });
    }, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [reminders]);

  // Auto-delete completed tasks after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      setTodos(currentTodos => {
        const filtered = currentTodos.filter(todo => {
          if (todo.isCompleted && todo.completedAt) {
            return now - todo.completedAt < fiveMinutes;
          }
          return true;
        });
        
        if (filtered.length !== currentTodos.length) {
          return filtered;
        }
        return currentTodos;
      });
    }, 10000); // Check every 10 seconds for smoothness
    
    return () => clearInterval(interval);
  }, []);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we have an open modal, close it
      if (editingNote || isAddingReminder || isAddingTodo || editingHtml) {
        setEditingNote(null);
        setIsAddingReminder(false);
        setIsAddingTodo(false);
        setEditingHtml(null);
        return;
      }

      // If we are not on the notes tab, go to notes tab
      if (activeTab !== 'notes') {
        setActiveTab('notes');
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Push state when "deeper" in the app
    const shouldHaveBackState = !!(editingNote || isAddingReminder || isAddingTodo || editingHtml || activeTab !== 'notes');
    if (shouldHaveBackState) {
      window.history.pushState({ depth: 1 }, '');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [editingNote, isAddingReminder, isAddingTodo, editingHtml, activeTab]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             n.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = showImportantOnly ? n.isImportant : true;
      return matchesSearch && matchesFilter;
    });
  }, [notes, searchQuery, showImportantOnly]);

  const colors = [
    'bg-white border-slate-200',
    'bg-amber-50 border-amber-200',
    'bg-sky-50 border-sky-200',
    'bg-rose-50 border-rose-200',
    'bg-emerald-50 border-emerald-200',
    'bg-purple-50 border-purple-200',
    'bg-indigo-50 border-indigo-200',
    'bg-teal-50 border-teal-200'
  ];

  const fontFamilies = [
    { name: 'Sans', class: 'font-sans' },
    { name: 'Serif', class: 'font-serif' },
    { name: 'Mono', class: 'font-mono' }
  ];

  const fontSizes = [
    { name: 'Small', class: 'text-sm' },
    { name: 'Normal', class: 'text-base' },
    { name: 'Large', class: 'text-lg' },
    { name: 'Extra Large', class: 'text-xl' }
  ];

  const addNote = (note: Partial<Note>) => {
    if (!note.title?.trim() && !note.content?.trim()) return;
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: note.title?.trim() || 'Untitled',
      content: note.content?.trim() || '',
      isImportant: !!note.isImportant,
      color: note.color || colors[Math.floor(Math.random() * colors.length)],
      createdAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    if (updates.title !== undefined && updates.content !== undefined) {
      if (!updates.title.trim() && !updates.content.trim()) {
        deleteNote(id);
        return;
      }
    }
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const addReminder = (text: string, time: number) => {
    if (!text.trim()) return;
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      text: text.trim(),
      time,
      isCompleted: false,
    };
    setReminders(prev => [newReminder, ...prev]);
    setIsAddingReminder(false);
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const addTodo = (text: string) => {
    if (!text.trim()) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: text.trim(),
      isCompleted: false,
    };
    setTodos(prev => [newTodo, ...prev]);
    setIsAddingTodo(false);
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => 
      t.id === id 
        ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? Date.now() : undefined } 
        : t
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const deleteHtmlSnippet = (id: string) => {
    setHtmlSnippets(prev => prev.filter(h => h.id !== id));
  };

  const saveHtml = (snippet: Partial<HtmlSnippet>) => {
    const finalName = snippet.name?.trim() || 'untitled';
    const finalCode = snippet.code || '';

    if (!snippet.name?.trim() && !snippet.code?.trim()) {
      setEditingHtml(null);
      return;
    }
    
    if (editingHtml?.id) {
       setHtmlSnippets(prev => prev.map(h => h.id === editingHtml.id ? { ...h, name: finalName, code: finalCode } : h));
    } else {
      const newSnippet: HtmlSnippet = {
        id: crypto.randomUUID(),
        name: finalName,
        code: finalCode,
        createdAt: Date.now(),
      };
      setHtmlSnippets(prev => [newSnippet, ...prev]);
    }
    setEditingHtml(null);
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${settings.fontStyle} ${settings.fontSize} bg-[#f8fafc] text-slate-800`}>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="p-8 bg-transparent flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold tracking-tight text-indigo-900">QuiqNote</h1>
            <div className="hidden md:block h-6 w-[1px] bg-slate-300"></div>
          </div>

          <div className="flex-1 max-w-2xl w-full flex flex-col md:flex-row items-center gap-4">
            {activeTab === 'notes' && (
              <>
                <div className="relative flex-grow w-full">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search notes..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div className="flex items-center space-x-1 bg-white p-1 rounded-full shadow-sm border border-slate-200 text-[10px] font-bold tracking-tighter shrink-0">
                  <button 
                    onClick={() => setShowImportantOnly(false)}
                    className={`px-3 py-1.5 rounded-full transition-all ${!showImportantOnly ? 'bg-indigo-50 text-indigo-900' : 'text-slate-400'}`}
                  >
                    ALL
                  </button>
                  <button 
                    onClick={() => setShowImportantOnly(true)}
                    className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${showImportantOnly ? 'bg-rose-50 text-rose-600' : 'text-slate-400'}`}
                  >
                    <AlertCircle className={`w-3 h-3 ${showImportantOnly ? 'fill-rose-100' : ''}`} />
                    IMPORTANT
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="p-8 pb-32 flex-grow">
          <AnimatePresence mode="wait">
            {activeTab === 'notes' && (
              <motion.div 
                key="notes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {filteredNotes.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-slate-400">
                    <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No notes found. Create your first one!</p>
                  </div>
                ) : (
                  filteredNotes.map(note => (
                    <motion.div 
                      layoutId={note.id}
                      key={note.id} 
                      onClick={() => setEditingNote(note)}
                      className={`${note.color} p-6 rounded-2xl shadow-sm border cursor-pointer relative group flex flex-col h-48 overflow-hidden transition-transform duration-200`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="flex items-center text-[10px] font-bold uppercase tracking-wider opacity-70">
                          {note.isImportant && <span className="important-dot mr-1" />}
                          {note.isImportant ? 'Important' : 'Regular'}
                        </span>
                        <span className="text-[10px] opacity-50 uppercase tracking-widest">{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-slate-900 truncate pr-6">{note.title}</h3>
                      <p className="text-sm text-slate-700 flex-1 overflow-hidden whitespace-pre-wrap">{note.content}</p>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (window.confirm('Delete this note?')) {
                            deleteNote(note.id); 
                          }
                        }}
                        type="button"
                        className="absolute bottom-4 right-4 p-2 bg-white/40 hover:bg-white/60 md:opacity-0 md:group-hover:opacity-100 rounded-full transition-all duration-200 z-20 shadow-sm border border-black/5"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'reminder' && (
              <motion.div 
                key="reminder"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto space-y-4"
              >
                <h2 className="text-2xl font-bold mb-8 text-indigo-900">Reminders</h2>
                {reminders.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No reminders scheduled.</p>
                  </div>
                ) : (
                  reminders.sort((a,b) => a.time - b.time).map(r => (
                    <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-xl ${r.isCompleted ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                          <Bell className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={`text-lg font-bold text-slate-900 ${r.isCompleted ? 'line-through opacity-50' : ''}`}>{r.text}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(r.time).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this reminder?')) {
                            deleteReminder(r.id);
                          }
                        }} 
                        type="button"
                        className="p-3 text-slate-300 hover:text-red-500 transition-colors z-20"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'todo' && (
              <motion.div 
                key="todo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto space-y-4"
              >
                <h2 className="text-2xl font-bold mb-8 text-indigo-900">Task List</h2>
                {todos.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No tasks yet.</p>
                  </div>
                ) : (
                  todos.map(t => (
                    <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm group hover:shadow-md transition-all">
                      <div className="flex items-center gap-6 flex-grow">
                        <button 
                          onClick={() => toggleTodo(t.id)}
                          className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${t.isCompleted ? 'bg-purple-600 border-purple-600 shadow-lg shadow-purple-200' : 'border-slate-200'}`}
                        >
                           {t.isCompleted && <CheckSquare className="w-5 h-5 text-white" />}
                        </button>
                        <p className={`text-lg font-medium text-slate-800 ${t.isCompleted ? 'line-through opacity-40' : ''}`}>{t.text}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this task?')) {
                            deleteTodo(t.id);
                          }
                        }} 
                        type="button"
                        className="p-3 text-slate-300 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 z-20"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'html' && (
              <motion.div 
                key="html"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                 {htmlSnippets.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-slate-400">
                    <Code className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No snippets stored.</p>
                  </div>
                ) : (
                  htmlSnippets.map(h => (
                    <div key={h.id} onClick={() => setEditingHtml(h)} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 cursor-pointer group relative flex flex-col h-48 overflow-hidden shadow-xl hover:border-indigo-500/30 transition-colors">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this HTML snippet?')) {
                            deleteHtmlSnippet(h.id);
                          }
                        }}
                        type="button"
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100 rounded-full transition-all duration-200 z-20"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">HTML Snippet</span>
                        <span className="text-[10px] text-slate-500 font-mono">{h.name}.html</span>
                      </div>
                      <div className="flex-grow overflow-hidden mt-2">
                        <code className="text-indigo-300 text-xs leading-relaxed font-mono block">
                          {h.code}
                        </code>
                      </div>
                      <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <ExternalLink className="text-white w-8 h-8" />
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto flex flex-col md:flex-row gap-8"
              >
                <div className="flex-1 space-y-8">
                  <h2 className="text-2xl font-bold text-indigo-900">Interface Settings</h2>
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <section>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Font Style</label>
                      <div className="grid grid-cols-3 gap-3">
                        {fontFamilies.map(f => (
                          <button 
                            key={f.class} 
                            onClick={() => setSettings({...settings, fontStyle: f.class})}
                            className={`py-3 px-4 rounded-xl border transition-all text-sm font-medium ${settings.fontStyle === f.class ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </section>
                    <section>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Font Size</label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {fontSizes.map(s => (
                          <button 
                            key={s.class} 
                            onClick={() => setSettings({...settings, fontSize: s.class})}
                            className={`py-2 px-3 rounded-xl border transition-all text-xs font-medium ${settings.fontSize === s.class ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>

                <div className="w-full md:w-80 space-y-6">
                  <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
                    <h3 className="font-bold text-indigo-900 mb-4 text-lg">About QuiqNote</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl">
                        <span className="text-slate-500">Author</span>
                        <span className="font-bold text-indigo-900 text-right">Doh-Nani Fredrick Senyo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl">
                        <span className="text-slate-500">Email</span>
                        <span className="font-bold text-indigo-900 text-right overflow-hidden text-[10px] ml-4">dohnanifrederick2@gmail.com</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl">
                        <span className="text-slate-500">Country</span>
                        <span className="font-bold text-indigo-900 text-right">Ghana 🇬🇭</span>
                      </div>
                    </div>
                  </section>
                  <div className="text-center text-[10px] text-slate-400 font-medium">QuiqNote v1.0.4 • Built with Precision</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Action Button */}
      {activeTab === 'notes' && (
        <div className="fixed bottom-28 right-8 flex flex-col items-end z-50">
          <AnimatePresence>
            {isFabOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="flex flex-col mb-4 gap-3 items-end"
              >
                {[
                  { 
                    label: 'New Note', 
                    icon: StickyNote, 
                    color: 'text-indigo-600', 
                    onClick: () => setEditingNote({ id:'', title:'', content:'', isImportant:false, color: colors[Math.floor(Math.random()*colors.length)], createdAt: Date.now() }) 
                  },
                  { 
                    label: 'Reminder', 
                    icon: Bell, 
                    color: 'text-emerald-600', 
                    onClick: () => setIsAddingReminder(true) 
                  },
                  { 
                    label: 'Quick Task', 
                    icon: CheckSquare, 
                    color: 'text-purple-600', 
                    onClick: () => setIsAddingTodo(true) 
                  },
                  { 
                    label: 'Code Snippet', 
                    icon: Code, 
                    color: 'text-slate-800', 
                    onClick: () => setEditingHtml({ id:'', name:'', code:'', createdAt: Date.now() }) 
                  },
                ].map((item, idx) => (
                  <motion.div 
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() => { setIsFabOpen(false); item.onClick(); }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.label}
                    </span>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-11 h-11 bg-white rounded-xl flex items-center justify-center ${item.color} shadow-lg border border-slate-100`}
                    >
                      <item.icon className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-colors"
            whileTap={{ scale: 0.9 }}
            animate={{ rotate: isFabOpen ? 45 : 0 }}
          >
            <Plus className="w-8 h-8" />
          </motion.button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 glass h-20 flex items-center justify-evenly max-w-4xl mx-auto md:rounded-t-3xl border-t border-slate-200/50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50 px-4">
        <NavButton active={activeTab === 'notes'} icon={<StickyNote className="w-6 h-6 md:w-7 md:h-7" />} onClick={() => setActiveTab('notes')} />
        <NavButton active={activeTab === 'reminder'} icon={<Bell className="w-6 h-6 md:w-7 md:h-7" />} onClick={() => setActiveTab('reminder')} />
        <NavButton active={activeTab === 'todo'} icon={<CheckSquare className="w-6 h-6 md:w-7 md:h-7" />} onClick={() => setActiveTab('todo')} />
        <NavButton active={activeTab === 'html'} icon={<Code className="w-6 h-6 md:w-7 md:h-7" />} onClick={() => setActiveTab('html')} />
        <NavButton active={activeTab === 'settings'} icon={<SettingsIcon className="w-6 h-6 md:w-7 md:h-7" />} onClick={() => setActiveTab('settings')} />
      </nav>

      {/* Modals/Editors */}
      {editingNote && (
        <NoteEditor 
          note={editingNote} 
          colors={colors}
          onSave={(updated) => {
            if (updated.id) {
              updateNote(updated.id, updated);
            } else {
              addNote(updated);
            }
            setEditingNote(null);
          }} 
          onClose={() => setEditingNote(null)} 
        />
      )}

      {isAddingReminder && (
        <ReminderForm onSave={addReminder} onClose={() => setIsAddingReminder(false)} />
      )}

      {isAddingTodo && (
        <TodoForm onSave={addTodo} onClose={() => setIsAddingTodo(false)} />
      )}

      {editingHtml && (
        <HtmlEditorModal 
          snippet={editingHtml} 
          onSave={saveHtml} 
          onClose={() => setEditingHtml(null)} 
        />
      )}
    </div>
  );
}

function NavButton({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-2xl transition-all ${active ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {icon}
    </button>
  );
}

function FabSubItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md uppercase tracking-wider font-bold shadow-lg">{label}</span>
      <button onClick={onClick} className="w-12 h-12 bg-white text-indigo-600 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50">
        {icon}
      </button>
    </div>
  );
}

function NoteEditor({ note, colors, onSave, onClose }: { note: Note, colors: string[], onSave: (note: Partial<Note>) => void, onClose: () => void }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isImportant, setIsImportant] = useState(note.isImportant);
  const [color, setColor] = useState(note.color);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className={`w-full max-w-2xl ${color} rounded-t-3xl md:rounded-3xl p-8 flex flex-col max-h-[90vh]`}
      >
        <div className="flex justify-between mb-8">
           <div className="flex items-center gap-3">
             <div className="flex gap-2">
               {colors.map(c => (
                 <button 
                  key={c} 
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${c === color ? 'border-gray-800 scale-110' : 'border-black/5'}`}
                 />
               ))}
             </div>
             <button 
               onClick={() => setColor(colors[Math.floor(Math.random() * colors.length)])}
               className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors"
               title="Randomize Color"
             >
               <Palette className="w-5 h-5 text-gray-700" />
             </button>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full"><X className="w-6 h-6" /></button>
        </div>

        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="text-2xl font-bold bg-transparent border-none focus:ring-0 mb-4 placeholder:text-black/20"
        />

        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="flex-grow bg-transparent border-none focus:ring-0 resize-none text-lg min-h-[300px] placeholder:text-black/20"
        />

        <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-6">
           <div className="flex gap-4 items-center">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isImportant} 
                  onChange={(e) => setIsImportant(e.target.checked)} 
                  className="w-5 h-5 rounded border-black/20 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium opacity-60 group-hover:opacity-100 transition-opacity">Mark as Important</span>
              </label>
           </div>
           <button 
             onClick={() => {
               if (title.trim() || content.trim()) {
                 onSave({ ...note, title: title.trim(), content: content.trim(), isImportant, color });
               } else {
                 onClose();
               }
             }}
             className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all disabled:opacity-50"
             disabled={!title.trim() && !content.trim()}
           >
             Save Note
           </button>
        </div>
      </motion.div>
    </div>
  );
}

function ReminderForm({ onSave, onClose }: { onSave: (text: string, time: number) => void, onClose: () => void }) {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h3 className="text-xl font-bold mb-6">Schedule Reminder</h3>
        <div className="space-y-4">
           <div className="space-y-2">
             <label className="text-xs font-bold uppercase text-gray-400">What should we remind you about?</label>
             <input 
               type="text" 
               value={text} 
               onChange={(e) => setText(e.target.value)}
               className="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
               placeholder="e.g. Call Mom"
             />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-gray-400">Date</label>
               <input 
                 type="date" 
                 value={date} 
                 onChange={(e) => setDate(e.target.value)}
                 className="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-indigo-500"
               />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-gray-400">Time</label>
               <input 
                 type="time" 
                 value={time} 
                 onChange={(e) => setTime(e.target.value)}
                 className="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-indigo-500"
               />
             </div>
           </div>
        </div>
        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-xl font-bold">Cancel</button>
          <button 
           onClick={() => {
            if (text && date && time) {
              const scheduleTime = new Date(`${date}T${time}`).getTime();
              onSave(text, scheduleTime);
            }
           }} 
           className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg"
          >
            Set Reminder
          </button>
        </div>
      </div>
    </div>
  );
}

function TodoForm({ onSave, onClose }: { onSave: (text: string) => void, onClose: () => void }) {
  const [text, setText] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h3 className="text-xl font-bold mb-6">New Task</h3>
        <input 
           type="text" 
           autoFocus
           value={text} 
           onChange={(e) => setText(e.target.value)}
           onKeyDown={(e) => e.key === 'Enter' && text && onSave(text)}
           className="w-full px-4 py-4 bg-gray-50 border-gray-100 rounded-xl focus:ring-indigo-500 text-lg"
           placeholder="Task description..."
        />
        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-xl font-bold">Cancel</button>
          <button 
           onClick={() => text && onSave(text)} 
           className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

function HtmlEditorModal({ snippet, onSave, onClose }: { snippet: HtmlSnippet, onSave: (snippet: Partial<HtmlSnippet>) => void, onClose: () => void }) {
  const [name, setName] = useState(snippet.name);
  const [code, setCode] = useState(snippet.code);
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col">
       <header className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent text-white font-mono border-none focus:ring-0 p-0 text-sm"
              placeholder="snippet_name.html"
            />
            <div className="flex bg-gray-800 rounded-lg p-1">
               <button onClick={() => setIsPreview(false)} className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${!isPreview ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>EDITOR</button>
               <button onClick={() => setIsPreview(true)} className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${isPreview ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>PREVIEW</button>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => onSave({ name: name.trim() || 'untitled', code })} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg">SAVE</button>
             <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><X /></button>
          </div>
       </header>

       <main className="flex-grow flex flex-col md:flex-row bg-black relative">
          {!isPreview ? (
            <>
              <textarea 
                autoFocus
                className="flex-grow bg-black text-indigo-400 font-mono p-6 resize-none focus:ring-0 border-none text-sm selection:bg-indigo-500/30"
                spellCheck={false}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="<!-- Write your HTML here -->"
              />
              <button 
                onClick={() => onSave({ name: name.trim() || 'untitled', code })}
                className="absolute bottom-8 right-8 bg-indigo-600 text-white flex items-center gap-2 px-8 py-4 rounded-2xl font-bold shadow-2xl hover:bg-indigo-500 active:scale-95 transition-all z-50 uppercase tracking-wider text-xs"
              >
                <CheckCircle className="w-5 h-5" />
                Save Snippet
              </button>
            </>
          ) : (
            <div className="flex-grow bg-white m-4 rounded-xl overflow-hidden shadow-2xl">
               <iframe 
                 srcDoc={code}
                 title="Preview"
                 className="w-full h-full border-none"
                 sandbox="allow-scripts"
               />
            </div>
          )}
       </main>
    </div>
  );
}
