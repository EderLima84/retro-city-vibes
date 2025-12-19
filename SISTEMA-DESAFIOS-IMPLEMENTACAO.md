# 🎮 Sistema de Desafios e Níveis - Guia de Implementação

## ✅ O Que Foi Criado

### 📊 Estrutura do Banco de Dados

#### Tabelas:
1. **challenges** - Desafios disponíveis (diários, semanais, mensais)
2. **user_challenges** - Progresso dos usuários nos desafios
3. **levels** - Níveis e recompensas
4. **xp_history** - Histórico de XP ganho

#### Campos Adicionados em `profiles`:
- `xp` - XP atual do nível
- `total_xp` - XP total acumulado
- `current_streak` - Sequência de dias consecutivos
- `longest_streak` - Maior sequência alcançada
- `last_activity_date` - Última data de atividade

### 🎯 Tipos de Desafios

#### Diários (renovam todo dia):
- Primeira Visita do Dia
- Socializar na Praça
- Fazer Amizades
- Explorador Diário
- Curtir e Compartilhar

#### Semanais (renovam toda semana):
- Semana Social
- Criador de Conteúdo
- Engajamento Total
- Explorador Semanal
- Mensageiro Ativo

#### Mensais (renovam todo mês):
- Mestre Social
- Influenciador
- Pilar da Comunidade
- Convite Mestre
- Explorador Completo

### 🏆 Sistema de Níveis

10 níveis implementados:
1. Novo Cidadão (0 XP) 🌱
2. Vizinho Amigável (100 XP) 👋
3. Morador Ativo (250 XP) 🏠
4. Cidadão Engajado (500 XP) ⭐
5. Pilar da Comunidade (1000 XP) 🌟
6. Líder Comunitário (2000 XP) 👑
7. Guardião da Cidade (3500 XP) 🛡️
8. Lenda Viva (5500 XP) 🏆
9. Ícone de Orkadia (8000 XP) 💎
10. Fundador Honorário (12000 XP) 👑✨

### ⚡ Funções Criadas

1. **calculate_level(xp)** - Calcula nível baseado em XP
2. **add_xp(user_id, amount, source, description)** - Adiciona XP e verifica level up
3. **update_challenge_progress(user_id, challenge_id, increment)** - Atualiza progresso
4. **update_daily_streak(user_id)** - Atualiza sequência diária

## 🚀 Como Aplicar

### Passo 1: Aplicar Migration
```bash
# Opção 1: Via Supabase Dashboard
1. Acesse: https://app.supabase.com/project/fwwqduljnrsbsidxejqa/sql
2. Copie o conteúdo de: supabase/migrations/20251214100000_create_challenges_system.sql
3. Cole no SQL Editor
4. Clique em "Run"

# Opção 2: Via CLI
supabase db push
```

### Passo 2: Verificar Instalação
```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('challenges', 'user_challenges', 'levels', 'xp_history');

-- Verificar desafios
SELECT COUNT(*) FROM challenges;

-- Verificar níveis
SELECT * FROM levels ORDER BY level;
```

## 💻 Próximos Componentes a Criar

### 1. Página de Desafios (`/challenges`)
- Lista de desafios diários, semanais e mensais
- Progresso visual de cada desafio
- Recompensas disponíveis
- Botão para reivindicar recompensas

### 2. Componente de Progresso de Nível
- Barra de progresso de XP
- Nível atual e próximo
- XP necessário para próximo nível
- Badge do nível atual

### 3. Componente de Streak
- Contador de dias consecutivos
- Calendário visual
- Bônus de streak
- Motivação para manter streak

### 4. Dashboard de Ranking
- Top 10 usuários por XP
- Posição do usuário
- Comparação com amigos
- Filtros por período

### 5. Sistema de Notificações
- Notificar quando completar desafio
- Notificar quando subir de nível
- Notificar novos desafios disponíveis
- Notificar bônus de streak

## 🎨 Integrações Necessárias

### Eventos que Devem Atualizar Desafios:

```typescript
// Ao fazer login
await supabase.rpc('update_daily_streak', { p_user_id: user.id });

// Ao publicar post
await supabase.rpc('update_challenge_progress', {
  p_user_id: user.id,
  p_challenge_id: 'challenge_id_aqui',
  p_increment: 1
});

// Ao fazer amizade
await supabase.rpc('update_challenge_progress', {
  p_user_id: user.id,
  p_challenge_id: 'fazer_amizades_id',
  p_increment: 1
});
```

## 📈 Métricas e Gamificação

### Recompensas por Ação:
- Login diário: 25 XP
- Publicar post: 30 XP
- Fazer amigo: 40 XP
- Completar desafio diário: 25-40 XP
- Completar desafio semanal: 80-160 XP
- Completar desafio mensal: 300-800 XP
- Bônus de streak (7 dias): 100 XP

### Sistema de Pontos:
- XP = Experiência (para subir de nível)
- Pontos = Moeda interna (para comprar itens/benefícios)

## 🔄 Manutenção Automática

### Limpeza de Desafios Expirados:
```sql
-- Executar diariamente via cron job
DELETE FROM user_challenges 
WHERE expires_at < NOW() 
AND completed = false;
```

### Resetar Desafios:
```sql
-- Desafios diários: resetam automaticamente (expires_at)
-- Desafios semanais: resetam automaticamente (expires_at)
-- Desafios mensais: resetam automaticamente (expires_at)
```

## 🎁 Ideias de Recompensas

### Por Nível:
- Badges exclusivos
- Títulos especiais
- Cores de perfil personalizadas
- Acesso a áreas VIP
- Multiplicadores de XP
- Itens cosméticos

### Por Desafios:
- XP bônus
- Pontos extras
- Badges temporários
- Destaque no ranking
- Recursos premium temporários

## 📝 Notas Importantes

- ✅ Sistema totalmente funcional após aplicar migration
- ✅ RLS (Row Level Security) configurado
- ✅ Funções otimizadas para performance
- ✅ Histórico completo de XP
- ✅ Sistema de streak implementado
- ✅ Desafios auto-renováveis

## 🐛 Troubleshooting

### Erro: "function not found"
- Certifique-se de que a migration foi aplicada completamente
- Verifique se todas as funções foram criadas

### Desafios não aparecem
- Verifique se `is_active = true` nos desafios
- Confirme que as policies estão corretas

### XP não atualiza
- Verifique se a função `add_xp` está funcionando
- Confirme que o user_id está correto

---

**Sistema pronto para uso!** 🎉

Próximo passo: Criar os componentes React para interface do usuário.
