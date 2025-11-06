import { useState, useEffect } from 'react';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface TimeInfo {
  timeOfDay: TimeOfDay;
  gradient: string;
  greeting: string;
  emoji: string;
}

export const useTimeOfDay = (): TimeInfo => {
  const [timeInfo, setTimeInfo] = useState<TimeInfo>(() => getTimeInfo());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInfo(getTimeInfo());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return timeInfo;
};

function getTimeInfo(): TimeInfo {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      timeOfDay: 'morning',
      gradient: 'var(--gradient-morning)',
      greeting: 'Bom dia, cidadão!',
      emoji: '🌅'
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      timeOfDay: 'afternoon',
      gradient: 'var(--gradient-afternoon)',
      greeting: 'Boa tarde!',
      emoji: '☀️'
    };
  } else if (hour >= 18 && hour < 22) {
    return {
      timeOfDay: 'evening',
      gradient: 'var(--gradient-evening)',
      greeting: 'Boa noite!',
      emoji: '🌆'
    };
  } else {
    return {
      timeOfDay: 'night',
      gradient: 'var(--gradient-night)',
      greeting: 'Madrugada na praça',
      emoji: '🌙'
    };
  }
}
