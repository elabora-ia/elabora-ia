# Gerador de Provas Pedagógicas

Ferramenta web para geração de provas e questões com IA.

## Deploy no Vercel

### 1. Suba para o GitHub
- Crie um repositório no GitHub (pode ser privado)
- Faça upload de todos os arquivos desta pasta

### 2. Conecte ao Vercel
- Acesse vercel.com e faça login com sua conta GitHub
- Clique em "Add New Project"
- Selecione o repositório que criou
- Clique em "Deploy"

### 3. Configure a chave da API
- No painel do Vercel, vá em Settings → Environment Variables
- Adicione a variável:
  - **Name:** `ANTHROPIC_API_KEY`
  - **Value:** sua chave `sk-ant-api03-...`
- Clique em Save e depois em "Redeploy"

### 4. Acesse
- O Vercel fornecerá um endereço como `https://gerador-provas-xxx.vercel.app`
- Compartilhe com outros professores — funciona em qualquer navegador

## Estrutura
```
gerador-provas/
├── api/
│   └── chat.js          ← backend (proxy seguro para a API Anthropic)
├── public/
│   └── index.html       ← frontend (toda a interface)
├── vercel.json          ← configuração do Vercel
└── README.md
```

## Desenvolvimento local
Se quiser testar localmente antes do deploy:
1. Instale o Vercel CLI: `npm i -g vercel`
2. Crie um arquivo `.env` com: `ANTHROPIC_API_KEY=sua-chave`
3. Rode: `vercel dev`
