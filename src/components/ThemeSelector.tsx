import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { 
  Sun, 
  Moon, 
  Palette,
  TreePine,
  Sparkles,
  Monitor
} from 'lucide-react';

const themeIcons = {
  light: Sun,
  dark: Moon,
  christmas: TreePine,
  'new-year': Sparkles,
};

const themeLabels = {
  light: 'Tema Claro',
  dark: 'Tema Escuro',
  christmas: 'Tema de Natal',
  'new-year': 'Tema de Ano Novo',
};

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const CurrentIcon = themeIcons[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Alterar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {(Object.keys(themeIcons) as Theme[]).map((themeOption) => {
          const Icon = themeIcons[themeOption];
          const isActive = theme === themeOption;
          
          return (
            <DropdownMenuItem
              key={themeOption}
              onClick={() => setTheme(themeOption)}
              className={`flex items-center gap-2 cursor-pointer ${
                isActive ? 'bg-primary/10 text-primary' : ''
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{themeLabels[themeOption]}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};