import React, { useState } from 'react';
import { LogIn, LogOut, User as UserIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { User, signInWithGoogle, signOutUser } from '../services/firebase';

interface AuthButtonProps {
  currentUser: User | null;
  isLoading: boolean;
  onAuthSuccess?: (user: User) => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  currentUser,
  isLoading,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      // Suppress user-closed popup error
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err?.message || 'Ошибка входа через Google');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    try {
      await signOutUser();
    } catch (err) {
      console.error('Sign Out failed:', err);
    }
  };

  if (isLoading || isSigningIn) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-400 text-xs font-mono">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
        <span className="hidden sm:inline">Google...</span>
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black border border-neutral-800 hover:border-neutral-700 text-white transition-all cursor-pointer group"
          title={`Аккаунт: ${currentUser.email || currentUser.displayName}`}
        >
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'Пользователь'}
              className="w-5 h-5 rounded-full ring-1 ring-neutral-700 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {(currentUser.displayName || currentUser.email || 'U')[0]}
            </div>
          )}
          <span className="text-xs font-mono font-medium max-w-[90px] sm:max-w-[130px] truncate hidden xs:inline">
            {currentUser.displayName || currentUser.email?.split('@')[0]}
          </span>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0c0c0c] border border-neutral-800 shadow-2xl p-3 z-50 text-xs font-sans animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-neutral-800">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-8 h-8 rounded-full ring-1 ring-neutral-700 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white">
                  <UserIcon className="w-4 h-4 text-neutral-300" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white truncate text-xs">
                  {currentUser.displayName || 'Google Пользователь'}
                </div>
                <div className="text-[11px] text-neutral-400 truncate font-mono">
                  {currentUser.email}
                </div>
              </div>
            </div>

            <div className="py-2 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Баланс синхронизирован с облаком</span>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full mt-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Выйти из Google</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        id="google-signin-button"
        type="button"
        onClick={handleSignIn}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold font-mono uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
        title="Войти через Google для сохранения токенов и диалогов"
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
        <span className="hidden sm:inline">Войти</span>
      </button>

      {errorMsg && (
        <div className="absolute top-full right-0 mt-1.5 p-2 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-[11px] font-mono z-50 whitespace-nowrap">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
