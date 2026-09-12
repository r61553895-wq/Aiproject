import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Coins,
  Search,
  Check,
  X,
  Edit2,
  PanelLeftClose,
  Zap,
} from 'lucide-react';
import { ChatSession } from '../types';
import { GroksonLogo } from './GroksonLogo';
import { User, signInWithGoogle, signOutUser } from '../services/firebase';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  onOpenBalance: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  tokenBalance: number;
  onOpenDonate: () => void;
  currentUser: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onOpenSettings,
  onOpenBalance,
  isOpen,
  onToggleOpen,
  tokenBalance,
  onOpenDonate,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditingTitle(s.title);
  };

  const saveEditing = (id: string, e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-30 sm:hidden backdrop-blur-xs"
          onClick={onToggleOpen}
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed sm:static inset-y-0 left-0 z-40 flex flex-col h-full bg-black border-r border-neutral-900 transition-all duration-300 ease-in-out ${
          isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full sm:translate-x-0 sm:w-0 overflow-hidden'
        }`}
      >
        {isOpen && (
          <div className="flex flex-col h-full w-72 select-none">
            {/* Logo Brand Header */}
            <div className="px-4 pt-4 pb-3 border-b border-neutral-900 flex items-center justify-between">
              <GroksonLogo size="sm" />
              <button
                id="collapse-sidebar-button"
                onClick={onToggleOpen}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                title="Свернуть меню"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* New chat button */}
            <div className="p-3">
              <button
                id="new-chat-button"
                onClick={onNewChat}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Новый диалог</span>
              </button>
            </div>

            {/* Search */}
            {sessions.length > 2 && (
              <div className="px-3 pb-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    id="search-chats-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск диалогов..."
                    className="w-full bg-neutral-950 text-white text-xs rounded-xl pl-8 pr-3 py-2 border border-neutral-800 focus:outline-none focus:border-neutral-600 placeholder-neutral-400 font-sans"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Session list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                ДИАЛОГИ
              </div>

              {filteredSessions.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-neutral-400">
                  {searchQuery ? 'Ничего не найдено' : 'Нет сохранённых диалогов'}
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  const isEditing = session.id === editingId;

                  return (
                    <div
                      key={session.id}
                      id={`session-item-${session.id}`}
                      onClick={() => !isEditing && onSelectSession(session.id)}
                      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-[#121212] text-white border border-neutral-800 font-medium'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent'
                      }`}
                    >
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1.5 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditing(session.id, e);
                              if (e.key === 'Escape') cancelEditing(e as any);
                            }}
                            autoFocus
                            className="flex-1 bg-black text-white text-xs px-2 py-1 rounded-lg border border-neutral-700 focus:outline-none"
                          />
                          <button
                            onClick={(e) => saveEditing(session.id, e)}
                            className="p-1 hover:text-white text-neutral-400"
                            title="Сохранить"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 hover:text-white text-neutral-400"
                            title="Отмена"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                            <span className="truncate">{session.title}</span>
                          </div>

                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => startEditing(session, e)}
                              className="p-1 rounded text-neutral-400 hover:text-white transition-colors"
                              title="Переименовать"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                              }}
                              className="p-1 rounded text-neutral-400 hover:text-red-400 transition-colors"
                              title="Удалить диалог"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom tools */}
            <div className="p-3 border-t border-neutral-900 space-y-1.5">
              <button
                id="sidebar-donate-button"
                onClick={onOpenDonate}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-white transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-white shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">Пополнить баланс</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-white px-1.5 py-0.5 rounded bg-black border border-neutral-800">
                  {new Intl.NumberFormat('ru-RU').format(tokenBalance)} тк.
                </span>
              </button>

              <button
                id="open-balance-button"
                onClick={onOpenBalance}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-neutral-400" />
                  <span>API Баланс Сбера</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">СБЕР</span>
              </button>

              <button
                id="open-settings-button"
                onClick={onOpenSettings}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Параметры</span>
                </div>
              </button>

              {/* User Account State */}
              <div className="pt-2 border-t border-neutral-900">
                {currentUser ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black border border-neutral-800/80">
                    <div className="flex items-center gap-2 min-w-0">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.displayName || 'Пользователь'}
                          className="w-6 h-6 rounded-full ring-1 ring-neutral-700 object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-neutral-800 text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                          {(currentUser.displayName || currentUser.email || 'U')[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-white truncate">
                          {currentUser.displayName || 'Google Аккаунт'}
                        </div>
                        <div className="text-[9px] text-neutral-400 truncate font-mono">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => signOutUser()}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
                      title="Выйти из аккаунта"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => signInWithGoogle()}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold font-mono uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Войти через Google</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
