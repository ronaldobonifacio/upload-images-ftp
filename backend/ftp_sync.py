import ftplib
import os
import shutil
import logging
from datetime import datetime
import time

# ================= Configurações =================
FTP_HOST = "credenciais"
FTP_USER = "credenciais"
FTP_PASS = "credenciais"
FTP_PORT = 21

ASA_DESTINO = r"\\192.168.0.1\c$\ImagensPrd_Asa\images"
ROTA_DESTINO = r"\\192.168.0.1\c$\ImagensPrd_Mcd"

TEMP_DIR = os.path.join(os.getcwd(), "temp_ftp")
MAX_RETRIES = 3
RECONNECT_EVERY = 10  # reconectar FTP a cada X arquivos
TIMEOUT = 10  # segundos por arquivo

# ================= Logging =================
logging.basicConfig(
    filename=os.path.join(os.getcwd(), "sync_log.txt"),
    level=logging.INFO,
    format="%(asctime)s - %(message)s",
    datefmt="%d/%m/%Y %H:%M:%S",
)

def log(msg):
    print(msg)
    logging.info(msg)

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def connect_ftp():
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.set_pasv(True)
    log(f"Conexão FTP bem-sucedida com {FTP_HOST}")
    return ftp

def move_temp_to_dest():
    """Se houver arquivos na temp, move para os destinos corretos antes de iniciar."""
    if not os.path.exists(TEMP_DIR):
        return
    log("Verificando arquivos remanescentes na pasta temporária...")
    for folder_name in os.listdir(TEMP_DIR):
        temp_folder = os.path.join(TEMP_DIR, folder_name)
        if not os.path.isdir(temp_folder):
            continue
        destino = ASA_DESTINO if folder_name.lower() == "asabranca" else ROTA_DESTINO
        ensure_dir(destino)
        for file in os.listdir(temp_folder):
            src_file = os.path.join(temp_folder, file)
            folder_dest = os.path.join(destino, os.path.splitext(file)[0])
            ensure_dir(folder_dest)
            shutil.move(src_file, os.path.join(folder_dest, file))
            log(f"[TEMP] Arquivo recuperado e movido: {folder_dest}\\{file}")
        shutil.rmtree(temp_folder)
    log("Arquivos pendentes da pasta temporária foram movidos.")

def process_folder(folder_name, destino):
    log(f"Processando pasta: {folder_name}")
    ensure_dir(destino)
    temp_folder = os.path.join(TEMP_DIR, folder_name)
    ensure_dir(temp_folder)

    ftp = connect_ftp()
    try:
        ftp.cwd(folder_name)
        files = ftp.nlst()
    except ftplib.all_errors as e:
        log(f"ERRO: Não foi possível listar arquivos em {folder_name}: {e}")
        return
    finally:
        ftp.quit()

    processed_count = 0
    for filename in files:
        if not filename.lower().endswith((".png", ".jpg")):
            continue

        attempt = 0
        while attempt < MAX_RETRIES:
            try:
                ftp = connect_ftp()
                ftp.cwd(folder_name)
                local_path = os.path.join(temp_folder, filename)
                
                # Recorte do arquivo do FTP para temporário
                with open(local_path, "wb") as f:
                    ftp.retrbinary(f"RETR {filename}", f.write, blocksize=1024*1024)
                
                # Deleta do FTP
                ftp.delete(filename)
                ftp.quit()
                
                log(f"Arquivo processado com sucesso: {filename}")
                break
            except Exception as e:
                attempt += 1
                log(f"Tentativa {attempt} falhou para {filename}: {e}")
                try:
                    ftp.quit()
                except:
                    pass
                time.sleep(2)
        else:
            log(f"ERRO: Falha no processamento de {filename} após {MAX_RETRIES} tentativas")
        
        processed_count += 1
        if processed_count % RECONNECT_EVERY == 0:
            try:
                ftp.quit()
            except:
                pass

    # Após processar todos, mover para destino final
    for file in os.listdir(temp_folder):
        src_file = os.path.join(temp_folder, file)
        folder_dest = os.path.join(destino, os.path.splitext(file)[0])
        ensure_dir(folder_dest)
        shutil.move(src_file, os.path.join(folder_dest, file))
        log(f"Arquivo movido para destino: {folder_dest}\\{file}")
    
    shutil.rmtree(temp_folder)

def main():
    log("===== INICIANDO SINCRONIZAÇÃO =====")
    
    # 1️⃣ Antes de começar, recupera qualquer arquivo remanescente da temp
    move_temp_to_dest()
    
    # 2️⃣ Processa FTP
    process_folder("AsaBranca", ASA_DESTINO)
    process_folder("Rota", ROTA_DESTINO)
    
    log("Sincronização concluída com sucesso")
    log("====================================")

if __name__ == "__main__":
    main()
