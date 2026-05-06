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
  Check,
  Sun,
  Moon,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Note, Reminder, Todo, HtmlSnippet, AppSettings } from './types';

// Components (will be defined below or moved to separate files if needed)
export default function App() {
  const [activeTab, setActiveTab] = useState<'notes' | 'reminder' | 'todo' | 'html' | 'settings'>('notes');
  
  // Navigation helper
  const navigateTo = (tab: 'notes' | 'reminder' | 'todo' | 'html' | 'settings') => {
    setActiveTab(tab);
  };
  
  // Persistence
  const [notes, setNotes] = useState<Note[]>(() => JSON.parse(localStorage.getItem('notes') || '[]'));
  const [reminders, setReminders] = useState<Reminder[]>(() => JSON.parse(localStorage.getItem('reminders') || '[]'));
  const [todos, setTodos] = useState<Todo[]>(() => JSON.parse(localStorage.getItem('todos') || '[]'));
  const [htmlSnippets, setHtmlSnippets] = useState<HtmlSnippet[]>(() => JSON.parse(localStorage.getItem('htmlSnippets') || '[]'));
  const [settings, setSettings] = useState<AppSettings>(() => JSON.parse(localStorage.getItem('settings') || '{"fontStyle": "font-sans", "theme": "light"}'));

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

  // Reminder Alert System & Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      reminders.forEach(r => {
        if (!r.isCompleted && r.time <= now) {
          // Trigger Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const showSystemNotification = async () => {
              const reg = await navigator.serviceWorker.ready;
              reg.showNotification('QuiqNote Reminder', {
                body: r.text,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                vibrate: [200, 100, 200],
                tag: r.id,
                requireInteraction: true
              });
            };
            showSystemNotification();
          } else {
            alert(`Reminder: ${r.text}`);
          }
          
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
        // Push state back so we can catch the next back button
        window.history.pushState({ depth: 1 }, '');
        return;
      }

      // If we are not on the notes tab, go to notes tab
      if (activeTab !== 'notes') {
        setActiveTab('notes');
        // Push state back so we can catch the next back button
        window.history.pushState({ depth: 1 }, '');
        return;
      }

      // If we are on the notes tab and no modals are open, attempt to "close"
      // Browser logic: window.close() usually only works for windows opened by script.
      window.close();
      // If close() is blocked or fails, we push state again so the user can try again
      window.history.pushState({ depth: 1 }, '');
    };

    window.addEventListener('popstate', handlePopState);
    
    // Always ensure there is a state in history so the back button triggers popstate
    window.history.pushState({ depth: 1 }, '');

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
    'bg-amber-100 border-amber-300',
    'bg-sky-100 border-sky-300',
    'bg-rose-100 border-rose-300',
    'bg-emerald-100 border-emerald-300',
    'bg-purple-100 border-purple-300',
    'bg-indigo-100 border-indigo-300',
    'bg-teal-100 border-teal-300'
  ];

  const fontFamilies = [
    { name: 'Sans', class: 'font-sans' },
    { name: 'Serif', class: 'font-serif' },
    { name: 'Mono', class: 'font-mono' }
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
    <div className={`min-h-screen flex flex-col md:flex-row ${settings.fontStyle} ${settings.theme === 'dark' ? 'bg-slate-950 text-slate-100 dark' : 'bg-[#f8fafc] text-slate-800'}`}>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className={`bg-transparent flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 ${activeTab === 'notes' ? 'p-8' : 'h-0 p-0 overflow-hidden md:h-8'}`}>
          {activeTab === 'notes' && (
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold tracking-tight text-indigo-900 dark:text-indigo-400">QuiqNote</h1>
              <div className="hidden md:block h-6 w-[1px] bg-slate-300 dark:bg-slate-700"></div>
            </div>
          )}

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
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 text-[10px] font-bold tracking-tighter shrink-0">
                  <button 
                    onClick={() => setShowImportantOnly(false)}
                    className={`px-3 py-1.5 rounded-full transition-all ${!showImportantOnly ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200' : 'text-slate-400'}`}
                  >
                    ALL
                  </button>
                  <button 
                    onClick={() => setShowImportantOnly(true)}
                    className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${showImportantOnly ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300' : 'text-slate-400'}`}
                  >
                    <AlertCircle className={`w-3 h-3 ${showImportantOnly ? 'fill-rose-100 dark:fill-rose-900' : ''}`} />
                    IMPORTANT
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className={`flex-grow transition-all duration-300 ${activeTab === 'notes' ? 'p-8 pb-32' : 'p-4 md:p-8 pb-32'}`}>
          <AnimatePresence mode="wait">
            {activeTab === 'notes' && (
              <motion.div 
                key="notes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* FAB is now at the end of the notes container to ensure z-index and visibility */}
                <button 
                  onClick={() => setEditingNote({ id: '', title: '', content: '', isImportant: false, color: colors[0], createdAt: Date.now() })}
                  className="fixed bottom-24 right-8 md:bottom-28 md:right-12 w-16 h-16 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full shadow-[0_10px_30px_rgba(79,70,229,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
                  title="Add Note"
                >
                  <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      className={`${note.color} dark:bg-slate-900 dark:border-slate-800 p-6 rounded-2xl shadow-sm border cursor-pointer relative group flex flex-col h-48 overflow-hidden transition-transform duration-200`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="flex items-center text-[10px] font-bold uppercase tracking-wider opacity-70">
                          {note.isImportant && <span className="important-dot mr-1" />}
                          {note.isImportant ? 'Important' : 'Regular'}
                        </span>
                        <span className="text-[10px] opacity-70 uppercase tracking-widest">{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-slate-950 dark:text-white truncate pr-6">{note.title}</h3>
                      <p className="text-sm text-slate-800 dark:text-slate-200 flex-1 overflow-hidden whitespace-pre-wrap">{note.content}</p>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (window.confirm('Delete this note?')) {
                            deleteNote(note.id); 
                          }
                        }}
                        type="button"
                        className="absolute bottom-4 right-4 p-2 bg-white/80 hover:bg-white/90 md:opacity-0 md:group-hover:opacity-100 rounded-full transition-all duration-200 z-20 shadow-sm border border-black/5"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </motion.div>
                  ))
                )}
                </div>
              </motion.div>
            )}

            {activeTab === 'reminder' && (
              <motion.div 
                key="reminder"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-400">Reminders</h2>
                  <button 
                    onClick={() => setIsAddingReminder(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all font-bold text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Reminder
                  </button>
                </div>
                {reminders.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No reminders scheduled.</p>
                  </div>
                ) : (
                  reminders.sort((a,b) => a.time - b.time).map(r => (
                    <div key={r.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-xl ${r.isCompleted ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300'}`}>
                          <Bell className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={`text-lg font-bold text-slate-900 dark:text-slate-100 ${r.isCompleted ? 'line-through opacity-50' : ''}`}>{r.text}</p>
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
                        className="p-3 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors z-20"
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
                className="max-w-2xl mx-auto space-y-8"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-400">Task List</h2>
                  <button 
                    onClick={() => setIsAddingTodo(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition-all font-bold text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Task
                  </button>
                </div>
                {todos.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No tasks yet.</p>
                  </div>
                ) : (
                  todos.map(t => (
                    <div key={t.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm group hover:shadow-md transition-all">
                      <div className="flex items-center gap-6 flex-grow">
                        <button 
                          onClick={() => toggleTodo(t.id)}
                          className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${t.isCompleted ? 'bg-purple-600 border-purple-600 shadow-lg shadow-purple-200' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                           {t.isCompleted && <CheckSquare className="w-5 h-5 text-white" />}
                        </button>
                        <p className={`text-lg font-medium text-slate-800 dark:text-slate-200 ${t.isCompleted ? 'line-through opacity-40' : ''}`}>{t.text}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this task?')) {
                            deleteTodo(t.id);
                          }
                        }} 
                        type="button"
                        className="p-3 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 z-20"
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
                className="max-w-6xl mx-auto space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-400">HTML Editor</h2>
                  <button 
                    onClick={() => setEditingHtml({ id:'', name:'', code:'', createdAt: Date.now() })}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-all font-bold text-sm border border-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                    New Snippet
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </div>
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
                  <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-400">Interface Settings</h2>
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <section>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Font Style</label>
                      <div className="grid grid-cols-3 gap-3">
                        {fontFamilies.map(f => (
                          <button 
                            key={f.class} 
                            onClick={() => setSettings({...settings, fontStyle: f.class})}
                            className={`py-3 px-4 rounded-xl border transition-all text-sm font-medium ${settings.fontStyle === f.class ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </section>
                    <section>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Theme</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setSettings({...settings, theme: 'light'})}
                          className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all text-sm font-medium ${settings.theme === 'light' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                        >
                          <Sun className="w-4 h-4" />
                          Light
                        </button>
                        <button 
                          onClick={() => setSettings({...settings, theme: 'dark'})}
                          className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all text-sm font-medium ${settings.theme === 'dark' ? 'border-indigo-600 bg-slate-800 dark:bg-indigo-900 text-white dark:text-indigo-100' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                        >
                          <Moon className="w-4 h-4" />
                          Dark
                        </button>
                      </div>
                    </section>
                  </div>
                </div>

                <div className="w-full md:w-80 space-y-6">
                  <section className="bg-indigo-50 dark:bg-indigo-950/40 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 text-lg">About App</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl">
                        <span className="text-slate-500 dark:text-slate-400">Developer</span>
                        <span className="font-bold text-indigo-900 dark:text-indigo-200 text-right">Doh-Nani Fredrick Senyo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl">
                        <span className="text-slate-500 dark:text-slate-400">Email</span>
                        <span className="font-bold text-indigo-900 dark:text-indigo-200 text-right overflow-hidden text-[10px] ml-4">dohnanifrederick2@gmail.com</span>
                      </div>
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl">
                        <span className="text-slate-500 dark:text-slate-400">Country</span>
                        <span className="font-bold text-indigo-900 dark:text-indigo-200 text-right">Ghana 🇬🇭</span>
                      </div>
                    </div>
                  </section>
                  <div className="text-center text-[10px] text-slate-400 font-medium">Version v1.0.4 • Built with Precision</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>


      <nav className="fixed bottom-0 left-0 right-0 glass h-20 flex items-center justify-evenly max-w-4xl mx-auto md:rounded-t-3xl border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50 px-4">
        <NavButton label="Notes" active={activeTab === 'notes'} icon={<StickyNote className="w-5 h-5 md:w-6 md:h-6" />} onClick={() => setActiveTab('notes')} />
        <NavButton label="Reminder" active={activeTab === 'reminder'} icon={<Bell className="w-5 h-5 md:w-6 md:h-6" />} onClick={() => setActiveTab('reminder')} />
        <NavButton label="Editor" active={activeTab === 'html'} icon={<Code className="w-5 h-5 md:w-6 md:h-6" />} onClick={() => setActiveTab('html')} />
        <NavButton label="Tasks" active={activeTab === 'todo'} icon={<CheckSquare className="w-5 h-5 md:w-6 md:h-6" />} onClick={() => setActiveTab('todo')} />
        <NavButton label="Settings" active={activeTab === 'settings'} icon={<SettingsIcon className="w-5 h-5 md:w-6 md:h-6" />} onClick={() => setActiveTab('settings')} />
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

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
      <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-1 rounded-2xl transition-all ${active ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
      >
      {icon}
      <span className={`text-[10px] mt-1 font-medium ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    </button>
  );
}

function NoteEditor({ note, colors, onSave, onClose }: { note: Note, colors: string[], onSave: (note: Partial<Note>) => void, onClose: () => void }) {
  const [title, setTitle] = useState(note.title === 'Untitled' ? '' : note.title);
  const [content, setContent] = useState(note.content);
  const [isImportant, setIsImportant] = useState(note.isImportant);
  const [color, setColor] = useState(note.color);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className={`fixed inset-0 ${color} z-[100] flex flex-col p-6 md:p-12 overflow-y-auto dark:bg-slate-950 dark:text-slate-100`}
    >
        <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
          <input 
            type="text" 
            autoFocus
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="text-2xl md:text-3xl font-bold bg-transparent border-none focus:ring-0 mb-6 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-950 dark:text-white"
          />

          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            className="flex-grow bg-transparent border-none focus:ring-0 resize-none text-lg min-h-[400px] placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 leading-relaxed"
          />

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 border-t border-black/10 dark:border-white/10 pt-10 mb-20">
             <div className="flex items-center gap-6">
                <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-xl transition-all">
                   <X className="w-5 h-5 dark:text-indigo-400" />
                </button>
                <div className="flex gap-1.5">
                   {colors.map(c => (
                     <button 
                       key={c}
                       onClick={() => setColor(c)}
                       className={`w-4 h-4 rounded-full border border-black/10 dark:border-white/20 ${c} ${color === c ? 'scale-125 ring-1 ring-indigo-500 shadow-sm' : 'hover:scale-110 transition-transform'}`}
                     />
                   ))}
                </div>
             </div>

             <div className="flex items-center">
                <label className="flex items-center gap-4 cursor-pointer group select-none">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={isImportant} 
                      onChange={(e) => setIsImportant(e.target.checked)} 
                    />
                    <div className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-full transition-all duration-300 peer-checked:bg-rose-500"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 peer-checked:translate-x-6 flex items-center justify-center">
                      <Star className={`w-2 h-2 transition-all duration-300 ${isImportant ? 'text-rose-500 scale-110 fill-rose-500' : 'text-slate-300 scale-0'}`} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Important</span>
                  </div>
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
               className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50"
               disabled={!title.trim() && !content.trim()}
             >
               Save Note
             </button>
          </div>
          
          <div className="flex justify-center -mt-12 mb-10">
             <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">Autosaved to Local Storage</p>
          </div>
        </div>
    </motion.div>
  );
}

function ReminderForm({ onSave, onClose }: { onSave: (text: string, time: number) => void, onClose: () => void }) {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-transparent dark:border-slate-800">
        <h3 className="text-xl font-bold mb-6 dark:text-white">Schedule Reminder</h3>
        <div className="space-y-4">
           <div className="space-y-2">
             <label className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">What should we remind you about?</label>
             <input 
               type="text" 
               value={text} 
               onChange={(e) => setText(e.target.value)}
               className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 dark:text-white dark:placeholder:text-slate-500"
               placeholder="e.g. Call Mom"
             />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Date</label>
               <input 
                 type="date" 
                 value={date} 
                 onChange={(e) => setDate(e.target.value)}
                 className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 rounded-xl focus:ring-indigo-500 dark:text-white"
               />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Time</label>
               <input 
                 type="time" 
                 value={time} 
                 onChange={(e) => setTime(e.target.value)}
                 className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 rounded-xl focus:ring-indigo-500 dark:text-white"
               />
             </div>
           </div>
        </div>
        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-200 rounded-xl font-bold">Cancel</button>
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-transparent dark:border-slate-800">
        <h3 className="text-xl font-bold mb-6 dark:text-white">New Task</h3>
        <input 
           type="text" 
           autoFocus
           value={text} 
           onChange={(e) => setText(e.target.value)}
           onKeyDown={(e) => e.key === 'Enter' && text && onSave(text)}
           className="w-full px-4 py-4 bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 rounded-xl focus:ring-indigo-500 text-lg dark:text-white dark:placeholder:text-slate-500"
           placeholder="Task description..."
        />
        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-200 rounded-xl font-bold">Cancel</button>
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
    <motion.div 
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      className="fixed inset-0 bg-black z-[100] flex flex-col"
    >
       <header className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent text-white font-mono border-none focus:ring-0 p-0 text-sm placeholder:text-slate-400"
              placeholder="snippet_name.html"
            />
          </div>
          <div className="flex bg-slate-800 rounded-lg p-1">
             <button onClick={() => setIsPreview(false)} className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${!isPreview ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>EDITOR</button>
             <button onClick={() => setIsPreview(true)} className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${isPreview ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>PREVIEW</button>
          </div>
        <div className="flex gap-4">
           <button onClick={() => onSave({ name: name.trim() || 'untitled', code })} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-indigo-500 transition-colors">SAVE</button>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors"><X /></button>
        </div>
     </header>

     <main className="flex-grow flex flex-col md:flex-row bg-slate-950 relative">
        {!isPreview ? (
          <>
            <textarea 
              autoFocus
              className="flex-grow bg-slate-950 text-indigo-300 font-mono p-8 resize-none focus:ring-0 border-none text-base selection:bg-indigo-500/40"
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
    </motion.div>
  );
}
