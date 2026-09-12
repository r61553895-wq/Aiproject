import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square, Cpu, Zap } from 'lucide-react';
import { getModelTier } from '../utils/modelRates';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  onStop: () => void;
  isLoading: boolean;
  model: string;
  onModelChange: (model: string) => void;
  modelsList: Array<{ id: string; description?: string }>;
  disabled?: boolean;
  tokenBalance: number;
  onOpenDonate: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isLoading,
  model,
  onModelChange,
  modelsList,
  disabled,
  tokenBalance,
  onOpenDonate,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isOutOfTokens = tokenBalance <= 0;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isOutOfTokens) {
        onOpenDonate();
        return;
      }
      if (input.trim() && !isLoading && !disabled) {
        onSend();
      }
    }
  };

  const handleSendClick = () => {
    if (isOutOfTokens) {
      onOpenDonate();
      return;
    }
    onSend();
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('ru-RU').format(num);

  const activeTier = getModelTier(model);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Low or zero tokens alert banner */}
      {isOutOfTokens && (
        <div className="mb-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-neutral-300">
            <Zap className="w-4 h-4 text-white shrink-0" />
            <span className="font-mono text-[11px]">
              Бесплатные токены (10 000) исчерпаны. Для продолжения диалога пополните баланс.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenDonate}
            className="px-3 py-1 bg-white text-black font-semibold font-mono text-[11px] uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-colors shrink-0 ml-2"
          >
            Донат / Пополнить
          </button>
        </div>
      )}

      <div className={`relative rounded-2xl border transition-all ${
        isOutOfTokens
          ? 'border-neutral-800 bg-[#080808]'
          : 'border-neutral-800 bg-[#0c0c0c] focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-white/10'
      } shadow-2xl`}>
        {/* Textarea */}
        <textarea
          id="chat-input-textarea"
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isOutOfTokens
              ? 'Бесплатные токены исчерпаны. Нажмите "Донат / Пополнить", чтобы продолжить...'
              : 'Спросите что-нибудь у GROKSON... (Shift+Enter для новой строки)'
          }
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent px-4 pt-3.5 pb-11 text-white placeholder-neutral-400 text-sm sm:text-base resize-none focus:outline-none max-h-48 leading-relaxed font-sans"
        />

        {/* Bottom controls inside the input container */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Model selection & Token balance badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            <div className="relative flex items-center">
              <Cpu className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
              <select
                id="model-selector-dropdown"
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={isLoading || disabled}
                className="pl-8 pr-3 py-1 bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs font-mono uppercase tracking-wider rounded-lg border border-neutral-800 focus:outline-none focus:border-neutral-600 cursor-pointer appearance-none transition-colors"
                title={`Выбранная модель: ${model} (${activeTier.description})`}
              >
                {modelsList.map((m) => {
                  const mTier = getModelTier(m.id);
                  return (
                    <option key={m.id} value={m.id} className="bg-black text-white">
                      {m.id} [{mTier.badge}]
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Active Model Tier multiplier badge */}
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium border ${activeTier.borderClass} ${activeTier.bgClass} ${activeTier.colorClass}`}
              title={activeTier.description}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeTier.dotColor}`} />
              <span>{activeTier.badge} расход</span>
            </span>

            {/* Live Token Balance Trigger */}
            <button
              type="button"
              onClick={onOpenDonate}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                isOutOfTokens
                  ? 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  : 'bg-black border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
              title="Нажмите, чтобы открыть окно доната и токенов"
            >
              <Zap className="w-3 h-3 text-white" />
              <span>{formatNumber(tokenBalance)} тк.</span>
            </button>
          </div>

          {/* Action button: Send or Stop */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {isLoading ? (
              <button
                id="stop-generation-button"
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono uppercase tracking-wider border border-neutral-700 transition-colors cursor-pointer"
                title="Остановить генерацию"
              >
                <Square className="w-3 h-3 fill-current text-white" />
                <span>Стоп</span>
              </button>
            ) : isOutOfTokens ? (
              <button
                id="donate-open-trigger-button"
                onClick={onOpenDonate}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Пополнить токены"
              >
                Пополнить
              </button>
            ) : (
              <button
                id="send-message-button"
                onClick={handleSendClick}
                disabled={!input.trim() || disabled}
                className={`p-2 rounded-xl transition-all duration-150 ${
                  input.trim() && !disabled
                    ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer shadow-sm active:scale-95'
                    : 'bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800'
                }`}
                title="Отправить (Enter)"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 text-center text-[11px] font-mono tracking-wider text-neutral-400">
        GROKSON // Искусственный интеллект · 10 000 стартовых токенов бесплатно
      </div>
    </div>
  );
};
