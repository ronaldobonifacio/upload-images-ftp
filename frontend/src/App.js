import React from 'react';
import UploadForm from './components/UploadForm';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <div className="container py-4">
      <header className="text-center mb-5">
        <h1 className="display-5 fw-bold text-primary">
          <i className="bi bi-cloud-arrow-up me-2"></i>
          Upload de Fotos para FTP
        </h1>
        <p className="lead">Selecione a empresa e envie fotos de produtos</p>
      </header>
      
      <main>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-lg">
              <div className="card-header bg-primary text-white py-3">
                <h2 className="h5 mb-0">Formulário de Upload</h2>
              </div>
              <div className="card-body p-4">
                <UploadForm />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="mt-5 text-center text-muted">
        <p>Sistema de Upload FTP &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;