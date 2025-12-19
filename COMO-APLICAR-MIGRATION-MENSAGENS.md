# Como Aplicar a Migration do Sistema de Mensagens em Grupo

## Passo 1: Aplicar a Migration no Supabase

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em "SQL Editor"
4. Clique em "New Query"
5. Copie todo o conteúdo do arquivo `apply-group-messaging-migration.sql`
6. Cole no editor SQL
7. Clique em "Run" para executar

## Passo 2: Verificar se as Tabelas Foram Criadas

No SQL Editor, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'group_chats',
  'group_members', 
  'group_messages',
  'message_read_status',
  'conversation_mutes',
  'typing_indicators'
);
```

Você deve ver todas as 6 tabelas listadas.

## Passo 3: Regenerar os Tipos do Supabase

Execute no terminal do projeto:

```bash
npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/integrations/supabase/types.ts
```

Substitua `SEU_PROJECT_ID` pelo ID do seu projeto (encontrado na URL do dashboard).

Alternativamente, você pode usar:

```bash
npx supabase gen types typescript --db-url "postgresql://postgres:[SUA-SENHA]@[SEU-HOST]:5432/postgres" > src/integrations/supabase/types.ts
```

## Passo 4: Testar o Sistema

Após aplicar a migration e regenerar os tipos:

1. Reinicie o servidor de desenvolvimento
2. Faça login na aplicação
3. Acesse a página de Mensagens
4. Os erros de TypeScript devem desaparecer

## Estrutura das Tabelas Criadas

### group_chats
- Armazena informações dos grupos (nome, avatar, criador)

### group_members
- Relaciona usuários com grupos
- Define roles (admin/member)

### group_messages
- Armazena mensagens enviadas em grupos
- Suporta soft delete (deleted_at)

### message_read_status
- Rastreia quais mensagens foram lidas por quais usuários

### conversation_mutes
- Permite usuários silenciarem conversas (privadas ou em grupo)

### typing_indicators
- Rastreia indicadores de digitação em tempo real

## Funções Criadas

- `get_group_unread_count(group_id, user_id)` - Retorna contagem de mensagens não lidas
- `mark_group_messages_read(group_id, user_id)` - Marca todas as mensagens como lidas
- `cleanup_old_typing_indicators()` - Remove indicadores de digitação antigos

## Próximos Passos

Após aplicar a migration, você pode:

1. Criar o componente `CreateGroupDialog` para criar novos grupos
2. Implementar o componente `ManageMembersDialog` para gerenciar membros
3. Implementar o componente `GroupSettingsDialog` para editar configurações do grupo
4. Atualizar a página Messages.tsx para usar ConversationsList e suportar grupos
