import React, { useState } from 'react';
import {
  X,
  Zap,
  Check,
  Copy,
  AlertTriangle,
  Loader2,
  Lock,
  KeyRound,
  ShieldCheck,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { GroksonIcon } from './GroksonLogo';
import {
  redeemPromoCode,
  adminGenerateVoucher,
} from '../services/api';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onAddTokens: (tokens: number, tierName?: string) => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onAddTokens,
}) => {
  const [activeTab, setActiveTab] = useState<'voucher' | 'admin'>('voucher');

  // Voucher / Key activation state
  const [voucherCode, setVoucherCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [activationStatus, setActivationStatus] = useState<{ text: string; error: boolean } | null>(null);

  // Admin state
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Admin voucher generation
  const [tokenAmount, setTokenAmount] = useState('100000');
  const [customAmount, setCustomAmount] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const formatNumber = (num: number) => new Intl.NumberFormat('ru-RU').format(num);

  // Redeem single-use activation key
  const handleRedeemKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = voucherCode.trim();
    if (!cleanKey) return;

    setIsRedeeming(true);
    setActivationStatus(null);

    try {
      const res = await redeemPromoCode(cleanKey);
      if (res.success && res.tokensAdded) {
        onAddTokens(res.tokensAdded, 'Ключ активации');
        setActivationStatus({
          text: res.message || `Успешно начислено +${formatNumber(res.tokensAdded)} токенов!`,
          error: false,
        });
        setVoucherCode('');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setActivationStatus({
        text: err.message || 'Неверный или уже использованный ключ активации.',
        error: true,
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Admin login check
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSecret = adminPassword.trim();
    if (!cleanSecret) return;

    setIsCheckingAdmin(true);
    setAdminError(null);

    try {
      // Test the password by doing a probe request
      const res = await adminGenerateVoucher(50000, cleanSecret);
      if (res && res.voucherCode) {
        setIsAdminLoggedIn(true);
        setGeneratedKey(res.voucherCode);
        setAdminPassword(cleanSecret);
      }
    } catch (err: any) {
      setAdminError(err.message || 'Неверный пароль доступа.');
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  // Generate a key for a paying customer
  const handleCreateVoucher = async () => {
    setIsGenerating(true);
    setGeneratedKey(null);
    setCopiedKey(false);

    try {
      const amountToGen = customAmount.trim()
        ? parseInt(customAmount.replace(/\D/g, ''), 10) || 50000
        : parseInt(tokenAmount, 10) || 50000;

      const res = await adminGenerateVoucher(amountToGen, adminPassword);
      if (res.success && res.voucherCode) {
        setGeneratedKey(res.voucherCode);
      }
    } catch (err: any) {
      setAdminError(err.message || 'Ошибка создания ключа');
    } finally {
      setIsGenerating(false);
    }
  };

  // Quick grant for admin's own current device
  const handleSelfTopUp = (amount: number) => {
    onAddTokens(amount, 'Админ');
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div
        id="donate-modal-card"
        className="w-full max-w-lg rounded-2xl bg-[#0c0c0c] border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800/90 flex items-center justify-between shrink-0 bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <GroksonIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-[0.25em] text-white"
                style={{ fontFamily: "'Michroma', 'Orbitron', monospace" }}
              >
                БАЛАНС ТОКЕНОВ // GROKSON
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-neutral-400 font-mono">Баланс:</span>
                <span className="text-[11px] font-mono font-bold text-white">
                  {formatNumber(currentBalance)} токенов
                </span>
                {currentBalance <= 0 && (
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 bg-neutral-900 border border-neutral-700 text-neutral-300 rounded">
                    Требуется пополнение
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            id="close-donate-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-0 bg-black border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('voucher')}
              className={`pb-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'voucher'
                  ? 'border-white text-white font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Активация ключа</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`pb-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
            title="Панель администратора"
          >
            <Lock className="w-3 h-3" />
            <span>Панель владельца</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-sans text-xs">
          {activeTab === 'voucher' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-white" />
                  <span className="font-semibold text-white text-xs font-mono uppercase tracking-wider">
                    Ввод персонального ключа доступа
                  </span>
                </div>

                <p className="text-neutral-300 text-xs leading-relaxed">
                  Прямые способы онлайн-оплаты временно обновляются. Если вы приобрели ключ пополнения у администратора, введите его ниже для мгновенного начисления токенов:
                </p>

                <form onSubmit={handleRedeemKey} className="space-y-2.5 pt-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => {
                        setVoucherCode(e.target.value);
                        setActivationStatus(null);
                      }}
                      placeholder="KEY-XXXXXX-XXXX"
                      disabled={isRedeeming}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase text-xs focus:outline-none focus:border-neutral-600 tracking-wider placeholder-neutral-500"
                    />
                    <button
                      type="submit"
                      id="redeem-voucher-submit-button"
                      disabled={!voucherCode.trim() || isRedeeming}
                      className="px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 disabled:opacity-40 transition-colors uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {isRedeeming ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : null}
                      <span>Активировать</span>
                    </button>
                  </div>

                  {activationStatus && (
                    <div
                      className={`text-xs font-mono p-3 rounded-xl border flex items-center gap-2 ${
                        activationStatus.error
                          ? 'text-red-300 bg-red-950/40 border-red-900/60'
                          : 'text-emerald-300 bg-emerald-950/40 border-emerald-900/60'
                      }`}
                    >
                      {activationStatus.error ? (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      ) : (
                        <Check className="w-4 h-4 shrink-0" />
                      )}
                      <span>{activationStatus.text}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Information Note */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-400 space-y-1">
                <div className="text-neutral-300 font-semibold uppercase">Как получить ключ?</div>
                <div>Каждый ключ является одноразовым и выдается администратором сервиса. После активации ключ сгорает.</div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-4">
              {!isAdminLoggedIn ? (
                /* Admin Login Screen - NO password hint anywhere */
                <form onSubmit={handleAdminLogin} className="p-4 rounded-xl bg-black border border-neutral-800 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-white" />
                    <span className="font-semibold text-white text-xs font-mono uppercase tracking-wider">
                      Вход в панель управления
                    </span>
                  </div>

                  <p className="text-neutral-400 text-xs leading-relaxed">
                    Доступ разрешен только администратору. Введите пароль для генерации персональных ключей пополнения:
                  </p>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => {
                          setAdminPassword(e.target.value);
                          setAdminError(null);
                        }}
                        placeholder="Введите пароль доступа"
                        disabled={isCheckingAdmin}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-neutral-600"
                      />
                      <button
                        type="submit"
                        disabled={!adminPassword.trim() || isCheckingAdmin}
                        className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                      >
                        {isCheckingAdmin && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
                        <span>Войти</span>
                      </button>
                    </div>

                    {adminError && (
                      <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs font-mono flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{adminError}</span>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                /* Logged in Admin Panel */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span className="font-bold text-white font-mono text-xs uppercase tracking-wider">
                        Панель администратора
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminLoggedIn(false);
                        setAdminPassword('');
                        setGeneratedKey(null);
                      }}
                      className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Выйти</span>
                    </button>
                  </div>

                  {/* Key Generator Form */}
                  <div className="p-4 rounded-xl bg-black border border-neutral-800 space-y-3">
                    <span className="font-semibold text-white text-xs font-mono uppercase tracking-wider block">
                      Создать ключ пополнения для клиента:
                    </span>

                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: '50000', label: '50 000 тк.' },
                          { val: '200000', label: '200 000 тк.' },
                          { val: '1000000', label: '1 000 000 тк.' },
                        ].map((tier) => (
                          <button
                            key={tier.val}
                            type="button"
                            onClick={() => {
                              setTokenAmount(tier.val);
                              setCustomAmount('');
                            }}
                            className={`py-2 px-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                              tokenAmount === tier.val && !customAmount
                                ? 'bg-neutral-900 border-white text-white font-bold'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {tier.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Или произвольное количество (напр. 350000)"
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-neutral-600 placeholder-neutral-600"
                        />
                        <button
                          type="button"
                          onClick={handleCreateVoucher}
                          disabled={isGenerating}
                          className="px-4 py-2 bg-white text-black font-bold rounded-xl text-xs font-mono hover:bg-neutral-200 cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
                          <span>Создать ключ</span>
                        </button>
                      </div>
                    </div>

                    {/* Result Box */}
                    {generatedKey && (
                      <div className="mt-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-700 space-y-2">
                        <div className="text-[10px] font-mono uppercase text-neutral-400">
                          Сгенерированный ключ (передайте клиенту):
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm text-white font-bold select-all tracking-wider">
                            {generatedKey}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyKey}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono transition-colors cursor-pointer shrink-0"
                          >
                            {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey ? 'Скопировано!' : 'Копировать'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fast Top-Up for Admin */}
                  <div className="p-3.5 rounded-xl bg-black border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white font-mono uppercase">
                        Быстрое пополнение для себя:
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        Начислить токены прямо на это устройство
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelfTopUp(100000)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+100 000 тк.</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelfTopUp(1000000)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+1 000 000 тк.</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800/90 bg-black shrink-0 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500 font-mono">
            GROKSON // Защищённая система токенов
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
