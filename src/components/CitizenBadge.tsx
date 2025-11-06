import { cn } from '@/lib/utils';
import { Sparkles, Pen, Smile, Star } from 'lucide-react';

export type BadgeType = 'poet' | 'chronicler' | 'humorist' | 'star';

interface Badge {
  type: BadgeType;
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}

const badges: Record<BadgeType, Badge> = {
  poet: {
    type: 'poet',
    icon: Pen,
    label: 'Cidadão Poético',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-950'
  },
  chronicler: {
    type: 'chronicler',
    icon: Sparkles,
    label: 'Cronista da Praça',
    color: 'text-secondary',
    bgColor: 'bg-secondary/20'
  },
  humorist: {
    type: 'humorist',
    icon: Smile,
    label: 'Humorista da Vila',
    color: 'text-accent',
    bgColor: 'bg-accent/20'
  },
  star: {
    type: 'star',
    icon: Star,
    label: 'Estrela da Cidade',
    color: 'text-primary',
    bgColor: 'bg-primary/20'
  }
};

interface CitizenBadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const CitizenBadge = ({ type, size = 'md', showLabel = true }: CitizenBadgeProps) => {
  const badge = badges[type];
  const Icon = badge.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all hover:scale-105',
        badge.color,
        badge.bgColor,
        sizeClasses[size]
      )}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{badge.label}</span>}
    </div>
  );
};
