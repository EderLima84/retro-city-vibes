import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TreePine, Sparkles, Sun, Moon } from 'lucide-react';

const themeInfo = {
  light: {
    name: 'Tema Claro',
    description: 'O tema padrão da Orkadia com cores claras e vibrantes',
    icon: Sun,
    features: ['Interface limpa', 'Cores vibrantes', 'Boa legibilidade'],
    colors: ['Azul Portella', 'Tons claros', 'Gradientes suaves']
  },
  dark: {
    name: 'Tema Escuro',
    description: 'Tema escuro para uso noturno e economia de bateria',
    icon: Moon,
    features: ['Reduz cansaço visual', 'Economia de bateria', 'Elegante'],
    colors: ['Azuis escuros', 'Tons de cinza', 'Acentos brilhantes']
  },
  christmas: {
    name: 'Tema de Natal',
    description: 'Celebre o Natal com cores festivas e efeitos especiais',
    icon: TreePine,
    features: ['Efeito de neve', 'Cores natalinas', 'Luzes piscantes', 'Estrelas cintilantes'],
    colors: ['Vermelho Natal', 'Verde Pinheiro', 'Dourado', 'Branco Neve']
  },
  'new-year': {
    name: 'Tema de Ano Novo',
    description: 'Comece o ano com estilo usando cores douradas e efeitos de fogos',
    icon: Sparkles,
    features: ['Fogos de artifício', 'Confetes animados', 'Brilhos dourados', 'Efeitos de festa'],
    colors: ['Roxo Real', 'Dourado', 'Amarelo Brilhante', 'Roxo Meia-noite']
  }
};

export const ThemeInfo: React.FC = () => {
  const { theme } = useTheme();
  const info = themeInfo[theme];
  const Icon = info.icon;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          {info.name}
        </CardTitle>
        <CardDescription>{info.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Características:</h4>
          <div className="flex flex-wrap gap-2">
            {info.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Paleta de Cores:</h4>
          <div className="flex flex-wrap gap-2">
            {info.colors.map((color, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {color}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};