import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'christmas' | 'new-year';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar se há tema salvo no localStorage
    const savedTheme = localStorage.getItem('orkadia-theme') as Theme;
    return savedTheme || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remover todas as classes de tema
    root.classList.remove('light', 'dark', 'christmas', 'new-year');
    
    // Adicionar a classe do tema atual
    root.classList.add(theme);
    
    // Salvar no localStorage
    localStorage.setItem('orkadia-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(current => {
      switch (current) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'light';
        case 'christmas':
          return 'new-year';
        case 'new-year':
          return 'christmas';
        default:
          return 'light';
      }
    });
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};