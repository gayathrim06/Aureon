import React, { useState, useEffect, useRef } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeaders, API_BASE_URL } from '../../services/apiClient';
import {
  Send, Hash, Users, FolderKanban, MessageSquare,
  AlertTriangle, Code, CheckCircle2, RefreshCw, Search,
  Terminal, Trash2, Shield, User, ChevronRight, Activity, ArrowUpRight,
  Copy, Check, FileCode, CheckSquare, ListTodo
} from 'lucide-react';

export const LeadTeamChat = ({ onShowToast, onNavigate }) => {
  const { user } = useAuth();
  const currentUserId = user?.id ? String(user.id) : null;
  const currentUserName = user?.name || user?.full_name || user?.username || 'Team Lead';
  const currentUserRole = user?.role_name || user?.role || 'ROLE_LEAD';

  // Navigation / Channel Selection State
  const [activeChannelId, setActiveChannelId] = useState('general');
  const [activeChannelObj, setActiveChannelObj] = useState(null);

  // Data States
  const [channelsData, setChannelsData] = useState({
    general_channel: { id: 'general', name: 'General Engineering', type: 'GENERAL' },
    project_channels: [],
    direct_contacts: []
  });
  const [messages, setMessages] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  // Search & Filter State
  const [searchFilter, setSearchFilter] = useState('');

  // Input State
  const [inputMessage, setInputMessage] = useState('');
  const [messageType, setMessageType] = useState('TEXT'); // TEXT, CODE, ALERT
  const [codeLang, setCodeLang] = useState('javascript');

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // ─── Fetch Channels Directory ──────────────────────────────
  const fetchChannels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/channels`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const generalChan = data.general_channel || { id: 'general', name: 'General Engineering', type: 'GENERAL' };
        
        setChannelsData({
          general_channel: generalChan,
          project_channels: data.project_channels || [],
          direct_contacts: data.direct_contacts || []
        });

        // Initialize active channel object
        if (!activeChannelObj) {
          setActiveChannelObj(generalChan);
        }
      }
    } catch (err) {
      console.error('[LEAD CHAT] Channels fetch error:', err);
    } finally {
      setLoadingChannels(false);
    }
  };

  // ─── Fetch Messages for Active Channel ─────────────────────
  const fetchMessages = async (silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/messages?channel_id=${encodeURIComponent(activeChannelId)}&limit=100`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('[LEAD CHAT] Messages fetch error:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (activeChannelId) {
      fetchMessages(false);
    }

    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      fetchMessages(true);
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeChannelId]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  // ─── Send Message ──────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const payload = {
      channel_id: activeChannelId,
      channel_type: activeChannelObj?.type || (activeChannelId.startsWith('dm-') ? 'DIRECT' : 'PROJECT'),
      content: inputMessage.trim(),
      message_type: messageType,
      code_language: messageType === 'CODE' ? codeLang : null
    };

    if (activeChannelId.startsWith('dm-') && activeChannelObj?.recipient_id) {
      payload.recipient_id = activeChannelObj.recipient_id;
    }

    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
        }
        setInputMessage('');
        setMessageType('TEXT');
      } else {
        const errData = await res.json();
        if (onShowToast) onShowToast({ type: 'error', title: 'Send Failed', message: errData.message || 'Could not send message.' });
      }
    } catch (err) {
      console.error('[LEAD CHAT] Send error:', err);
      if (onShowToast) onShowToast({ type: 'error', title: 'Network Error', message: 'Failed to communicate with chat service.' });
    } finally {
      setIsSending(false);
      setTimeout(() => scrollToBottom(true), 100);
    }
  };

  // ─── Delete Message ────────────────────────────────────────
  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/messages/${msgId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        if (onShowToast) onShowToast({ type: 'success', title: 'Message Deleted', message: 'Message removed from chat stream.' });
      }
    } catch (err) {
      console.error('[LEAD CHAT] Delete error:', err);
    }
  };

  // ─── Copy Code Snippet ─────────────────────────────────────
  const handleCopyCode = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // ─── Filter Channels by Search ─────────────────────────────
  const filteredProjects = channelsData.project_channels.filter(p =>
    (p.name || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredContacts = channelsData.direct_contacts.filter(c =>
    (c.name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.role || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      {/* ─── Breadcrumb & Top Bar ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Breadcrumb items={[{ label: 'Team Lead Workspace' }, { label: 'Team Chat' }]} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchChannels();
              fetchMessages(false);
            }}
            disabled={loadingChannels || loadingMessages}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? 'animate-spin text-indigo-500' : ''}`} />
            <span>Sync Messages</span>
          </button>
        </div>
      </div>

      {/* ─── Header Governance Card (Theme High Contrast) ────── */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] uppercase font-bold border border-indigo-200 dark:border-indigo-800/60">
              Team Lead Coordination Hub
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              • Real-Time Squad & Developer Communication
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white warm:text-[#342314] tracking-tight mt-1">
            Engineering Squad Collaboration
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 warm:text-[#5a432b] mt-0.5 max-w-xl">
            Direct communication channels for sprint allocation, code reviews, and cross-team delivery.
          </p>
        </div>
      </div>

      {/* ─── Main Chat Split Layout ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-210px)] min-h-[580px]">
        {/* ─── Left Sidebar: Channels & Contacts Directory ─── */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          {/* Search Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search channels, devs, leads..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Channels & Direct Contacts Scroll Area */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
            {/* 1. Engineering General */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Company Engineering
              </div>
              <button
                onClick={() => {
                  setActiveChannelId('general');
                  setActiveChannelObj(channelsData.general_channel);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeChannelId === 'general'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 font-bold text-xs">
                    #
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">General Engineering</div>
                    <div className="text-[10px] text-slate-400 truncate">Entire dev team broadcast</div>
                  </div>
                </div>
              </button>
            </div>

            {/* 2. Project Dedicated Channels */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Project Channels</span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">
                  {filteredProjects.length}
                </span>
              </div>
              <div className="space-y-1 mt-1">
                {filteredProjects.map((p) => {
                  const isActive = activeChannelId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveChannelId(p.id);
                        setActiveChannelObj(p);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
                          <FolderKanban className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {p.open_tasks} active tasks
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Direct Contacts */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Team Members</span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">
                  {filteredContacts.length}
                </span>
              </div>
              <div className="space-y-1 mt-1">
                {filteredContacts.map((contact) => {
                  const channelKey = contact.dm_channel_id || `dm-${contact.id}`;
                  const isActive = activeChannelId === channelKey;
                  return (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setActiveChannelId(channelKey);
                        setActiveChannelObj({
                          id: channelKey,
                          name: contact.name,
                          type: 'DIRECT',
                          recipient_id: contact.id,
                          role: contact.role
                        });
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{contact.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{contact.role}</div>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Available"></span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Panel: Active Channel Messages & Input ── */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          {/* Header of Active Channel */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                {activeChannelId === 'general' ? (
                  <Hash className="w-5 h-5" />
                ) : activeChannelId.startsWith('dm-') ? (
                  <User className="w-5 h-5" />
                ) : (
                  <FolderKanban className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {activeChannelObj?.name || 'General Engineering'}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                    {activeChannelId.startsWith('dm-') ? 'Direct Message' : 'Team Channel'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeChannelId === 'general'
                    ? 'Broadcast channel for all registered engineering team members'
                    : activeChannelId.startsWith('dm-')
                    ? `Direct 1-on-1 discussion with ${activeChannelObj?.name}`
                    : `Project discussion & deliverable updates for ${activeChannelObj?.name}`}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30 dark:bg-slate-950/20">
            {loadingMessages && messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Loading messages from database...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Messages Yet</h4>
                <p className="text-xs max-w-sm mt-1">
                  Start the sprint discussion, share code snippets, or synchronize tasks with the team!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = currentUserId && String(msg.sender_id) === String(currentUserId);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 group ${isMine ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isMine
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}>
                      {msg.sender_name?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    {/* Message Bubble Container */}
                    <div className={`max-w-[80%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {/* Sender Meta Header */}
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {isMine ? 'You' : msg.sender_name}
                        </span>
                        <span>•</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Content Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl shadow-xs text-xs relative ${
                          isMine
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-tl-none'
                        }`}
                      >
                        {msg.message_type === 'CODE' ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] pb-1 border-b border-white/20 font-mono">
                              <span>Code Snippet ({msg.code_language || 'text'})</span>
                              <button
                                onClick={() => handleCopyCode(msg.content, msg.id)}
                                className="cursor-pointer inline-flex items-center gap-1 hover:underline"
                              >
                                {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                                {copiedMsgId === msg.id ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre className="font-mono text-[11px] overflow-x-auto p-2 bg-black/40 rounded-lg whitespace-pre-wrap">
                              {msg.content}
                            </pre>
                          </div>
                        ) : msg.message_type === 'ALERT' ? (
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block text-[11px] uppercase tracking-wider mb-0.5">Engineering Notice:</strong>
                              <span className="whitespace-pre-wrap">{msg.content}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                      </div>

                      {/* Delete Action Button for My Messages */}
                      {isMine && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="cursor-pointer text-[10px] text-slate-400 hover:text-rose-500 flex items-center gap-1"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer Form */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Mode Selector */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMessageType('TEXT')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    messageType === 'TEXT'
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType('CODE')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    messageType === 'CODE'
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Code className="w-3 h-3" /> Code Snippet
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType('ALERT')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    messageType === 'ALERT'
                      ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" /> Alert
                </button>
              </div>

              {messageType === 'CODE' && (
                <select
                  value={codeLang}
                  onChange={(e) => setCodeLang(e.target.value)}
                  className="text-[10px] bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-0.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="sql">SQL / PostgreSQL</option>
                  <option value="json">JSON</option>
                  <option value="html">HTML / JSX</option>
                </select>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                <textarea
                  rows={messageType === 'CODE' ? 3 : 1}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && messageType !== 'CODE') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    messageType === 'CODE'
                      ? 'Paste code snippet here...'
                      : messageType === 'ALERT'
                      ? 'Type urgent engineering blocker or release warning...'
                      : `Message ${activeChannelObj?.name || 'General Engineering'}...`
                  }
                  className="w-full px-3 py-2 text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="cursor-pointer p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold transition-all shadow-sm active:scale-95 shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
