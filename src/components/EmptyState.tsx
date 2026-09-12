import React from 'react';
import { Terminal, Code, Cpu, Sparkles, MessageSquareQuote } from 'lucide-react';
import { GroksonEmblem } from './GroksonLogo';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  model: string;
}

const STARTER_PROMPTS = [
  {
    icon: Code,
    category: 'CODE GENERATION',
    title: 'Написание чистого кода',
    desc: 'Создай модуль аутентификации на TypeScript с обработкой ошибок и валидацией',
    prompt: 'Напиши чистый, типобезопасный модуль на TypeScript с детальными комментариями и валидацией.',
  },
  {
    icon: Cpu,
    category: 'DEEP LOGIC',
    title: 'Системная архитектура',
    desc: 'Сравни архитектурные паттерны микросервисов и монолита для высоконагруженных систем',
    prompt: 'Проанализируй плюсы и минусы перехода с монолита на микросервисы для масштабируемого веб-сервиса.',
  },
  {
    icon: MessageSquareQuote,
    category: 'CREATIVE SYNTHESIS',
    title: 'Редактор и анализ',
    desc: 'Отредактируй текст, устрани канцеляризмы и сделай тон убедительным',
    prompt: 'Помоги улучшить текст: сделай его кристально ясным, убедительным и без воды.',
  },
  {
    icon: Terminal,
    category: 'AUTOMATION',
    title: 'Командные сценарии',
    desc: 'Составь bash-скрипт для мониторинга ресурсов сервера и оповещений',
    prompt: 'Напиши эффективный bash-скрипт для мониторинга загрузки CPU и памяти сервера с логированием.',
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPrompt, model }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto w-full select-none">
      {/* Centered GROKSON Emblem identical to image */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <GroksonEmblem className="w-full h-full text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]" />
          </div>
        </div>

        {/* Wordmark from image */}
        <h1
          className="text-2xl sm:text-3xl font-black text-white uppercase mt-4 tracking-[0.45em] sm:tracking-[0.55em] pl-[0.5em]"
          style={{ fontFamily: "'Michroma', 'Orbitron', monospace" }}
        >
          GROKSON
        </h1>

        <div className="flex items-center gap-2 mt-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <p className="text-xs font-mono tracking-widest uppercase text-neutral-400">
            SYSTEM ONLINE // CORE: {model}
          </p>
        </div>

        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-[10px] font-mono tracking-wider text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>БЕСПЛАТНЫЙ ГРАНТ: 10 000 ТОКЕНОВ</span>
        </div>
      </div>

      {/* Suggested prompts grid in Grokson minimalist aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left max-w-2xl">
        {STARTER_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              id={`starter-prompt-${idx}`}
              onClick={() => onSelectPrompt(item.prompt)}
              className="p-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-900/90 border border-neutral-800/80 hover:border-neutral-600 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono tracking-wider text-neutral-400 group-hover:text-neutral-300">
                  {item.category}
                </span>
                <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xs font-semibold text-neutral-200 group-hover:text-white mb-1">
                {item.title}
              </h3>
              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed font-sans">
                {item.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
