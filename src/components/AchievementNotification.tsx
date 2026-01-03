import React, { useState, useEffect } from 'react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  experience_reward: number;
}

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animação de entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close
    if (autoClose) {
      const closeTimer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const rarityColors = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-yellow-500 to-yellow-600'
  };

  const rarityGlow = {
    common: 'shadow-gray-500/50',
    rare: 'shadow-blue-500/50',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-yellow-500/50'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible && !isLeaving 
        ? 'transform translate-x-0 opacity-100' 
        : 'transform translate-x-full opacity-0'
    }`}>
      <div className={`bg-gradient-to-r ${rarityColors[achievement.rarity]} rounded-lg shadow-2xl ${rarityGlow[achievement.rarity]} p-6 max-w-sm`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏆</span>
            <span className="text-white font-bold text-sm uppercase tracking-wide">
              Conquista Desbloqueada!
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Conquista */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="text-4xl animate-bounce">
            {achievement.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">
              {achievement.name}
            </h3>
            <p className="text-white/90 text-sm">
              {achievement.description}
            </p>
          </div>
        </div>

        {/* Recompensa */}
        <div className="bg-white/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-300">⭐</span>
            <span className="text-white font-semibold">
              +{achievement.experience_reward} XP
            </span>
          </div>
          <div className="text-white/80 text-sm uppercase font-bold">
            {achievement.rarity}
          </div>
        </div>

        {/* Efeitos visuais */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Partículas */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Hook para gerenciar notificações de conquistas
export const useAchievementNotifications = () => {
  const [notifications, setNotifications] = useState<Achievement[]>([]);

  const showAchievement = (achievement: Achievement) => {
    setNotifications(prev => [...prev, achievement]);
  };

  const removeNotification = (achievementId: string) => {
    setNotifications(prev => prev.filter(a => a.id !== achievementId));
  };

  const NotificationContainer = () => (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4">
      {notifications.map((achievement) => (
        <AchievementNotification
          key={achievement.id}
          achievement={achievement}
          onClose={() => removeNotification(achievement.id)}
        />
      ))}
    </div>
  );

  return {
    showAchievement,
    removeNotification,
    NotificationContainer
  };
};

export type { Achievement };
