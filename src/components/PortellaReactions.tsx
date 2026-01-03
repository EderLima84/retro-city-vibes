import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ReactionType = 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'fire';

interface Reaction {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

const reactions: Reaction[] = [
  { type: 'love', emoji: '❤️', label: 'Amor', color: 'text-red-500' },
  { type: 'laugh', emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
  { type: 'fire', emoji: '🔥', label: 'Fogo', color: 'text-orange-500' },
  { type: 'wow', emoji: '😮', label: 'Uau', color: 'text-yellow-500' },
  { type: 'sad', emoji: '😢', label: 'Triste', color: 'text-blue-500' },
  { type: 'angry', emoji: '😠', label: 'Raiva', color: 'text-red-600' },
];

interface PortellaReactionsProps {
  postId: string;
  onReact?: (type: ReactionType) => void;
  selectedReaction?: ReactionType | null;
}

export const PortellaReactions = ({ postId, onReact, selectedReaction }: PortellaReactionsProps) => {
  const [showAll, setShowAll] = useState(false);

  const handleReaction = (type: ReactionType) => {
    onReact?.(type);
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
      {reactions.map((reaction) => {
        const isSelected = selectedReaction === reaction.type;
        
        return (
          <Button
            key={reaction.type}
            variant={isSelected ? "default" : "ghost"}
            size="sm"
            onClick={() => handleReaction(reaction.type)}
            className={cn(
              "gap-1 transition-all hover:scale-110 px-2 sm:px-3",
              isSelected && "shadow-glow"
            )}
          >
            <span className="text-base sm:text-lg">{reaction.emoji}</span>
            <span className={cn(
              "text-xs font-medium hidden sm:inline",
              isSelected && "text-primary-foreground"
            )}>
              {reaction.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
};
