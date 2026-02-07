#!/bin/bash
# Script para adicionar um token à lista de tokens permitidos no PrivacyVault
# Uso: ./addAllowedToken.sh <ENDERECO_VAULT> <ENDERECO_TOKEN>

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica argumentos
if [ "$#" -ne 2 ]; then
    echo -e "${RED}Erro: Argumentos insuficientes${NC}"
    echo "Uso: $0 <ENDERECO_VAULT> <ENDERECO_TOKEN>"
    echo ""
    echo "Exemplo:"
    echo "  $0 0x1234...5678 0xAbCd...EfGh"
    exit 1
fi

VAULT_ADDRESS=$1
TOKEN_ADDRESS=$2

# Verifica se PRIVATE_KEY está definida
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Erro: Variável PRIVATE_KEY não definida${NC}"
    echo "Defina a chave privada antes de executar:"
    echo "  export PRIVATE_KEY=0x..."
    exit 1
fi

# Verifica se RPC_URL está definida (opcional, usa localhost por padrão)
if [ -z "$RPC_URL" ]; then
    RPC_URL="https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef"
    echo -e "${YELLOW}Aviso: RPC_URL não definida, usando $RPC_URL${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo "  Adicionando Token ao PrivacyVault"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "PrivacyVault: $VAULT_ADDRESS"
echo "Token:        $TOKEN_ADDRESS"
echo "RPC:          $RPC_URL"
echo "PK:          $PRIVATE_KEY"
echo ""


# Executa a transação
echo -e "${YELLOW}Enviando transação...${NC}"
cast send \
    "$VAULT_ADDRESS" \
    "addAllowedToken(address)" \
    "$TOKEN_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL"

echo ""
echo -e "${GREEN}========================================${NC}"
echo "  Token adicionado com sucesso!"
echo -e "${GREEN}========================================${NC}"

