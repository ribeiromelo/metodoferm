# Estudei.clone - Sistema de Alta Performance

Um sistema de gestão de estudos focado em **Ciclos de Estudo** e **Edital Verticalizado**, inspirado nas melhores plataformas de concursos do mercado.

## 🚀 Funcionalidades

- **Ciclo de Estudos Automático**: O sistema sugere a próxima matéria baseada no seu ciclo, evitando que você precise planejar o dia.
- **Cronômetro de Foco**: Timer estilo Pomodoro integrado com registro de sessões.
- **Edital Verticalizado**: Gestão completa de matérias e tópicos com checkbox de conclusão.
- **Analytics**: Dashboard com horas líquidas, questões resolvidas e gráficos de constância.

## 🛠 Tecnologias

- **Backend**: Hono (TypeScript)
- **Frontend**: HTML5 + TailwindCSS + Chart.js
- **Database**: Cloudflare D1 (SQLite na Edge)
- **Plataforma**: Cloudflare Pages

## 📦 Como Rodar Localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure o Banco de Dados (D1):**
   ```bash
   # Aplica a estrutura das tabelas
   npm run db:migrate:local
   
   # Popula com dados iniciais (Opcional)
   npm run db:seed
   ```

3. **Inicie o Servidor:**
   ```bash
   npm run dev:sandbox
   # ou
   npm run dev
   ```

## 🗂 Estrutura do Projeto

- `/src`: Código fonte do Backend (Hono).
- `/public`: Arquivos estáticos (CSS, JS do Frontend).
- `/migrations`: Scripts SQL para o banco de dados.

## 📝 Licença

Uso pessoal e educacional.
