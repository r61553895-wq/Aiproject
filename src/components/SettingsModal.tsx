import React, { useState } from 'react';
import { X, Key, Sliders, MessageSquare, RotateCcw, Check, Zap, Globe } from 'lucide-react';
import { AppSettings, GigaChatModel } from '../types';
import { GroksonIcon } from './GroksonLogo';
import { getModelTier, KNOWN_MODEL_TIERS } from '../utils/modelRates';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  models: GigaChatModel[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  models,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 500);
  };

  const handleResetDefaults = () => {
    setLocalSettings({
      model: 'GigaChat',
      temperature: 0.7,
      systemPrompt: '',
      customAuthKey: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div
        id="settings-modal-card"
        className="w-full max-w-lg rounded-2xl bg-[#0d0d0d] border border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/90">
          <div className="flex items-center gap-2.5">
            <GroksonIcon className="w-5 h-5 text-white" />
            <h2
              className="text-xs font-bold uppercase tracking-[0.25em] text-white"
              style={{ fontFamily: "'Michroma', 'Orbitron', monospace" }}
            >
              ПАРАМЕТРЫ GROKSON
            </h2>
          </div>
          <button
            id="close-settings-button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 space-y-5 text-xs sm:text-sm">
          {/* Model selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Ядро модели (LLM Core)
              </label>
              {(() => {
                const currentTier = getModelTier(localSettings.model);
                return (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${currentTier.borderClass} ${currentTier.bgClass} ${currentTier.colorClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${currentTier.dotColor}`} />
                    <span>Расход {currentTier.badge}</span>
                  </span>
                );
              })()}
            </div>
            <select
              id="settings-model-select"
              value={localSettings.model}
              onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neutral-600 font-mono text-xs cursor-pointer"
            >
              {models.map((m) => {
                const tier = getModelTier(m.id);
                return (
                  <option key={m.id} value={m.id} className="bg-black text-white">
                    {m.id} [{tier.badge}] {m.description ? `// ${m.description}` : ''}
                  </option>
                );
              })}
            </select>

            {/* Model Consumption Rates Table */}
            <div className="p-3 rounded-xl bg-black border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-white" />
                  <span>Тариф расхода токенов по моделям</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">коэффициент</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {KNOWN_MODEL_TIERS.map((t) => {
                  const isSelected = getModelTier(localSettings.model).badge === t.badge;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setLocalSettings({ ...localSettings, model: t.id })}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? `border-neutral-600 bg-neutral-900/90 text-white ring-1 ring-white/10`
                          : `border-neutral-800/60 bg-neutral-950/60 hover:bg-neutral-900/50 text-neutral-400 hover:text-neutral-200`
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                          {t.name}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${t.colorClass} ${t.bgClass}`}>
                          {t.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
                        {t.shortDesc}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-neutral-400 font-mono pt-1 border-t border-neutral-900 leading-relaxed">
                Чем выше модель, тем глубже и точнее её логика, и тем больше токенов расходуется за генерацию (от 1x до 5x).
              </p>
            </div>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300">
                Температура генерации (Креативность)
              </label>
              <span className="font-mono text-xs text-white px-2 py-0.5 rounded bg-black border border-neutral-800">
                {localSettings.temperature.toFixed(1)}
              </span>
            </div>
            <input
              id="settings-temperature-range"
              type="range"
              min="0"
              max="1.5"
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })
              }
              className="w-full accent-white cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>СТРОГИЙ (0.0)</span>
              <span>БАЛАНС (0.7)</span>
              <span>ТВОРЧЕСКИЙ (1.5)</span>
            </div>
          </div>

          {/* System prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300">
                Системная директива (Промпт)
              </label>
            </div>
            <textarea
              id="settings-system-prompt"
              rows={3}
              value={localSettings.systemPrompt}
              onChange={(e) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
              placeholder="Инструкция поведения ассистента: тон, ограничения, стиль..."
              className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 resize-none text-xs leading-relaxed font-sans"
            />
          </div>

          {/* Custom API Auth Key */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-neutral-400" />
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300">
                Ключ API (Base64)
              </label>
            </div>
            <input
              id="settings-auth-key"
              type="password"
              value={localSettings.customAuthKey}
              onChange={(e) => setLocalSettings({ ...localSettings, customAuthKey: e.target.value })}
              placeholder="По умолчанию используется системный ключ"
              className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2.5 text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 font-mono text-xs"
            />
            <p className="text-[11px] font-mono text-neutral-400">
              {localSettings.customAuthKey
                ? 'Активен пользовательский ключ авторизации'
                : 'Используется предустановленный ключ сервера'}
            </p>
          </div>

          {/* Custom API Base URL (for GitHub Pages / static hosting) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-neutral-400" />
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300">
                URL сервера API (для GitHub Pages)
              </label>
            </div>
            <input
              id="settings-api-url"
              type="text"
              value={localSettings.customApiUrl || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, customApiUrl: e.target.value })}
              placeholder="По умолчанию: текущий хост (оставьте пустым)"
              className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2.5 text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 font-mono text-xs"
            />
            <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
              GitHub Pages не запускает Node.js бэкенд. Если сайт размещен на github.io, укажите адрес вашего бэкенда или опубликуйте сайт целиком через Google Cloud Run.
            </p>
          </div>

          {/* Footer controls */}
          <div className="pt-3 flex items-center justify-between border-t border-neutral-800/90">
            <button
              type="button"
              id="reset-settings-button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сброс по умолчанию</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="cancel-settings-button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                id="save-settings-button"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                {savedMessage ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{savedMessage ? 'Сохранено' : 'Применить'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
