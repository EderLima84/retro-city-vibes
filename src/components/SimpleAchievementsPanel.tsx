import React from 'react';
import { useSimpleGamification } from '../hooks/useSimpleGamification';

export const SimpleAchievementsPanel: React.FC = () => {
  const { achievements, loading } = useSimpleGamification();

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-white/20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Conquistas</h2>
          <p className="text-white/70">
            {unlockedCount} de {achievements.length} conquistas desbloqueadas
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-yellow-500">{unlockedCount}</div>
          <div className="text-white/70 text-sm">Desbloqueadas</div>
        </div>
      </div>

      {/* Grid de conquistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`relative rounded-lg border-2 p-4 transition-all ${
              achievement.unlocked
                ? 'border-yellow-400 bg-yellow-50/10 shadow-lg transform hover:scale-105'
                : 'border-white/20 bg-white/5'
            }`}
          >
            {/* Ícone e nome */}
            <div className="flex items-start space-x-3 mb-3">
              <div className={`text-3xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold ${
                  achievement.unlocked ? 'text-yellow-400' : 'text-white/70'
                }`}>
                  {achievement.name}
                </h3>
                <p className={`text-sm ${
                  achievement.unlocked ? 'text-white/90' : 'text-white/50'
                }`}>
                  {achievement.description}
                </p>
              </div>
            </div>

            {/* Recompensa */}
            <div className="flex items-center justify-between">
              <div className={`text-sm ${
                achievement.unlocked ? 'text-yellow-400' : 'text-white/50'
              }`}>
                +{achievement.points} XP
              </div>
              {achievement.unlocked && (
                <div className="flex items-center space-x-1 text-green-400">
                  <span className="text-sm">✓</span>
                  <span className="text-xs">Desbloqueada</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {achievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma conquista encontrada</h3>
          <p className="text-white/70">As conquistas aparecerão aqui conforme você usa a plataforma.</p>
        </div>
      )}
    </div>
  );
};