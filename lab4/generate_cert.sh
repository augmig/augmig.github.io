#!/usr/bin/env bash
set -e

mkdir -p certs

MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -days 365 \
  -nodes \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "Created certs/cert.pem and certs/key.pem"
