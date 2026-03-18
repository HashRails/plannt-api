#!/bin/bash
# Plannt L402 curl walkthrough

BASE_URL="https://api.plannt.com"

echo "Step 1 — Request the protected endpoint"
curl -i "$BASE_URL/v1/demo"

echo ""
echo "Step 2 — Pay the lnbc... invoice with any Lightning wallet"
echo "          You will receive a preimage (hex string)"

echo ""
echo "Step 3 — Retry with proof of payment"
echo 'curl -i "$BASE_URL/v1/demo" -H "Authorization: L402 MACAROON:PREIMAGE"'
