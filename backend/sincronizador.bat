@echo off
:: =========================
:: Executa o script Python de sincronização FTP
:: =========================

cd /d "%~dp0"
"C:Caminho do python" ftp_sync.py
exit
