export interface ModelTierInfo {
  id: string;
  name: string;
  badge: string;
  multiplier: number;
  description: string;
  shortDesc: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  dotColor: string;
}

export const KNOWN_MODEL_TIERS: ModelTierInfo[] = [
  {
    id: 'GigaChat',
    name: 'GigaChat',
    badge: '1x',
    multiplier: 1.0,
    shortDesc: 'Базовая универсальная',
    description: 'Быстрое и экономичное ядро для повседневных задач (1x расход токенов).',
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-500/10',
    dotColor: 'bg-emerald-400',
  },
  {
    id: 'GigaChat-Plus',
    name: 'GigaChat Plus',
    badge: '1.5x',
    multiplier: 1.5,
    shortDesc: 'Сбалансированная',
    description: 'Улучшенная модель с повышенной точностью и памятью (1.5x расход токенов).',
    colorClass: 'text-sky-400',
    borderClass: 'border-sky-500/30',
    bgClass: 'bg-sky-500/10',
    dotColor: 'bg-sky-400',
  },
  {
    id: 'GigaChat-Pro',
    name: 'GigaChat Pro',
    badge: '2.5x',
    multiplier: 2.5,
    shortDesc: 'Продвинутая логика & код',
    description: 'Мощная модель для сложных рассуждений, математики и кода (2.5x расход токенов).',
    colorClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    bgClass: 'bg-purple-500/10',
    dotColor: 'bg-purple-400',
  },
  {
    id: 'GigaChat-Max',
    name: 'GigaChat Max',
    badge: '5x',
    multiplier: 5.0,
    shortDesc: 'Флагманская сверхмощная',
    description: 'Флагманское ядро максимального интеллекта и глубоких рассуждений (5x расход токенов).',
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-500/10',
    dotColor: 'bg-amber-400',
  },
];

/**
 * Returns tier metadata and token multiplier for any model name
 */
export function getModelTier(modelId: string): ModelTierInfo {
  const clean = (modelId || '').toLowerCase().trim();

  if (clean.includes('max')) {
    return {
      ...KNOWN_MODEL_TIERS[3],
      id: modelId,
    };
  }

  if (clean.includes('pro')) {
    return {
      ...KNOWN_MODEL_TIERS[2],
      id: modelId,
    };
  }

  if (clean.includes('plus')) {
    return {
      ...KNOWN_MODEL_TIERS[1],
      id: modelId,
    };
  }

  return {
    ...KNOWN_MODEL_TIERS[0],
    id: modelId || 'GigaChat',
  };
}

/**
 * Calculates effective tokens to deduct based on base tokens and model multiplier
 */
export function calculateTokensUsage(
  rawTokens: number,
  modelId: string
): {
  baseTokens: number;
  multiplier: number;
  tokensToDeduct: number;
  tier: ModelTierInfo;
} {
  const tier = getModelTier(modelId);
  const baseTokens = Math.max(1, rawTokens || 1);
  const tokensToDeduct = Math.max(1, Math.round(baseTokens * tier.multiplier));

  return {
    baseTokens,
    multiplier: tier.multiplier,
    tokensToDeduct,
    tier,
  };
}
