import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RotateCcw, AlertCircle, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';
import { GroksonIcon } from './GroksonLogo';
import { getModelTier } from '../utils/modelRates';

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: () => void;
  isLast?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  isLast,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group w-full py-5 px-4 sm:px-6 transition-colors duration-200 border-b border-neutral-900/40 ${
        isUser ? 'bg-neutral-950/60' : 'bg-transparent'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div
              id={`avatar-user-${message.id}`}
              className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 shadow-sm"
              title="Вы"
            >
              <User className="w-4 h-4 text-neutral-400" />
            </div>
          ) : (
            <div
              id={`avatar-bot-${message.id}`}
              className="w-8 h-8 rounded-lg bg-black border border-neutral-800 flex items-center justify-center text-white shadow-sm"
              title="GROKSON"
            >
              <GroksonIcon className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header info */}
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold tracking-wide ${
                  isUser ? 'text-neutral-300' : 'text-white'
                }`}
                style={!isUser ? { fontFamily: "'Michroma', 'Orbitron', monospace", fontSize: '11px', letterSpacing: '0.15em' } : undefined}
              >
                {isUser ? 'ВЫ' : 'GROKSON'}
              </span>
              {message.model && !isUser && (() => {
                const tier = getModelTier(message.model);
                return (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase border ${tier.borderClass} ${tier.bgClass} ${tier.colorClass}`}
                    title={tier.description}
                  >
                    <span>{message.model}</span>
                    <span className="font-bold opacity-80">[{tier.badge}]</span>
                  </span>
                );
              })()}
              {message.tokensUsed && !isUser && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider text-neutral-300 bg-black border border-neutral-800"
                  title={
                    message.tokensMultiplier && message.tokensMultiplier > 1
                      ? `Списано ${message.tokensUsed} токенов (базовый расход ${message.baseTokens || Math.round(message.tokensUsed / message.tokensMultiplier)} × ${message.tokensMultiplier})`
                      : `Списано ${message.tokensUsed} токенов (1x)`
                  }
                >
                  {message.tokensUsed} тк.{message.tokensMultiplier && message.tokensMultiplier > 1 ? ` (${message.tokensMultiplier}x)` : ''}
                </span>
              )}
              <span className="text-neutral-600 text-[11px] font-mono">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                id={`copy-btn-${message.id}`}
                onClick={handleCopy}
                title="Копировать текст"
                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {!isUser && isLast && onRetry && (
                <button
                  id={`retry-btn-${message.id}`}
                  onClick={onRetry}
                  title="Сгенерировать заново"
                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Message body */}
          {message.error ? (
            <div
              id={`error-box-${message.id}`}
              className="p-3 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300 text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm font-mono leading-relaxed">
                {message.error}
              </div>
            </div>
          ) : isUser ? (
            <div className="text-neutral-200 text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed font-normal">
              {message.content}
            </div>
          ) : (
            <div className="markdown-content text-neutral-100 text-sm sm:text-base leading-relaxed break-words font-normal">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    return isInline ? (
                      <code
                        className="px-1.5 py-0.5 rounded text-xs font-mono bg-neutral-900 text-neutral-200 border border-neutral-800"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <div className="my-3 rounded-lg overflow-hidden border border-neutral-800 bg-black shadow-sm">
                        {match && (
                          <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-950 border-b border-neutral-800/80 text-xs font-mono text-neutral-400">
                            <span className="uppercase text-[11px] font-semibold text-neutral-300">{match[1]}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                              }}
                              className="hover:text-white transition-colors flex items-center gap-1.5 text-xs text-neutral-400"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Копировать</span>
                            </button>
                          </div>
                        )}
                        <pre className="p-3.5 overflow-x-auto text-xs sm:text-sm font-mono text-neutral-200 leading-relaxed">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-5 mb-3 space-y-1 text-neutral-200">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-5 mb-3 space-y-1 text-neutral-200">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="mb-0.5">{children}</li>;
                  },
                  h1({ children }) {
                    return <h1 className="text-lg sm:text-xl font-bold text-white mt-4 mb-2">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-base sm:text-lg font-semibold text-white mt-3 mb-2">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-sm sm:text-base font-semibold text-neutral-200 mt-2 mb-1">{children}</h3>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-2 border-neutral-600 pl-3 my-2 text-neutral-400 italic">
                        {children}
                      </blockquote>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-3">
                        <table className="min-w-full text-xs sm:text-sm border border-neutral-800">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="bg-neutral-900 px-3 py-1.5 text-left border border-neutral-800 font-medium text-neutral-300">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="px-3 py-1.5 border border-neutral-800 text-neutral-300">
                        {children}
                      </td>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Streaming typing cursor */}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 align-middle bg-white animate-pulse rounded-none" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
