#!/usr/bin/env sh
set -eu

CONFIG_FILE="openssl-localhost.cnf"
cleanup() {
  rm -f "$CONFIG_FILE"
}
trap cleanup EXIT INT TERM

cat > "$CONFIG_FILE" <<'CNF'
[req]
prompt = no
distinguished_name = dn
x509_extensions = v3_req

[dn]
CN = localhost

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
CNF

openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -batch -config "$CONFIG_FILE"
echo "Created cert.pem and key.pem"
