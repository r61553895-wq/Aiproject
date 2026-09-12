export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  model?: string;
  isStreaming?: boolean;
  error?: string;
  tokensUsed?: number;
  tokensMultiplier?: number;
  baseTokens?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model: string;
  systemPrompt: string;
  temperature: number;
}

export interface GigaChatModel {
  id: string;
  description?: string;
  type?: string;
}

export interface BalanceItem {
  usage: string;
  value: number;
}

export interface AppSettings {
  model: string;
  temperature: number;
  systemPrompt: string;
  customAuthKey: string;
  customApiUrl?: string;
}

export interface UserTokenState {
  balance: number;
  initialGrant: number;
  totalTokensUsed: number;
  donationsCount: number;
}

export interface DonationTier {
  id: string;
  title: string;
  tokens: number;
  priceRub: number;
  popular?: boolean;
  desc: string;
}

export interface DonationOrder {
  orderId: string;
  tierId: string;
  tokens: number;
  priceRub: number;
  status: 'pending' | 'verified' | 'failed';
  createdAt: number;
  paymentMethod: 'sbp' | 'card' | 'yoomoney' | 'crypto';
  transactionId?: string;
}
