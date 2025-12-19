import React from 'react';
import GlobalBackgroundImage from '@/assets/global-background.png';

interface GlobalBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const GlobalBackground: React.FC<GlobalBackgroundProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`min-h-screen relative ${className}`}>
      {/* Background fixo */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url(${GlobalBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Overlay sutil para melhorar legibilidade */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 z-1 pointer-events-none" />
      
      {/* Conteúdo da página */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default GlobalBackground;