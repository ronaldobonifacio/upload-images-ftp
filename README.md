# 📤 FTP Upload Manager

![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-16.x-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

Aplicação full-stack para gerenciamento de upload de imagens para servidor FTP com validação inteligente e interface amigável.

## ✨ Funcionalidades Principais

- **🖼️ Upload Multiarquivo**  
  Selecione múltiplas imagens JPG de uma só vez
- **🏷️ Validação Inteligente**  
  Verificação automática de nomes conforme padrão da empresa:
  - Asa Branca: EAN (13-14 dígitos)
  - Rota Nordeste: SKU (6 dígitos)
- **📊 Progresso em Tempo Real**  
  Barra de progresso visual com porcentagem e contagem
- **🔔 Sistema de Notificações**  
  Alertas elegantes para sucesso, erros e avisos
- **👁️ Pré-visualização**  
  Visualização em miniatura das imagens antes do envio
- **⚙️ Configuração Flexível**  
  Credenciais FTP via arquivo `.env`

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React** 18 com Hooks
- **React Icons** para ícones profissionais
- **Axios** para requisições HTTP
- **Bootstrap** 5 para estilos responsivos

### Backend
- **Node.js** com Express
- **Multer** para upload de arquivos
- **Basic-FTP** para conexão com servidor FTP
- **Dotenv** para gerenciamento de variáveis de ambiente

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 16.x ou superior
- NPM ou Yarn
- Servidor FTP configurado

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/ftp-upload-app.git
   cd ftp-upload-app
   ```

2. **Configure o backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edite o .env com suas credenciais FTP
   ```

3. **Configure o frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Inicie os servidores**  
   Em **terminais separados**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

## ⚙️ Configuração do Ambiente

Arquivo `.env` do backend:
```ini
# FTP Configuration
FTP_HOST=seu.servidor.ftp
FTP_USER=usuario
FTP_PASSWORD=senha
FTP_PORT=21
FTP_SECURE=false
FTP_UPLOAD_DIR=Envio

# Server
PORT=5000
NODE_ENV=development
```

## 📂 Estrutura de Arquivos
```
ftp-upload-app/
├── backend/
│   ├── server.js          # Servidor Node.js principal
│   ├── .env               # Configurações de ambiente
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadForm.js    # Componente principal
│   │   │   └── Notification.js  # Componente de notificação
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🤝 Contribuição
1. Faça um fork do projeto  
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)  
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)  
4. Push para a branch (`git push origin feature/AmazingFeature`)  
5. Abra um Pull Request

<img width="700" height="864" alt="image" src="https://github.com/user-attachments/assets/16172ab5-7049-4711-bba4-81e3f161b10b" />
