# 🚀 Como Aplicar a Migration do Sistema de Convites

## Passo a Passo

### 1. Acesse o Supabase Dashboard
- Vá para: https://app.supabase.com
- Faça login na sua conta
- Selecione o projeto: **fwwqduljnrsbsidxejqa**

### 2. Abra o SQL Editor
- No menu lateral esquerdo, clique em **SQL Editor**
- Ou acesse diretamente: https://app.supabase.com/project/fwwqduljnrsbsidxejqa/sql

### 3. Crie uma Nova Query
- Clique no botão **"New query"** (ou "+ New query")

### 4. Cole o SQL
- Abra o arquivo `apply-invites-migration.sql` (está na raiz do projeto)
- Copie TODO o conteúdo do arquivo
- Cole no editor SQL do Supabase

### 5. Execute a Migration
- Clique no botão **"Run"** (ou pressione Ctrl+Enter / Cmd+Enter)
- Aguarde a execução (deve levar alguns segundos)

### 6. Verifique o Sucesso
Você deve ver uma mensagem de sucesso no console. Verifique se as seguintes estruturas foram criadas:

#### Tabela criada:
- ✅ `invites`

#### Funções criadas:
- ✅ `generate_invite_code()`
- ✅ `create_invite(p_inviter_id)`
- ✅ `accept_invite(p_code, p_invitee_id)`
- ✅ `update_invite_stats()`

#### Colunas adicionadas em `profiles`:
- ✅ `invites_sent`
- ✅ `invites_accepted`

### 7. Teste o Sistema
Após aplicar a migration:
1. Recarregue a aplicação (F5)
2. Acesse `/invites`
3. Clique em "Gerar Código de Convite"
4. Deve funcionar sem erros!

## 🔍 Verificação Manual (Opcional)

Se quiser verificar manualmente se tudo foi criado:

### Verificar Tabela
```sql
SELECT * FROM public.invites LIMIT 1;
```

### Verificar Funções
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%invite%';
```

### Verificar Colunas em Profiles
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'invites%';
```

## ❌ Solução de Problemas

### Erro: "relation already exists"
- Isso é normal se você já tentou aplicar antes
- A migration tem `IF NOT EXISTS` e `CREATE OR REPLACE`, então é seguro executar novamente

### Erro: "permission denied"
- Certifique-se de estar logado como proprietário do projeto
- Verifique se está no projeto correto

### Erro: "function already exists"
- Execute este comando primeiro para limpar:
```sql
DROP FUNCTION IF EXISTS create_invite(UUID);
DROP FUNCTION IF EXISTS accept_invite(TEXT, UUID);
DROP FUNCTION IF EXISTS generate_invite_code();
```
- Depois execute a migration completa novamente

## 📝 Notas Importantes

- ⚠️ **Backup**: O Supabase faz backup automático, mas é sempre bom ter cuidado
- ✅ **Segurança**: A migration já inclui RLS (Row Level Security) configurado
- 🔄 **Reversível**: Se precisar reverter, há um script de rollback disponível

## 🎉 Após Aplicar

O sistema de convites estará 100% funcional:
- ✅ Geração de códigos únicos
- ✅ Compartilhamento via WhatsApp
- ✅ Aceitação automática de convites
- ✅ Estatísticas de convites
- ✅ Sistema de recompensas

## 💡 Dica

Se preferir, você também pode aplicar via CLI do Supabase:
```bash
supabase db push
```

Mas o método via SQL Editor é mais direto e visual.
