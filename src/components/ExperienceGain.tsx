import React, { useState, useEffect } from 'react';

interface ExperienceGainProps {
  amount: number;
  description?: string;
  onComplete?: () => void;
}

export const ExperienceGain: React.FC<ExperienceGainProps> = ({
  amount,
  description,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar animação
    setIsVisible(true);
    
    // Esconder após 3 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed top-20 right-4 z-50 transition-all duration-300 ${
      isVisible 
        ? 'transform translate-y-0 opacity-100' 
        : 'transform -translate-y-4 opacity-0'
    }`}>
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <span className="text-xl animate-bounce">⭐</span>
        <div>
          <div className="font-bold">+{amount} XP</div>
          {description && (
            <div className="text-xs opacity-90">{description}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook para gerenciar ganhos de experiência
export const useExperienceGains = () => {
  const [gains, setGains] = useState<Array<{
    id: string;
    amount: number;
    description?: string;
  }>>([]);

  const showExperienceGain = (amount: number, description?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setGains(prev => [...prev, { id, amount, description }]);
  };

  const removeGain = (id: string) => {
    setGains(prev => prev.filter(g => g.id !== id));
  };

  const ExperienceGainContainer = () => (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {gains.map((gain, index) => (
        <div
          key={gain.id}
          style={{ marginTop: `${index * 60}px` }}
        >
          <ExperienceGain
            amount={gain.amount}
            description={gain.description}
            onComplete={() => removeGain(gain.id)}
          />
        </div>
      ))}
    </div>
  );

  return {
    showExperienceGain,
    ExperienceGainContainer
  };
};