import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const ChristmasEffects: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Snowflakes */}
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-snowfall opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${10 + Math.random() * 10}s`,
          }}
        />
      ))}
      
      {/* Christmas lights */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-red-500 opacity-30" />
      
      {/* Twinkling stars */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-twinkle"
          style={{
            top: `${Math.random() * 50}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
};

export const NewYearEffects: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Fireworks */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={`firework-${i}`}
          className="absolute w-4 h-4 bg-gradient-to-r from-yellow-400 to-purple-500 rounded-full animate-fireworks"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      
      {/* Confetti */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={`confetti-${i}`}
          className="absolute w-2 h-2 animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
      
      {/* Sparkles */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
      
      {/* Golden border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 opacity-50" />
    </div>
  );
};

export const ThemeEffects: React.FC = () => {
  const { theme } = useTheme();

  switch (theme) {
    case 'christmas':
      return <ChristmasEffects />;
    case 'new-year':
      return <NewYearEffects />;
    default:
      return null;
  }
};