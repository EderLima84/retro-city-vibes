# Requirements Document

## Introduction

Esta feature visa redesenhar a paleta de cores da aplicação Portella, substituindo a atual paleta inspirada no Nordeste brasileiro (tons de terracota, amarelo mostarda e verde) por uma paleta moderna baseada em tons de azul escuro e azul claro. A mudança deve manter a identidade visual coesa e garantir boa legibilidade e acessibilidade em todos os componentes da interface.

## Glossary

- **Design System**: Conjunto de variáveis CSS que definem cores, gradientes, sombras e outros elementos visuais da aplicação
- **HSL**: Formato de cor (Hue, Saturation, Lightness) usado no sistema de design
- **Theme**: Conjunto de cores aplicadas à interface, incluindo modo claro e escuro
- **Primary Color**: Cor principal usada para elementos de destaque e ações primárias
- **Secondary Color**: Cor secundária usada para elementos de suporte
- **Accent Color**: Cor de destaque usada para chamar atenção em elementos específicos
- **Gradient**: Transição suave entre duas ou mais cores
- **CSS Variables**: Variáveis customizadas do CSS definidas com prefixo `--`

## Requirements

### Requirement 1

**User Story:** Como usuário da aplicação, eu quero ver uma interface com paleta de cores azul, para que a experiência visual seja moderna e profissional.

#### Acceptance Criteria

1. WHEN a aplicação é carregada THEN o sistema SHALL exibir cores primárias em tons de azul escuro
2. WHEN elementos de destaque são renderizados THEN o sistema SHALL aplicar tons de azul claro para contraste
3. WHEN o usuário visualiza cards e containers THEN o sistema SHALL usar fundos em tons de azul muito claro ou branco azulado
4. WHEN texto é exibido sobre fundos azuis THEN o sistema SHALL garantir contraste adequado para legibilidade
5. WHEN gradientes são aplicados THEN o sistema SHALL usar transições entre tons de azul escuro e azul claro

### Requirement 2

**User Story:** Como desenvolvedor, eu quero que todas as cores sejam definidas em variáveis CSS centralizadas, para que a manutenção seja simples e consistente.

#### Acceptance Criteria

1. WHEN variáveis de cor são definidas THEN o sistema SHALL usar formato HSL para todas as cores
2. WHEN o arquivo index.css é modificado THEN o sistema SHALL manter a estrutura de variáveis CSS existente
3. WHEN cores são alteradas THEN o sistema SHALL atualizar apenas as variáveis CSS sem modificar componentes individuais
4. WHEN o tema escuro é ativado THEN o sistema SHALL aplicar variações apropriadas dos tons de azul

### Requirement 3

**User Story:** Como usuário, eu quero que o modo escuro também use a paleta azul, para que a experiência seja consistente em ambos os modos.

#### Acceptance Criteria

1. WHEN o modo escuro é ativado THEN o sistema SHALL usar azul escuro profundo como cor de fundo
2. WHEN elementos são renderizados no modo escuro THEN o sistema SHALL usar tons de azul médio para cards e containers
3. WHEN texto é exibido no modo escuro THEN o sistema SHALL usar tons de azul claro ou branco para legibilidade
4. WHEN gradientes são aplicados no modo escuro THEN o sistema SHALL usar transições entre azuis escuros e médios

### Requirement 4

**User Story:** Como designer, eu quero que gradientes e sombras reflitam a nova paleta azul, para que todos os elementos visuais sejam coesos.

#### Acceptance Criteria

1. WHEN gradientes são definidos THEN o sistema SHALL criar transições entre diferentes tons de azul
2. WHEN sombras são aplicadas THEN o sistema SHALL usar tons de azul escuro com transparência
3. WHEN efeitos de brilho são usados THEN o sistema SHALL aplicar tons de azul claro com transparência
4. WHEN gradientes baseados em horário são renderizados THEN o sistema SHALL adaptar os tons de azul para cada período do dia

### Requirement 5

**User Story:** Como usuário, eu quero que badges e elementos especiais usem variações da paleta azul, para que a identidade visual seja mantida.

#### Acceptance Criteria

1. WHEN badges são exibidos THEN o sistema SHALL usar diferentes tons de azul para cada tipo de badge
2. WHEN cores de destaque são necessárias THEN o sistema SHALL usar azul claro vibrante ou ciano
3. WHEN cores de alerta são exibidas THEN o sistema SHALL manter vermelho para destrutivo mas adaptar outros alertas para azul
4. WHEN elementos interativos são focados THEN o sistema SHALL usar anel de foco em tom de azul primário
