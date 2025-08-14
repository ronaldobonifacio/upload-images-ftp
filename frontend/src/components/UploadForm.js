import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FiInfo } from "react-icons/fi";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCloudUploadAlt,
  FaTrash,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

/**
 * UploadForm.jsx
 * - Botões Enviar & Excluir tudo do mesmo tamanho (.btn-action-large)
 * - Excluir tudo só aparece quando houver itens selecionados
 * - Barra de progresso refeita (.project-progress)
 *
 * Use junto com seu app.css (adicionar trecho CSS fornecido abaixo).
 */

const Notification = ({ message, type, onClose }) => {
  const icons = {
    success: <FaCheckCircle />,
    error: <FaTimesCircle />,
    warning: <FaExclamationTriangle />,
    info: <FiInfo />,
  };

  return (
    <div className={`notification ${type}`}>
      <div className="notification-content">
        <span className="notification-icon">{icons[type] || icons.info}</span>
        <span className="notification-text">{message}</span>
      </div>
      <button className="notification-close" onClick={onClose} aria-label="Fechar">
        <FaTimes />
      </button>
    </div>
  );
};

const UploadForm = ({ onEmpresaChange = () => {} }) => {
  const [empresa, setEmpresa] = useState("00");
  const [selectedFiles, setSelectedFiles] = useState([]); // { file, url }
  const [validFiles, setValidFiles] = useState([]);
  const [invalidFiles, setInvalidFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const fileInputRef = useRef(null);

  const addNotification = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const ProgressBar = ({ progress }) => (
    <div className="project-progress-wrap">
      <div className="project-progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
        <div className="project-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="project-progress-info">
        <span>{progress}%</span>
        <small>{validFiles.length} arquivo(s) válidos</small>
      </div>
    </div>
  );

  const handleEmpresaChange = (e) => {
    const newEmpresa = e.target.value;
    setEmpresa(newEmpresa);
    onEmpresaChange(newEmpresa);
    resetValidation();
  };

  const revokeUrls = (filesArr) => {
    filesArr.forEach((f) => {
      try {
        URL.revokeObjectURL(f.url);
      } catch (e) {
        // ignore
      }
    });
  };

  const resetValidation = () => {
    revokeUrls(selectedFiles);
    setSelectedFiles([]);
    setValidFiles([]);
    setInvalidFiles([]);
    setUploadResults([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    const allowed = files.filter(
      (file) =>
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.name.toLowerCase().endsWith(".jpg") ||
        file.name.toLowerCase().endsWith(".jpeg") ||
        file.name.toLowerCase().endsWith(".png")
    );

    revokeUrls(selectedFiles);

    const withUrls = allowed.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setSelectedFiles(withUrls);
    validateFileNames(withUrls);
  };

  const validateFileNames = async (filesWithUrls) => {
    if (!filesWithUrls || filesWithUrls.length === 0) {
      resetValidation();
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/validate", {
        empresa,
        filenames: filesWithUrls.map((f) => f.file.name),
      });

      setValidFiles(response.data.validFiles || []);
      setInvalidFiles(response.data.invalidFiles || []);
    } catch (error) {
      console.error("Erro na validação:", error);
      addNotification("Falha ao validar arquivos", "error");
      setValidFiles([]);
      setInvalidFiles(filesWithUrls.map((f) => f.file.name));
    }
  };

  const removeFile = (filename) => {
    const newFiles = selectedFiles.filter((f) => f.file.name !== filename);
    const removed = selectedFiles.filter((f) => f.file.name === filename);
    revokeUrls(removed);
    setSelectedFiles(newFiles);
    validateFileNames(newFiles);
  };

  const removeAll = () => {
    revokeUrls(selectedFiles);
    setSelectedFiles([]);
    setValidFiles([]);
    setInvalidFiles([]);
    setUploadResults([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    addNotification("Todos os arquivos removidos", "info");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults([]);
    setNotifications([]);

    if (!validFiles || validFiles.length === 0) {
      addNotification("Nenhum arquivo válido para upload", "warning");
      setIsUploading(false);
      return;
    }

    const results = [];
    const totalFiles = validFiles.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const filename = validFiles[i];
        const fileObj = selectedFiles.find((f) => f.file.name === filename);

        if (!fileObj) {
          results.push({
            filename,
            success: false,
            message: "Arquivo não encontrado localmente",
          });
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
          continue;
        }

        const formData = new FormData();
        formData.append("empresa", empresa);
        formData.append("photos", fileObj.file);

        try {
          await axios.post("http://localhost:5000/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          results.push({
            filename: fileObj.file.name,
            success: true,
            message: "Enviado com sucesso",
          });
        } catch (error) {
          results.push({
            filename: fileObj.file.name,
            success: false,
            message: `Erro: ${error.response?.data?.message || error.message}`,
          });
        }

        const progress = Math.round(((i + 1) / totalFiles) * 100);
        setUploadProgress(progress);
      }

      setUploadResults(results);
      addNotification("Upload concluído com sucesso!", "success");
    } catch (error) {
      console.error("Erro geral no upload:", error);
      addNotification("Erro durante o upload", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Modal behaviors with preload and stable sizing ---
  const preloadImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });

  const showImageAt = async (index) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const normalizedIndex = ((index % selectedFiles.length) + selectedFiles.length) % selectedFiles.length;
    setIsImageLoading(true);
    setModalIndex(normalizedIndex);

    try {
      await preloadImage(selectedFiles[normalizedIndex].url);
    } catch (e) {
      console.warn("Falha no preload:", e);
    } finally {
      setTimeout(() => setIsImageLoading(false), 120);
    }
  };

  const openModalAt = async (index) => {
    setIsModalOpen(true);
    await showImageAt(index);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsImageLoading(false);
  };

  const nextImage = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    await showImageAt(modalIndex + 1);
  };

  const prevImage = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    await showImageAt(modalIndex - 1);
  };

  useEffect(() => {
    const handler = (e) => {
      if (!isModalOpen) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isModalOpen, modalIndex, selectedFiles]);

  useEffect(() => {
    return () => {
      revokeUrls(selectedFiles);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="upload-container">
      <form onSubmit={handleSubmit}>
        <div className="sticky-top p-3 shadow-sm mb-4">
          {/* Primeira linha: Empresa | Arquivos | Enviar (todos na mesma linha) */}
          <div className="top-row">
            <div className="col-empresa">
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

            <div className="col-files">
              <label className="form-label fw-bold">Selecione as fotos (apenas JPG/PNG)</label>
              <input
                type="file"
                className="form-control"
                multiple
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                ref={fileInputRef}
                disabled={isUploading}
              />
            </div>

            <div className="col-actions">
              <button
                type="submit"
                className="btn btn-primary btn-action-large"
                disabled={isUploading || validFiles.length === 0}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Enviando...
                  </>
                ) : (
                  "Enviar"
                )}
              </button>
            </div>
          </div>

          {/* Segunda linha: descrição (esquerda) e Excluir tudo (direita). 
              Excluir tudo só aparece quando houver arquivos selecionados */}
          <div className="second-line" style={{ marginTop: 8 }}>
            <div className="desc-text">
              {empresa === "00"
                ? "Nome deve conter EAN (13-14 dígitos)"
                : "Nome deve conter SKU (6 dígitos)"}
            </div>

            <div className="btn-excluir-wrap">
              {selectedFiles.length > 0 && (
                <button
                  type="button"
                  className="btn btn-danger btn-action-large"
                  onClick={removeAll}
                  disabled={isUploading}
                  title="Excluir tudo"
                >
                  Excluir tudo
                </button>
              )}
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="mb-4 bg-light p-3 rounded">
            <h5 className="border-bottom pb-2">Progresso do Upload</h5>
            <ProgressBar progress={uploadProgress} />
            <div className="upload-status mt-2" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <FaCloudUploadAlt className="me-2" />
              <span>Enviando arquivos...</span>
            </div>
          </div>
        )}

        {uploadResults.length > 0 && (
          <div className="mb-4">
            <h5 className="border-bottom pb-2">Resultados do Upload</h5>
            <div className="list-group">
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className={`list-group-item list-group-item-action ${result.success ? "list-group-item-success" : "list-group-item-danger"}`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h6 className="mb-1" style={{ margin: 0 }}>{result.filename}</h6>
                    <small>{result.success ? "✅" : "❌"}</small>
                  </div>
                  <p className="mb-0" style={{ margin: 0 }}>{result.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h5 className="mb-0">Pré-visualização</h5>
              <small className="text-muted">{selectedFiles.length} arquivo(s) selecionado(s)</small>
            </div>

            <div className="preview-container">
              {selectedFiles.map((fileObj, index) => {
                const name = fileObj.file.name;
                const isValid = validFiles.includes(name);
                const isInvalid = invalidFiles.includes(name);

                return (
                  <div
                    key={name + "_" + index}
                    className={`preview-item ${isValid ? "border-success" : ""} ${isInvalid ? "border-danger" : ""}`}
                  >
                    <div className="preview-image">
                      <img
                        src={fileObj.url}
                        alt={name}
                        onClick={() => openModalAt(index)}
                        title="Clique para ampliar"
                      />
                    </div>

                    <div className="preview-details">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="filename" title={name}>{name}</span>
                        <span className="size badge bg-secondary">{(fileObj.file.size / 1024).toFixed(1)} KB</span>
                      </div>

                      <div className="preview-actions">
                        <div className={`status-icon ${isValid ? "valid" : isInvalid ? "invalid" : ""}`}>
                          {isValid && <FaCheckCircle title="Válido" />}
                          {isInvalid && <FaTimesCircle title="Inválido" />}
                          {!isValid && !isInvalid && <FaExclamationTriangle title="Sem validação" />}
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => removeFile(name)}
                            disabled={isUploading}
                            title="Remover arquivo"
                            aria-label={`Remover ${name}`}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </form>

      <div className="notifications-container">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && selectedFiles.length > 0 && (
        <div
          className="img-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={closeModal} // fecha ao clicar no backdrop
        >
          <div
            className="img-modal"
            onClick={(e) => e.stopPropagation()} // evita fechamento ao clicar no conteúdo
          >
            <div className="img-modal-inner">
              {/* loader */}
              {isImageLoading && <div className="modal-loader" />}

              {/* imagem central */}
              <img
                src={selectedFiles[modalIndex].url}
                alt={selectedFiles[modalIndex].file.name}
                className={`img-modal-img ${isImageLoading ? "loading" : "loaded"}`}
                draggable={false}
              />

              {/* navegação fixa (esquerda/direita) */}
              <button
                className="modal-nav-btn modal-nav-left"
                onClick={prevImage}
                title="Anterior"
                aria-label="Anterior"
                disabled={isImageLoading}
              >
                <FaChevronLeft />
              </button>

              <button
                className="modal-nav-btn modal-nav-right"
                onClick={nextImage}
                title="Próximo"
                aria-label="Próximo"
                disabled={isImageLoading}
              >
                <FaChevronRight />
              </button>

              <button className="modal-close" onClick={closeModal} aria-label="Fechar">
                <FaTimes />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
