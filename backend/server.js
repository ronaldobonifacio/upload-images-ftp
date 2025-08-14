require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ftp = require('basic-ftp');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST']
}));

// Configuração do Multer para uploads temporários
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = 'uploads/';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Configuração do FTP
const ftpConfig = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  port: parseInt(process.env.FTP_PORT) || 21,
  secure: process.env.FTP_SECURE === 'true',
  timeout: 10000,
  connectionTimeout: 10000
};

// Função para testar conexão FTP
async function testFtpConnection() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log("Testando conexão FTP com:", {
      host: ftpConfig.host,
      port: ftpConfig.port,
      user: ftpConfig.user,
      secure: ftpConfig.secure
    });
    
    await client.access(ftpConfig);
    console.log("✅ Conexão FTP bem-sucedida!");
    return true;
  } catch (error) {
    console.error("❌ Erro na conexão FTP:", error.message);
    throw new Error(`Falha na conexão FTP: ${error.message}`);
  } finally {
    client.close();
  }
}

// Função para validar nome do arquivo
function isValidFilename(filename, empresa) {
  const baseName = filename.split('.')[0]; // Remover extensão
  
  if (empresa === '00') { // Asa Branca
    return /^\d{13,14}$/.test(baseName);
  } else if (empresa === '08') { // Rota Nordeste
    return /^\d{6}$/.test(baseName);
  }
  return false;
}

// Verificar se podemos acessar a pasta de envio
async function verifyUploadDirAccess() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    await client.access(ftpConfig);
    
    const uploadDir = process.env.FTP_UPLOAD_DIR || 'Envio';
    
    try {
      await client.cd(uploadDir);
      console.log(`✅ Acesso à pasta de envio '${uploadDir}' confirmado`);
      return true;
    } catch (error) {
      console.error(`❌ Não foi possível acessar a pasta de envio '${uploadDir}':`, error.message);
      throw new Error(`A pasta de envio '${uploadDir}' não existe ou não pode ser acessada`);
    }
  } finally {
    client.close();
  }
}

// Rota para validação
app.post('/validate', express.json(), (req, res) => {
  const { empresa, filenames } = req.body;
  
  if (!empresa || !filenames || !Array.isArray(filenames)) {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }
  
  const validFiles = [];
  const invalidFiles = [];
  
  filenames.forEach(filename => {
    if (isValidFilename(filename, empresa)) {
      validFiles.push(filename);
    } else {
      invalidFiles.push(filename);
    }
  });
  
  res.json({ validFiles, invalidFiles });
});

// Rota para upload
app.post('/upload', upload.array('photos'), async (req, res) => {
  const { empresa } = req.body;
  const files = req.files;
  
  if (!empresa || !files || files.length === 0) {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }
  
  const results = [];
  const uploadDir = process.env.FTP_UPLOAD_DIR || 'Envio';
  
  try {
    // Verificar acesso à pasta de envio
    await verifyUploadDirAccess();
    
    const client = new ftp.Client();
    client.ftp.verbose = true;
    client.ftp.timeout = 10000;
    
    try {
      await client.access(ftpConfig);
      await client.cd(uploadDir); // Entrar na pasta de envio
      
      // Enviar arquivos individualmente
      for (const file of files) {
        try {
          const localPath = file.path;
          
          if (!fs.existsSync(localPath)) {
            throw new Error(`Arquivo temporário não encontrado: ${localPath}`);
          }
          
          console.log(`Enviando: ${file.originalname} para /${uploadDir}`);
          await client.uploadFrom(localPath, file.originalname);
          
          results.push({ 
            filename: file.originalname, 
            success: true,
            message: 'Enviado com sucesso' 
          });
        } catch (error) {
          console.error(`❌ Erro no envio de ${file.originalname}:`, error.message);
          results.push({ 
            filename: file.originalname, 
            success: false,
            message: `Erro: ${error.message}` 
          });
        } finally {
          // Remover arquivo temporário
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
      
      res.json({ 
        success: true, 
        message: 'Upload concluído',
        results 
      });
    } finally {
      client.close();
    }
  } catch (error) {
    console.error("Erro durante o upload em lote:", error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Iniciar servidor com verificação de conexão
app.listen(port, async () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Pasta de envio FTP: ${process.env.FTP_UPLOAD_DIR || 'Envio'}`);
  
  try {
    await testFtpConnection();
    await verifyUploadDirAccess();
  } catch (error) {
    console.error("⚠️ AVISO: Problema na configuração FTP");
    console.error(error.message);
  }
});