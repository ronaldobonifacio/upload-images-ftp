import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FiInfo } from 'react-icons/fi';
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

const Notification = ({ message, type, onClose }) => {
  const icons = {
    success: <FaCheckCircle />,
    error: <FaExclamationCircle />,
    warning: <FaExclamationTriangle />,
    info: <FiInfo />
  };

  return (
    <div className={`notification ${type}`}>
      <div className="notification-content">
        {icons[type] || icons.info}
        <span>{message}</span>
      </div>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
};

const UploadForm = () => {
  const [empresa, setEmpresa] = useState('00');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [validFiles, setValidFiles] = useState([]);
  const [invalidFiles, setInvalidFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const fileInputRef = useRef(null);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const ProgressBar = ({ progress }) => (
    <div className="progress-bar-container">
      <div 
        className="progress-bar-fill"
        style={{ width: `${progress}%` }}
      ></div>
      <div className="progress-bar-text">
        {progress}% completado ({validFiles.length} arquivos)
      </div>
    </div>
  );

  const handleEmpresaChange = (e) => {
    setEmpresa(e.target.value);
    resetValidation();
  };

  const resetValidation = () => {
    setValidFiles([]);
    setInvalidFiles([]);
    setUploadResults([]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    const jpgFiles = files.filter(file => 
      file.type === 'image/jpeg' || 
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg')
    );
    
    setSelectedFiles(jpgFiles);
    validateFileNames(jpgFiles);
  };

  const validateFileNames = async (files) => {
    if (files.length === 0) {
      resetValidation();
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:5000/validate', {
        empresa,
        filenames: files.map(f => f.name)
      });
      
      setValidFiles(response.data.validFiles);
      setInvalidFiles(response.data.invalidFiles);
    } catch (error) {
      console.error('Erro na validação:', error);
      addNotification('Falha ao validar arquivos', 'error');
    }
  };

  const removeFile = (filename) => {
    const newFiles = selectedFiles.filter(f => f.name !== filename);
    setSelectedFiles(newFiles);
    validateFileNames(newFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults([]);
    setNotifications([]);
    
    if (validFiles.length === 0) {
      addNotification('Nenhum arquivo válido para upload', 'warning');
      setIsUploading(false);
      return;
    }
    
    const results = [];
    const totalFiles = validFiles.length;
    
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = selectedFiles.find(f => f.name === validFiles[i]);
        const formData = new FormData();
        formData.append('empresa', empresa);
        formData.append('photos', file);

        try {
          const response = await axios.post('http://localhost:5000/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          results.push({
            filename: file.name,
            success: true,
            message: 'Enviado com sucesso'
          });
        } catch (error) {
          results.push({
            filename: file.name,
            success: false,
            message: `Erro: ${error.response?.data?.message || error.message}`
          });
        }
        
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        setUploadProgress(progress);
      }
      
      setUploadResults(results);
      addNotification('Upload concluído com sucesso!', 'success');
    } catch (error) {
      console.error('Erro geral no upload:', error);
      addNotification('Erro durante o upload', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-bold">Empresa</label>
          <select 
            className="form-select" 
            value={empresa} 
            onChange={handleEmpresaChange}
            disabled={isUploading}
          >
            <option value="00">Asa Branca</option>
            <option value="08">Rota Nordeste</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="form-label fw-bold">
            Selecione as fotos (apenas JPG)
          </label>
          <input 
            type="file" 
            className="form-control" 
            multiple 
            accept=".jpg,.jpeg"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isUploading}
          />
          <div className="form-text text-muted">
            {empresa === '00' 
              ? 'Nome deve conter EAN (13-14 dígitos)' 
              : 'Nome deve conter SKU (6 dígitos)'}
          </div>
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <h5 className="border-bottom pb-2">Pré-visualização</h5>
            <div className="preview-container">
              {selectedFiles.map((file, index) => {
                const isValid = validFiles.includes(file.name);
                const isInvalid = invalidFiles.includes(file.name);
                
                return (
                  <div 
                    key={index} 
                    className={`preview-item ${isValid ? 'border-success' : ''} ${isInvalid ? 'border-danger' : ''}`}
                  >
                    <div className="preview-image bg-light">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={file.name} 
                        className="img-fluid"
                      />
                    </div>
                    <div className="preview-details p-2">
                      <div className="d-flex justify-content-between">
                        <span className="filename text-truncate">{file.name}</span>
                        <span className="size badge bg-secondary">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      
                      <div className="mt-2 d-flex justify-content-between align-items-center">
                        {isValid && <span className="badge bg-success">Válido</span>}
                        {isInvalid && <span className="badge bg-danger">Inválido</span>}
                        
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeFile(file.name)}
                          disabled={isUploading}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {isUploading && (
          <div className="mb-4">
            <h5 className="border-bottom pb-2">Progresso do Upload</h5>
            <ProgressBar progress={uploadProgress} />
            <div className="upload-status mt-2">
              <FaCloudUploadAlt className="me-2" />
              Enviando arquivos...
            </div>
          </div>
        )}
        
        <div className="d-grid mb-4">
          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            disabled={isUploading || validFiles.length === 0}
          >
            {isUploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Enviando...
              </>
            ) : (
              'Enviar Fotos'
            )}
          </button>
        </div>
        
        {uploadResults.length > 0 && (
          <div className="mt-4">
            <h5 className="border-bottom pb-2">Resultados do Upload</h5>
            <div className="list-group">
              {uploadResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`list-group-item list-group-item-action ${result.success ? 'list-group-item-success' : 'list-group-item-danger'}`}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">{result.filename}</h6>
                    <small>{result.success ? '✅' : '❌'}</small>
                  </div>
                  <p className="mb-0">{result.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      <div className="notifications-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default UploadForm;