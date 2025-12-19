import React from 'react';
import { useSimpleGamification } from '../hooks/useSimpleGamification';

interface SimpleUserProfileProps {
  showDetailed?: boolean;
  className?: string;
}

export const SimpleUserProfile: React.FC<SimpleUserProfileProps> = ({ 
  showDetailed = false, 
  className = '' 
}) => {
  const { userLevel, userStats, getUnlockedAchievements, getLevelProgress } = useSimpleGamification();

  if (!userLevel) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="h-3 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  const levelProgress = getLevelProgress();
  const unlockedAchievements = getUnlockedAchievements();

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 ${className}`}>
      {/* Header com nível */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {userLevel.level}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              LV
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Nível {userLevel.level}</h3>
            <p className="text-white/70 text-sm">{userLevel.totalExperience.toLocaleString()} XP total</p>
          </div>
        </div>
        
        {unlockedAchievements.length > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-500">{unlockedAchievements.length}</div>
            <div className="text-white/70 text-xs">Conquistas</div>
          </div>
        )}
      </div>

      {/* Barra de progresso do nível */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-white/70 mb-1">
          <span>Progresso para Nível {userLevel.level + 1}</span>
          <span>{levelProgress.current}/{levelProgress.needed} XP</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${levelProgress.percentage}%` }}
          ></div>
        </div>
      </div>

      {showDetailed && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{userStats.postsCreated}</div>
              <div className="text-white/70 text-sm">Postagens</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{userStats.commentsMade}</div>
              <div className="text-white/70 text-sm">Comentários</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{userStats.likesReceived}</div>
              <div className="text-white/70 text-sm">Curtidas Recebidas</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{userStats.clubsJoined}</div>
              <div className="text-white/70 text-sm">Clubes</div>
            </div>
          </div>

          {/* Conquistas recentes */}
          {unlockedAchievements.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-2">Conquistas Desbloqueadas</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {unlockedAchievements.slice(0, 5).map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-2 bg-white/5 rounded-lg p-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-yellow-500">
                        {achievement.name}
                      </div>
                      <div className="text-white/70 text-xs truncate">
                        {achievement.description}
                      </div>
                    </div>
                    <div className="text-yellow-500 text-sm font-bold">
                      +{achievement.points} XP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Streak de login */}
          {userStats.loginStreak > 0 && (
            <div className="mt-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="text-white font-semibold">Streak de {userStats.loginStreak} dias</div>
                  <div className="text-white/70 text-sm">Continue fazendo login diariamente!</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};