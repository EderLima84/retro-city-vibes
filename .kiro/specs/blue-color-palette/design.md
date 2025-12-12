# Design Document

## Overview

Esta feature implementa uma nova paleta de cores baseada em tons de azul escuro e azul claro para a aplicação Portella. A mudança será realizada através da atualização das variáveis CSS no arquivo `src/index.css`, mantendo a arquitetura existente do design system. A paleta azul proporcionará uma aparência moderna, profissional e coesa, mantendo a acessibilidade e legibilidade em todos os componentes.

## Architecture

A arquitetura do sistema de cores permanece inalterada, utilizando:

- **CSS Custom Properties (variáveis CSS)**: Definidas no `:root` para modo claro e `.dark` para modo escuro
- **Formato HSL**: Todas as cores são definidas em formato HSL (Hue, Saturation, Lightness)
- **Tailwind CSS**: Consome as variáveis CSS através do arquivo `tailwind.config.ts`
- **Cascata de estilos**: Componentes herdam automaticamente as cores através das classes do Tailwind

### Fluxo de aplicação das cores:

```
index.css (variáveis CSS) 
    ↓
tailwind.config.ts (mapeamento)
    ↓
Componentes (classes Tailwind)
    ↓
Interface renderizada
```

## Components and Interfaces

### Variáveis CSS Principais

As seguintes variáveis CSS serão atualizadas no arquivo `src/index.css`:

**Modo Claro (`:root`)**:
- `--background`: Azul muito claro, quase branco
- `--foreground`: Azul escuro para texto
- `--primary`: Azul médio vibrante
- `--secondary`: Azul claro
- `--accent`: Azul ciano para destaques
- `--muted`: Azul acinzentado claro
- `--card`: Branco azulado
- `--border`: Azul claro suave

**Modo Escuro (`.dark`)**:
- `--background`: Azul escuro profundo
- `--foreground`: Azul muito claro/branco
- `--primary`: Azul médio vibrante
- `--secondary`: Azul médio
- `--accent`: Azul ciano brilhante
- `--muted`: Azul escuro acinzentado
- `--card`: Azul escuro médio
- `--border`: Azul escuro

### Gradientes

Quatro gradientes principais serão redefinidos:
- `--gradient-orkut`: Azul escuro → Azul médio
- `--gradient-city`: Azul claro → Azul médio
- `--gradient-morning`: Azul claro suave → Azul céu
- `--gradient-afternoon`: Azul médio → Azul vibrante
- `--gradient-evening`: Azul escuro → Azul roxo
- `--gradient-night`: Azul muito escuro → Azul marinho profundo

### Sombras

Sombras serão ajustadas para usar tons de azul:
- `--shadow-card`: Sombra suave com azul escuro transparente
- `--shadow-elevated`: Sombra mais pronunciada com azul escuro
- `--shadow-glow`: Efeito de brilho com azul claro/ciano

## Data Models

Não há modelos de dados envolvidos nesta feature, apenas valores de cor em formato HSL.

### Estrutura de Cor HSL

Cada cor segue o formato:
```
--variable-name: H S% L%;
```

Onde:
- **H (Hue)**: 200-240 para tons de azul
- **S (Saturation)**: 40-90% dependendo da intensidade desejada
- **L (Lightness)**: 10-95% para controlar claro/escuro


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: All color variables use HSL format

*For any* color variable defined in the CSS, the value should follow the HSL format pattern (H S% L%) where H is a number, S is a percentage, and L is a percentage.

**Validates: Requirements 2.1**

### Property 2: All original CSS variables are preserved

*For any* CSS variable that existed in the original design system, that variable should still exist after the color palette change with the same variable name.

**Validates: Requirements 2.2**

### Property 3: Text contrast meets accessibility standards

*For any* combination of foreground and background colors in both light and dark modes, the contrast ratio should meet WCAG AA standards (minimum 4.5:1 for normal text).

**Validates: Requirements 1.4**

### Property 4: All blue colors use correct hue range

*For any* color variable intended to be blue (excluding destructive/error colors), the hue value should be in the range of 200-240 degrees, representing the blue spectrum.

**Validates: Requirements 1.1, 1.3, 1.5, 4.1, 4.2, 4.3, 5.1, 5.2**

## Error Handling

Esta feature envolve apenas mudanças de valores CSS, portanto não há tratamento de erros em runtime. No entanto:

- **Valores HSL inválidos**: Se valores HSL forem mal formatados, o navegador ignorará a propriedade e usará o valor padrão
- **Variáveis CSS não definidas**: Se uma variável for removida acidentalmente, componentes que a referenciam usarão valores fallback
- **Contraste insuficiente**: Deve ser detectado durante testes de acessibilidade

### Validação durante desenvolvimento:

1. Testes automatizados verificarão formato HSL
2. Testes de contraste validarão acessibilidade
3. Revisão visual manual confirmará aparência desejada

## Testing Strategy

Esta feature utilizará uma abordagem de testes focada em validação de valores CSS e acessibilidade.

### Unit Tests

Unit tests serão usados para:
- Verificar que o arquivo CSS pode ser parseado corretamente
- Validar exemplos específicos de cores (ex: background é azul claro no modo claro)
- Confirmar que variáveis específicas existem (ex: --primary, --secondary, --accent)
- Testar casos de borda como modo escuro vs claro

### Property-Based Tests

Property-based tests serão implementados usando **fast-check** (biblioteca de PBT para TypeScript/JavaScript). Cada teste deve executar no mínimo 100 iterações.

Os testes de propriedade verificarão:

1. **Formato HSL universal**: Gerar todas as variáveis de cor e verificar que cada uma segue o padrão HSL
   - **Feature: blue-color-palette, Property 1: All color variables use HSL format**

2. **Preservação de variáveis**: Comparar lista de variáveis antes e depois, garantindo que nenhuma foi removida
   - **Feature: blue-color-palette, Property 2: All original CSS variables are preserved**

3. **Contraste de acessibilidade**: Para todas as combinações de foreground/background, calcular razão de contraste
   - **Feature: blue-color-palette, Property 3: Text contrast meets accessibility standards**

4. **Faixa de hue azul**: Para todas as variáveis de cor azul, extrair o valor H e verificar se está entre 200-240
   - **Feature: blue-color-palette, Property 4: All blue colors use correct hue range**

### Ferramentas de teste:

- **Vitest**: Framework de testes já configurado no projeto
- **fast-check**: Biblioteca de property-based testing para JavaScript/TypeScript
- **PostCSS** ou **CSS Parser**: Para parsear e extrair variáveis CSS
- **Calculadora de contraste**: Implementação do algoritmo WCAG para calcular razões de contraste

### Estratégia de execução:

1. Implementar mudanças nas variáveis CSS
2. Executar testes de propriedade para validar correção
3. Executar testes unitários para casos específicos
4. Realizar revisão visual manual da interface
5. Validar em diferentes navegadores e dispositivos
