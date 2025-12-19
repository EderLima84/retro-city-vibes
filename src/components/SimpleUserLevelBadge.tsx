import React from 'react';
import { useSimpleGamification } from '../hooks/useSimpleGamification';

interface SimpleUserLevelBadgeProps {
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SimpleUserLevelBadge: React.FC<SimpleUserLevelBadgeProps> = ({
  showProgress = false,
  size = 'md',
  className = ''
}) => {
  const { userLevel, getLevelProgress, loading } = useSimpleGamification();

  if (loading || !userLevel) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`bg-gray-300 rounded-full ${
          size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'
        }`}></div>
      </div>
    );
  }

  const levelProgress = getLevelProgress();
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Badge principal */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
        {userLevel.level}
      </div>
      
      {/* Indicador de nível */}
      <div className={`absolute -bottom-1 -right-1 bg-yellow-500 text-white font-bold rounded-full flex items-center justify-center ${
        size === 'sm' ? 'w-4 h-4 text-xs' : size === 'lg' ? 'w-6 h-6 text-xs' : 'w-5 h-5 text-xs'
      }`}>
        LV
      </div>

      {/* Barra de progresso (opcional) */}
      {showProgress && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-full">
          <div className="bg-white/20 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${levelProgress.percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Tooltip com informações detalhadas */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-black/80 text-white text-xs rounded-lg p-2 whitespace-nowrap">
          <div className="font-bold">Nível {userLevel.level}</div>
          <div>{userLevel.totalExperience.toLocaleString()} XP total</div>
          <div>{levelProgress.current}/{levelProgress.needed} XP para próximo nível</div>
        </div>
      </div>
    </div>
  );
};