import React, { useState } from 'react';
import { GlobalBackground } from '../components/GlobalBackground';
import { CityNavigation } from '../components/CityNavigation';
import { SimpleUserProfile } from '../components/SimpleUserProfile';
import { SimpleAchievementsPanel } from '../components/SimpleAchievementsPanel';
import { useSimpleGamification } from '../hooks/useSimpleGamification';

export const Gamification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'ranking'>('profile');
  const { userLevel, loading } = useSimpleGamification();

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: '👤' },
    { id: 'achievements', name: 'Conquistas', icon: '🏆' }
  ];

  return (
    <div className="min-h-screen relative">
      <GlobalBackground>
        <div className="relative z-10">
        <CityNavigation />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Sistema de Gamificação
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Acompanhe seu progresso, desbloqueie conquistas e compete com outros usuários da Orkadia
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-6xl mx-auto">
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Perfil principal */}
                <div className="lg:col-span-2">
                  <SimpleUserProfile showDetailed={true} className="mb-6" />
                </div>

                {/* Sidebar com estatísticas rápidas */}
                <div className="space-y-6">
                  {/* Dicas de gamificação */}
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-6">
                    <h4 className="text-white font-bold mb-3">💡 Dicas para Ganhar XP</h4>
                    <ul className="space-y-2 text-white/80 text-sm">
                      <li>• Crie postagens (+25 XP)</li>
                      <li>• Faça comentários (+10 XP)</li>
                      <li>• Dê curtidas (+5 XP)</li>
                      <li>• Entre em clubes (+50 XP)</li>
                      <li>• Faça login diário (+20 XP)</li>
                      <li>• Desbloqueie conquistas (até +200 XP)</li>
                    </ul>
                  </div>

                  {/* Status atual */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <h4 className="text-white font-bold mb-3">📊 Status Atual</h4>
                    <div className="space-y-3 text-sm">
                      <div className="text-white/70">
                        Nível: <span className="text-white font-bold">{userLevel?.level || 1}</span>
                      </div>
                      <div className="text-white/70">
                        XP Total: <span className="text-white font-bold">{userLevel?.totalExperience.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && <SimpleAchievementsPanel />}
          </div>
        </div>
        </div>
      </GlobalBackground>
    </div>
  );
};