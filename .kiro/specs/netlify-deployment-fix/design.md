# Design Document

## Overview

Este design aborda os problemas de deployment no Netlify relacionados a MIME types incorretos e recursos ausentes. A solução envolve criar arquivos de configuração específicos do Netlify (_headers e netlify.toml) para garantir que todos os recursos sejam servidos corretamente e que o roteamento SPA funcione adequadamente.

## Architecture

A solução consiste em três componentes principais:

1. **Configuração de Headers HTTP** - Arquivo `_headers` no diretório public para definir MIME types corretos
2. **Configuração do Netlify** - Arquivo `netlify.toml` na raiz do projeto para configurar build e redirects
3. **Validação de Build** - Scripts e processos para verificar a integridade do build antes do deploy

### Fluxo de Deploy

```
Build Local (vite build)
    ↓
Validação de Assets
    ↓
Deploy para Netlify
    ↓
Netlify aplica _headers
    ↓
Netlify aplica redirects (SPA routing)
    ↓
Aplicação servida corretamente
```

## Components and Interfaces

### 1. Arquivo _headers

Localização: `public/_headers`

Este arquivo define headers HTTP customizados para diferentes tipos de recursos:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/*.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/*.mjs
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Content-Type: text/css; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/*.jpg
  Content-Type: image/jpeg
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Content-Type: image/png
  Cache-Control: public, max-age=31536000, immutable

/*.svg
  Content-Type: image/svg+xml
  Cache-Control: public, max-age=31536000, immutable
```

### 2. Arquivo netlify.toml

Localização: raiz do projeto

Configurações de build e redirects:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/*.js"
  [headers.values]
    Content-Type = "application/javascript; charset=utf-8"
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.mjs"
  [headers.values]
    Content-Type = "application/javascript; charset=utf-8"
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Content-Type = "text/css; charset=utf-8"
    Cache-Control = "public, max-age=31536000, immutable"
```

### 3. Script de Validação de Build

Adicionar ao package.json:

```json
{
  "scripts": {
    "validate-build": "node scripts/validate-build.js"
  }
}
```

## Data Models

Não há modelos de dados específicos para esta feature, pois trata-se de configuração de infraestrutura.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

Após análise do prework, identifiquei as seguintes redundâncias:
- Critério 3.4 é redundante com 1.4 (ambos testam headers HTTP apropriados)
- Critério 4.3 é redundante com 2.3 (ambos validam caminhos de recursos)

Propriedades consolidadas focam em:
1. Headers corretos para tipos de arquivo (propriedade universal)
2. Cópia completa de assets do public para dist (propriedade universal)
3. Validação de referências HTML (propriedade universal)
4. SPA routing funcionando para todas as rotas (propriedade universal)
5. Servir arquivos estáticos corretamente (propriedade universal)

### Property 1: Headers corretos por tipo de arquivo

*Para qualquer* arquivo servido pelo Netlify, o Content-Type header deve corresponder ao tipo MIME apropriado para a extensão do arquivo (.js → application/javascript, .css → text/css, .jpg → image/jpeg, etc.)

**Validates: Requirements 1.1, 1.2, 1.4**

### Property 2: Completude de assets públicos

*Para qualquer* arquivo no diretório public, após executar o build, esse arquivo deve existir no diretório dist com o mesmo caminho relativo

**Validates: Requirements 2.2**

### Property 3: Validação de referências HTML

*Para qualquer* referência a recurso no index.html (src, href, content em meta tags), o arquivo referenciado deve existir no diretório dist após o build

**Validates: Requirements 2.3**

### Property 4: SPA routing universal

*Para qualquer* rota client-side da aplicação, quando acessada diretamente ou via refresh, o servidor deve retornar o arquivo index.html com status 200 (não 404)

**Validates: Requirements 3.1, 3.3**

### Property 5: Servir arquivos estáticos corretamente

*Para qualquer* arquivo estático no diretório dist, quando solicitado pelo navegador, o servidor deve retornar o arquivo com status 200 e headers apropriados

**Validates: Requirements 3.2**

## Error Handling

### Erros de MIME Type

- **Problema**: Servidor retorna application/octet-stream para arquivos JS
- **Solução**: Configurar headers explícitos via _headers e netlify.toml
- **Fallback**: Se _headers falhar, netlify.toml deve ter configuração redundante

### Recursos 404

- **Problema**: Arquivos referenciados não existem no build
- **Solução**: Script de validação que verifica todas as referências antes do deploy
- **Ação**: Build deve falhar se recursos críticos estiverem ausentes

### Problemas de SPA Routing

- **Problema**: Rotas client-side retornam 404 em refresh
- **Solução**: Redirect catch-all no netlify.toml que retorna index.html para todas as rotas
- **Prioridade**: Arquivos estáticos devem ter precedência sobre o redirect

### Erros de Cache

- **Problema**: Navegador usa versões antigas de arquivos
- **Solução**: Headers de cache com immutable para assets com hash, sem cache para index.html
- **Estratégia**: Vite gera hashes nos nomes de arquivo para cache busting

## Testing Strategy

### Testes de Configuração (Examples)

Testes específicos que verificam comportamentos concretos:

1. **Teste de MIME type para JS**: Fazer requisição HTTP para um arquivo .js e verificar Content-Type header
2. **Teste de favicon**: Verificar que /favicon.ico retorna 200 e não 404
3. **Teste de portella-logo.jpg**: Verificar que o arquivo existe em dist após build
4. **Teste de build completo**: Executar `npm run build` e verificar que dist/ é criado
5. **Teste de console errors**: Carregar aplicação e verificar que não há erros de MIME type no console

### Testes Baseados em Propriedades

Testes que verificam propriedades universais:

**Framework**: Usaremos **fast-check** para property-based testing em TypeScript/JavaScript

**Configuração**: Cada teste deve executar no mínimo 100 iterações

**Propriedades a testar**:

1. **Property 1 - Headers por tipo**: Gerar lista de arquivos com diferentes extensões, verificar que cada um recebe o Content-Type correto
   - **Feature: netlify-deployment-fix, Property 1: Headers corretos por tipo de arquivo**

2. **Property 2 - Completude de assets**: Listar todos os arquivos em public/, verificar que todos existem em dist/ após build
   - **Feature: netlify-deployment-fix, Property 2: Completude de assets públicos**

3. **Property 3 - Validação de referências**: Parsear index.html, extrair todas as referências, verificar que todos os arquivos existem
   - **Feature: netlify-deployment-fix, Property 3: Validação de referências HTML**

4. **Property 4 - SPA routing**: Gerar rotas aleatórias, verificar que todas retornam index.html
   - **Feature: netlify-deployment-fix, Property 4: SPA routing universal**

5. **Property 5 - Arquivos estáticos**: Listar arquivos em dist/, verificar que todos são servidos com status 200
   - **Feature: netlify-deployment-fix, Property 5: Servir arquivos estáticos corretamente**

### Testes de Integração

- Executar build local e preview para simular ambiente de produção
- Usar ferramentas como Playwright para testes end-to-end
- Verificar que não há erros no console do navegador
- Testar navegação entre rotas e refresh de página

### Validação Pré-Deploy

Script `validate-build.js` que executa antes do deploy:
1. Verifica que dist/ existe e não está vazio
2. Valida que todos os arquivos referenciados no HTML existem
3. Verifica que arquivos críticos (favicon, logos) estão presentes
4. Reporta warnings para recursos ausentes não-críticos

## Implementation Notes

### Ordem de Implementação

1. Criar arquivo netlify.toml com configurações básicas
2. Criar arquivo _headers no diretório public
3. Criar script de validação de build
4. Adicionar testes de exemplo para casos específicos
5. Implementar property-based tests para propriedades universais
6. Testar localmente com `npm run preview`
7. Deploy para Netlify e validar em produção

### Considerações de Performance

- Headers de cache com `immutable` para assets com hash (JS, CSS)
- Sem cache para index.html para garantir atualizações
- Compressão gzip/brotli habilitada automaticamente pelo Netlify

### Compatibilidade

- Configuração funciona com Vite 5.x
- Headers compatíveis com todos os navegadores modernos
- Redirects funcionam com React Router v6

### Monitoramento

- Verificar logs do Netlify após deploy
- Monitorar erros no console do navegador via ferramentas de analytics
- Testar em diferentes navegadores e dispositivos
