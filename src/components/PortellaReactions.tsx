import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ReactionType = 'arretado' | 'oxente' | 'saudade' | 'conversa';

interface Reaction {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

const reactions: Reaction[] = [
  { type: 'arretado', emoji: '🌾', label: 'Arretado!', color: 'text-accent' },
  { type: 'oxente', emoji: '🪗', label: 'Oxente!', color: 'text-secondary' },
  { type: 'saudade', emoji: '🌙', label: 'Saudade', color: 'text-primary' },
  { type: 'conversa', emoji: '☕', label: 'Boa conversa!', color: 'text-muted-foreground' },
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
    <div className="flex items-center gap-2 flex-wrap">
      {reactions.map((reaction) => {
        const isSelected = selectedReaction === reaction.type;
        
        return (
          <Button
            key={reaction.type}
            variant={isSelected ? "default" : "ghost"}
            size="sm"
            onClick={() => handleReaction(reaction.type)}
            className={cn(
              "gap-1 transition-all hover:scale-110",
              isSelected && "shadow-glow"
            )}
          >
            <span className="text-lg">{reaction.emoji}</span>
            <span className={cn("text-xs font-medium", isSelected && "text-primary-foreground")}>
              {reaction.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
};
