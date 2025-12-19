import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SimpleUserLevel {
  level: number;
  experience: number;
  totalExperience: number;
}

export interface SimpleUserStats {
  postsCreated: number;
  commentsMade: number;
  likesGiven: number;
  likesReceived: number;
  clubsJoined: number;
  loginStreak: number;
}

export interface SimpleAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
}

export const useSimpleGamification = () => {
  const { user } = useAuth();
  const [userLevel, setUserLevel] = useState<SimpleUserLevel>({
    level: 1,
    experience: 0,
    totalExperience: 0
  });
  const [userStats, setUserStats] = useState<SimpleUserStats>({
    postsCreated: 0,
    commentsMade: 0,
    likesGiven: 0,
    likesReceived: 0,
    clubsJoined: 0,
    loginStreak: 0
  });
  const [achievements, setAchievements] = useState<SimpleAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Calcular nível baseado na experiência
  const calculateLevel = (experience: number): number => {
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  };

  // Calcular experiência necessária para próximo nível
  const getExperienceForNextLevel = (currentLevel: number): number => {
    return currentLevel * currentLevel * 100;
  };

  // Calcular progresso para próximo nível
  const getLevelProgress = (): { current: number; needed: number; percentage: number } => {
    const currentLevelExp = (userLevel.level - 1) * (userLevel.level - 1) * 100;
    const nextLevelExp = userLevel.level * userLevel.level * 100;
    const currentProgress = userLevel.totalExperience - currentLevelExp;
    const neededForNext = nextLevelExp - currentLevelExp;
    const percentage = (currentProgress / neededForNext) * 100;

    return {
      current: currentProgress,
      needed: neededForNext,
      percentage: Math.min(percentage, 100)
    };
  };

  // Carregar dados do localStorage (versão simplificada)
  const loadUserData = () => {
    if (!user) return;

    try {
      const savedLevel = localStorage.getItem(`gamification_level_${user.id}`);
      const savedStats = localStorage.getItem(`gamification_stats_${user.id}`);
      const savedAchievements = localStorage.getItem(`gamification_achievements_${user.id}`);

      if (savedLevel) {
        const levelData = JSON.parse(savedLevel);
        setUserLevel(levelData);
      }

      if (savedStats) {
        const statsData = JSON.parse(savedStats);
        setUserStats(statsData);
      }

      if (savedAchievements) {
        const achievementsData = JSON.parse(savedAchievements);
        setAchievements(achievementsData);
      } else {
        // Inicializar conquistas padrão
        initializeAchievements();
      }
    } catch (error) {
      console.error('Erro ao carregar dados de gamificação:', error);
      initializeAchievements();
    } finally {
      setLoading(false);
    }
  };

  // Salvar dados no localStorage
  const saveUserData = () => {
    if (!user) return;

    localStorage.setItem(`gamification_level_${user.id}`, JSON.stringify(userLevel));
    localStorage.setItem(`gamification_stats_${user.id}`, JSON.stringify(userStats));
    localStorage.setItem(`gamification_achievements_${user.id}`, JSON.stringify(achievements));
  };

  // Inicializar conquistas padrão
  const initializeAchievements = () => {
    const defaultAchievements: SimpleAchievement[] = [
      {
        id: '1',
        name: 'Primeiro Passo',
        description: 'Crie sua primeira postagem',
        icon: '📝',
        points: 50,
        unlocked: false
      },
      {
        id: '2',
        name: 'Conversador',
        description: 'Faça 10 comentários',
        icon: '💬',
        points: 100,
        unlocked: false
      },
      {
        id: '3',
        name: 'Sociável',
        description: 'Dê 25 curtidas',
        icon: '👍',
        points: 75,
        unlocked: false
      },
      {
        id: '4',
        name: 'Popular',
        description: 'Receba 50 curtidas',
        icon: '⭐',
        points: 150,
        unlocked: false
      },
      {
        id: '5',
        name: 'Escritor',
        description: 'Crie 10 postagens',
        icon: '✍️',
        points: 200,
        unlocked: false
      },
      {
        id: '6',
        name: 'Explorador',
        description: 'Entre em 3 clubes',
        icon: '🔍',
        points: 100,
        unlocked: false
      },
      {
        id: '7',
        name: 'Dedicado',
        description: 'Faça login por 7 dias seguidos',
        icon: '🔥',
        points: 200,
        unlocked: false
      }
    ];

    setAchievements(defaultAchievements);
  };

  // Adicionar experiência
  const addExperience = (amount: number, description?: string) => {
    setUserLevel(prev => {
      const newTotalExp = prev.totalExperience + amount;
      const newLevel = calculateLevel(newTotalExp);
      const newCurrentExp = newTotalExp - ((newLevel - 1) * (newLevel - 1) * 100);
      
      return {
        level: newLevel,
        experience: newCurrentExp,
        totalExperience: newTotalExp
      };
    });

    // Mostrar notificação de XP (opcional)
    if (description) {
      console.log(`+${amount} XP: ${description}`);
    }
  };

  // Verificar e desbloquear conquistas
  const checkAchievements = () => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.unlocked) return achievement;

      let shouldUnlock = false;

      switch (achievement.id) {
        case '1': // Primeiro Passo
          shouldUnlock = userStats.postsCreated >= 1;
          break;
        case '2': // Conversador
          shouldUnlock = userStats.commentsMade >= 10;
          break;
        case '3': // Sociável
          shouldUnlock = userStats.likesGiven >= 25;
          break;
        case '4': // Popular
          shouldUnlock = userStats.likesReceived >= 50;
          break;
        case '5': // Escritor
          shouldUnlock = userStats.postsCreated >= 10;
          break;
        case '6': // Explorador
          shouldUnlock = userStats.clubsJoined >= 3;
          break;
        case '7': // Dedicado
          shouldUnlock = userStats.loginStreak >= 7;
          break;
      }

      if (shouldUnlock && !achievement.unlocked) {
        // Adicionar experiência da conquista
        addExperience(achievement.points, `Conquista desbloqueada: ${achievement.name}`);
        
        return { ...achievement, unlocked: true };
      }

      return achievement;
    }));
  };

  // Ações de tracking
  const trackActivity = {
    postCreated: () => {
      setUserStats(prev => ({ ...prev, postsCreated: prev.postsCreated + 1 }));
      addExperience(25, 'Postagem criada');
    },
    commentMade: () => {
      setUserStats(prev => ({ ...prev, commentsMade: prev.commentsMade + 1 }));
      addExperience(10, 'Comentário feito');
    },
    likeGiven: () => {
      setUserStats(prev => ({ ...prev, likesGiven: prev.likesGiven + 1 }));
      addExperience(5, 'Curtida dada');
    },
    likeReceived: () => {
      setUserStats(prev => ({ ...prev, likesReceived: prev.likesReceived + 1 }));
      addExperience(15, 'Curtida recebida');
    },
    clubJoined: () => {
      setUserStats(prev => ({ ...prev, clubsJoined: prev.clubsJoined + 1 }));
      addExperience(50, 'Entrou em um clube');
    },
    dailyLogin: () => {
      const today = new Date().toDateString();
      const lastLogin = localStorage.getItem(`last_login_${user?.id}`);
      
      if (lastLogin !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLogin === yesterday.toDateString()) {
          setUserStats(prev => ({ ...prev, loginStreak: prev.loginStreak + 1 }));
        } else {
          setUserStats(prev => ({ ...prev, loginStreak: 1 }));
        }
        
        localStorage.setItem(`last_login_${user?.id}`, today);
        addExperience(20, 'Login diário');
      }
    }
  };

  // Obter conquistas desbloqueadas
  const getUnlockedAchievements = () => {
    return achievements.filter(a => a.unlocked);
  };

  // Obter ranking simulado (baseado no nível)
  const getRanking = () => {
    // Em uma implementação real, isso viria do servidor
    return [
      { username: 'Você', level: userLevel.level, experience: userLevel.totalExperience, position: 1 }
    ];
  };

  // Efeitos
  useEffect(() => {
    if (user) {
      loadUserData();
      trackActivity.dailyLogin();
    }
  }, [user]);

  useEffect(() => {
    checkAchievements();
  }, [userStats]);

  useEffect(() => {
    saveUserData();
  }, [userLevel, userStats, achievements]);

  return {
    // Estados
    userLevel,
    userStats,
    achievements,
    loading,

    // Funções
    addExperience,
    trackActivity,
    getLevelProgress,
    getExperienceForNextLevel,
    getUnlockedAchievements,
    getRanking,
    
    // Utilitários
    calculateLevel
  };
};