# Self-Hosting Guide

## Requirements

- Node.js 18+
- LND node with funded channels
- Fly.io or equivalent Node.js hosting

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| LND_MACAROON | Admin macaroon (base64) | Yes |
| LND_CERT | TLS certificate (base64) | Yes |
| LND_SOCKET | gRPC endpoint host:port | Yes |
| OPENAI_KEY | OpenAI API key | /v1/generate only |

## Convert credentials

```bash
base64 -i admin.macaroon | tr -d '\n'   # LND_MACAROON
base64 -i tls.cert | tr -d '\n'          # LND_CERT
```

## Channel Liquidity

Minimum recommended: 500,000 sats total with both inbound and outbound capacity.
