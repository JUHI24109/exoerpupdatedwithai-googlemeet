# Generate MySQL TLS certificates (self‑signed)
# Save this file as scripts/generate_mysql_tls.ps1 and run it once before starting MySQL.

# 1. Create a folder for certs if it does not exist
$certDir = Join-Path -Path $PSScriptRoot -ChildPath "../mysql/certs"
if (-Not (Test-Path $certDir)) { New-Item -ItemType Directory -Path $certDir }

# 2. Generate a self‑signed CA key and certificate
openssl genrsa -out "$certDir\ca-key.pem" 4096
openssl req -x509 -new -nodes -key "$certDir\ca-key.pem" -sha256 -days 3650 -out "$certDir\ca.pem" -subj "/CN=exo-erp-ca"

# 3. Generate server key and CSR
openssl genrsa -out "$certDir\server-key.pem" 2048
openssl req -new -key "$certDir\server-key.pem" -out "$certDir\server.csr" -subj "/CN=localhost"

# 4. Sign the server certificate with the CA
openssl x509 -req -in "$certDir\server.csr" -CA "$certDir\ca.pem" -CAkey "$certDir\ca-key.pem" -CAcreateserial -out "$certDir\server-cert.pem" -days 3650 -sha256

Write-Host "MySQL TLS certificates generated in $certDir"
