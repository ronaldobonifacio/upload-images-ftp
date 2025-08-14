import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Importe suas logos (substitua pelos caminhos reais)
import asaBrancaLogo from './assets/asa-branca-logo.png';
import rotaLogo from './assets/rota-logo.png';

function App() {
  const [empresa, setEmpresa] = useState('00');

  const handleEmpresaChange = (newEmpresa) => {
    setEmpresa(newEmpresa);
  };

  return (
    <div className="app-container">
      <header className="app-header" role="banner">
        <div className="container">
          <div className="header-content">
            <div className="logo-container" aria-hidden={false}>
              {/* Ambas as imagens ocupam o mesmo espaço; use .active apenas na que deve aparecer */}
              <img
                src={asaBrancaLogo}
                id="asa-logo"
                className={`company-logo ${empresa === '00' ? 'active' : ''}`}
                alt="Asa Branca"
                width={140}
                height={80}
                loading="eager"
              />
              <img
                src={rotaLogo}
                id="rota-logo"
                className={`company-logo ${empresa === '08' ? 'active' : ''}`}
                alt="Rota Nordeste"
                width={140}
                height={80}
                loading="eager"
              />
            </div>

            <div className="header-text" aria-live="polite">
              <h1 className="app-title">
                <i className="bi bi-cloud-arrow-up" aria-hidden="true"></i> Upload de Imagens
              </h1>
              <p className="app-subtitle">Sistema de envio de imagens para ION</p>
            </div>

            {/* Placeholder à direita para balancear o header e evitar reflow visual.
                Mantém espaço mesmo se não houver conteúdo à direita. */}
            <div className="header-right" aria-hidden="true" />
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-8">
              <div className="upload-card">
                <div className="card-header">
                  <h2>
                    <i className="bi bi-images me-2" aria-hidden="true"></i>
                    Formulário de Upload
                  </h2>
                </div>
                <div className="card-body">
                  <UploadForm onEmpresaChange={handleEmpresaChange} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p className="footer-text">
            Sistema de Upload FTP &copy; {new Date().getFullYear()}
            <span className="version">v1.0.0</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
