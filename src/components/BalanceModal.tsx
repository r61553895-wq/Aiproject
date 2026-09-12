import React, { useState, useEffect } from 'react';
import { X, Coins, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { BalanceItem } from '../types';
import { fetchBalance } from '../services/api';
import { GroksonIcon } from './GroksonLogo';
import { KNOWN_MODEL_TIERS } from '../utils/modelRates';

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customAuthKey?: string;
  customApiUrl?: string;
}

export const BalanceModal: React.FC<BalanceModalProps> = ({
  isOpen,
  onClose,
  customAuthKey,
  customApiUrl,
}) => {
  const [balance, setBalance] = useState<BalanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBalance(customAuthKey, customApiUrl);
      setBalance(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить данные баланса');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBalance();
    }
  }, [isOpen, customAuthKey, customApiUrl]);

  if (!isOpen) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div
        id="balance-modal-card"
        className="w-full max-w-md rounded-2xl bg-[#0d0d0d] border border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/90">
          <div className="flex items-center gap-2.5">
            <GroksonIcon className="w-5 h-5 text-white" />
            <h2
              className="text-xs font-bold uppercase tracking-[0.25em] text-white"
              style={{ fontFamily: "'Michroma', 'Orbitron', monospace" }}
            >
              БАЛАНС ТОКЕНОВ
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={loadBalance}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              title="Обновить"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-balance-button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-neutral-400 text-xs font-mono">
              <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
              <span className="tracking-wider">ЗАПРОС БАЛАНСА...</span>
            </div>
          ) : balance.length === 0 && !error ? (
            <div className="py-6 text-center text-xs font-mono text-neutral-400">
              Данные о балансе не найдены
            </div>
          ) : (
            <div className="space-y-2">
              {balance.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-black border border-neutral-800/90"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                      {item.usage}
                    </span>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                      ДОСТУПНЫЙ РЕСУРС
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-white">
                      {formatNumber(item.value)}
                    </span>
                    <p className="text-[10px] text-neutral-400 font-mono">tokens</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-xl bg-black border border-neutral-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-white" />
                <span>Тариф расхода токенов по моделям</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {KNOWN_MODEL_TIERS.map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded-lg border border-neutral-800/60 bg-neutral-950/60 text-left font-mono"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300 font-medium">{t.name}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${t.colorClass} ${t.bgClass}`}>
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight truncate">
                    {t.shortDesc}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-neutral-400 font-mono pt-1 border-t border-neutral-900 leading-relaxed">
              Чем старше модель, тем больше токенов списывается с баланса за ответ (от 1x до 5x).
            </p>
          </div>

          <div className="pt-2 text-[11px] font-mono text-neutral-400 border-t border-neutral-800/90 leading-relaxed">
            Баланс синхронизирован с аккаунтом GigaChat API.
          </div>
        </div>
      </div>
    </div>
  );
};
