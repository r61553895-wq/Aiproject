import React, { useState, useEffect, useRef } from 'react';
import {
  PanelLeft,
  Settings,
  Coins,
  Share2,
  Trash2,
  Zap,
} from 'lucide-react';
import { ChatSession, ChatMessage, AppSettings, GigaChatModel } from './types';
import { fetchModels, streamChatCompletion } from './services/api';
import { Sidebar } from './components/Sidebar';
import { ChatMessageItem } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { SettingsModal } from './components/SettingsModal';
import { BalanceModal } from './components/BalanceModal';
import { DonateModal } from './components/DonateModal';
import { GroksonLogo } from './components/GroksonLogo';
import { AuthButton } from './components/AuthButton';
import { calculateTokensUsage, getModelTier } from './utils/modelRates';
import {
  auth,
  onAuthStateChanged,
  syncUserProfile,
  saveUserTokenBalance,
  User,
} from './services/firebase';

const DEFAULT_SETTINGS: AppSettings = {
  model: 'GigaChat',
  temperature: 0.7,
  systemPrompt: '',
  customAuthKey: '',
};

const createNewSession = (model: string): ChatSession => ({
  id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  title: 'Новый диалог',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  model,
  systemPrompt: '',
  temperature: 0.7,
});

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('grokson_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [createNewSession('GigaChat')];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || '';
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('grokson_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [models, setModels] = useState<GigaChatModel[]>([
    { id: 'GigaChat', description: 'GROKSON Core — быстрый универсальный интеллект' },
    { id: 'GigaChat-Pro', description: 'GROKSON Pro — углубленный логический анализ' },
    { id: 'GigaChat-Max', description: 'GROKSON Max — максимальная мощность синтеза' },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBalanceOpen, setIsBalanceOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Free 10,000 initial tokens grant
  const [tokenBalance, setTokenBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('grokson_token_balance');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return 10_000;
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          setCurrentUser(user);
          setIsAuthLoading(false);
          if (user) {
            try {
              const syncedTokens = await syncUserProfile(user, tokenBalance);
              setTokenBalance(syncedTokens);
            } catch (err) {
              console.error('Error syncing profile:', err);
            }
          }
        },
        (error) => {
          console.error('Firebase Auth listener error:', error);
          setIsAuthLoading(false);
        }
      );
    } catch (err) {
      console.error('Failed to initialize Firebase Auth listener:', err);
      setIsAuthLoading(false);
    }
    return () => unsubscribe();
  }, []);

  // Sync token balance to localStorage & Firestore
  useEffect(() => {
    try {
      localStorage.setItem('grokson_token_balance', String(tokenBalance));
      if (currentUser) {
        saveUserTokenBalance(currentUser.uid, tokenBalance);
      }
    } catch (e) {
      console.error('Failed to save token balance:', e);
    }
  }, [tokenBalance, currentUser]);

  const handleAddTokens = (amount: number, tierTitle?: string) => {
    setTokenBalance((prev) => {
      const updated = prev + amount;
      return updated;
    });
  };

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('grokson_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }, [sessions]);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('grokson_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  // Load models on mount or when custom key or api url changes
  useEffect(() => {
    fetchModels(settings.customAuthKey, settings.customApiUrl)
      .then((data) => {
        if (data && data.length > 0) {
          setModels(data);
        }
      })
      .catch((e) => console.warn('Could not load models list:', e));
  }, [settings.customAuthKey, settings.customApiUrl]);

  // Active session
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || createNewSession(settings.model);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(isLoading ? 'auto' : 'smooth');
  }, [activeSession.messages.length, isLoading]);

  // Handle new chat creation
  const handleNewChat = () => {
    const newSession = createNewSession(settings.model);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  // Handle delete session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh = createNewSession(settings.model);
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Handle rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Handle model change for active session
  const handleModelChange = (newModel: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, model: newModel } : s))
    );
  };

  // Stop current generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);

    // Mark current streaming message as finished
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          ),
        };
      })
    );
  };

  // Send message
  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() || isLoading) return;

    // Check token balance
    if (tokenBalance <= 0) {
      setIsDonateOpen(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    const assistantMessageId = `msg-${Date.now() + 1}`;
    const assistantMessagePlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      model: activeSession.model || settings.model,
      isStreaming: true,
    };

    const currentMessages = activeSession.messages;
    const isFirstMessage = currentMessages.length === 0;

    // Derive auto title for new sessions
    let newTitle = activeSession.title;
    if (isFirstMessage && activeSession.title === 'Новый диалог') {
      newTitle = textToSend.trim().slice(0, 32) + (textToSend.length > 32 ? '...' : '');
    }

    const updatedSessionMessages = [...currentMessages, userMessage, assistantMessagePlaceholder];

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          title: newTitle,
          updatedAt: Date.now(),
          messages: updatedSessionMessages,
        };
      })
    );

    if (!overridePrompt) {
      setInput('');
    }
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Prepare message history for GigaChat API backend
    const apiMessages = [...currentMessages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await streamChatCompletion({
      messages: apiMessages,
      model: activeSession.model || settings.model,
      temperature: settings.temperature,
      system: settings.systemPrompt || undefined,
      customAuthKey: settings.customAuthKey || undefined,
      customApiUrl: settings.customApiUrl || undefined,
      signal: controller.signal,
      onChunk: (delta: string) => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: m.content + delta }
                  : m
              ),
            };
          })
        );
      },
      onError: (err: string) => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, isStreaming: false, error: err }
                  : m
              ),
            };
          })
        );
        setIsLoading(false);
      },
      onFinish: (fullText: string, rawTokens: number) => {
        const currentModel = activeSession.model || settings.model;
        const usage = calculateTokensUsage(rawTokens, currentModel);

        // Deduct consumed tokens scaled by model power tier
        setTokenBalance((prev) => {
          const nextBal = Math.max(0, prev - usage.tokensToDeduct);
          return nextBal;
        });

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: fullText || m.content,
                      isStreaming: false,
                      tokensUsed: usage.tokensToDeduct,
                      tokensMultiplier: usage.multiplier,
                      baseTokens: usage.baseTokens,
                    }
                  : m
              ),
            };
          })
        );
        setIsLoading(false);
      },
    });
  };

  // Retry last assistant message
  const handleRetry = () => {
    if (isLoading || activeSession.messages.length < 2) return;
    const lastMsg = activeSession.messages[activeSession.messages.length - 1];
    if (lastMsg.role !== 'assistant') return;

    // Remove the last assistant message
    const previousUserMsg = activeSession.messages[activeSession.messages.length - 2];
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          messages: s.messages.slice(0, -1),
        };
      })
    );

    handleSend(previousUserMsg.content);
  };

  // Clear current active chat
  const handleClearChat = () => {
    if (window.confirm('Очистить все сообщения в текущем диалоге?')) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s
        )
      );
    }
  };

  // Export chat as Markdown
  const handleExportChat = () => {
    if (activeSession.messages.length === 0) return;
    let md = `# GROKSON — ${activeSession.title}\n*Экспорт диалога (${new Date().toLocaleString()})*\n\n---\n\n`;
    activeSession.messages.forEach((m) => {
      const author = m.role === 'user' ? 'USER' : 'GROKSON';
      md += `### ${author} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GROKSON_${activeSession.title.replace(/[/\\?%*:|"<>]/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white antialiased font-sans">
      {/* Collapsible Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBalance={() => setIsBalanceOpen(true)}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
        tokenBalance={tokenBalance}
        onOpenDonate={() => setIsDonateOpen(true)}
        currentUser={currentUser}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-black">
        {/* Top Navbar */}
        <header
          id="app-header"
          className="h-14 border-b border-neutral-900 px-4 flex items-center justify-between shrink-0 bg-black/90 backdrop-blur-md z-10 select-none"
        >
          {/* Left: Sidebar toggle + Active title / Logo */}
          <div className="flex items-center gap-3 min-w-0">
            {!isSidebarOpen && (
              <div className="flex items-center gap-3">
                <button
                  id="expand-sidebar-button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                  title="Открыть меню"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
                <GroksonLogo size="sm" showText={false} />
              </div>
            )}

            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
              <h1 className="text-xs sm:text-sm font-semibold truncate text-neutral-100">
                {activeSession.title}
              </h1>
              {(() => {
                const sessionModel = activeSession.model || settings.model;
                const tier = getModelTier(sessionModel);
                return (
                  <span
                    className={`hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${tier.borderClass} ${tier.bgClass} ${tier.colorClass}`}
                    title={tier.description}
                  >
                    <span>{sessionModel}</span>
                    <span className="font-bold">[{tier.badge}]</span>
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-1.5">
            {/* Header Token Balance Badge */}
            <button
              id="header-token-badge"
              onClick={() => setIsDonateOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                tokenBalance <= 0
                  ? 'bg-neutral-950 border border-neutral-700 text-white'
                  : 'bg-black border border-neutral-800 text-white hover:border-neutral-700 hover:bg-neutral-900'
              }`}
              title="Баланс токенов (нажмите для пополнения)"
            >
              <Zap className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="font-semibold">{new Intl.NumberFormat('ru-RU').format(tokenBalance)}</span>
              <span className="text-[10px] text-neutral-400 hidden sm:inline">тк.</span>
              {tokenBalance <= 0 ? (
                <span className="px-1.5 py-0.5 bg-white text-black text-[9px] font-bold rounded uppercase">
                  Пополнить
                </span>
              ) : (
                <span className="text-[9px] font-bold text-neutral-400 uppercase hidden md:inline ml-0.5">
                  +Пополнить
                </span>
              )}
            </button>

            <div className="h-4 w-px bg-neutral-800 mx-0.5 hidden sm:block" />

            <button
              id="export-chat-button"
              onClick={handleExportChat}
              disabled={activeSession.messages.length === 0}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Экспорт в Markdown"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              id="clear-chat-button"
              onClick={handleClearChat}
              disabled={activeSession.messages.length === 0}
              className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Очистить диалог"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              id="header-settings-button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              title="Параметры"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-neutral-800 mx-0.5 hidden sm:block" />

            {/* Google Authentication */}
            <AuthButton
              currentUser={currentUser}
              isLoading={isAuthLoading}
            />
          </div>
        </header>

        {/* Message Feed */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-black">
          {activeSession.messages.length === 0 ? (
            <EmptyState
              onSelectPrompt={(p) => handleSend(p)}
              model={activeSession.model || settings.model}
            />
          ) : (
            <div className="flex-1 py-4 space-y-1">
              {activeSession.messages.map((message, idx) => (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  isLast={idx === activeSession.messages.length - 1}
                  onRetry={handleRetry}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </main>

        {/* Chat Input */}
        <footer className="shrink-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-3">
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => handleSend()}
            onStop={handleStop}
            isLoading={isLoading}
            model={activeSession.model || settings.model}
            onModelChange={handleModelChange}
            modelsList={models}
            tokenBalance={tokenBalance}
            onOpenDonate={() => setIsDonateOpen(true)}
          />
        </footer>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          handleModelChange(newSettings.model);
        }}
        models={models}
      />

      {/* Balance Modal */}
      <BalanceModal
        isOpen={isBalanceOpen}
        onClose={() => setIsBalanceOpen(false)}
        customAuthKey={settings.customAuthKey}
        customApiUrl={settings.customApiUrl}
      />

      {/* Donate & Token Top-Up Modal */}
      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        currentBalance={tokenBalance}
        onAddTokens={handleAddTokens}
      />
    </div>
  );
}
