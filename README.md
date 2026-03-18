# Plannt

**Bitcoin-native access control for AI agents and autonomous APIs.**

Gate any API behind a Lightning payment using the L402 protocol. No accounts. No OAuth. No API keys. No surprise bills.

```
Agent requests endpoint
  → Server responds HTTP 402 + Lightning invoice + macaroon
  → Agent pays invoice
  → Agent retries with Authorization: L402 macaroon:preimage
  → Server verifies by math. Access granted. Token spent.
```

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Bitcoin](https://img.shields.io/badge/Bitcoin-Lightning-orange)](https://lightning.network)
[![Protocol](https://img.shields.io/badge/Protocol-L402%20%2F%20LSAT-blue)](https://github.com/lightning/blips/pull/26)

---

## Why Plannt

API keys were built for humans. AI agents are not human.

Every week a developer wakes up to a suspended account and a five-figure invoice. Not because they were careless. Because the architecture failed them. Static credentials stored in config files get stolen. Keys with no native spending cap run inference loops until the billing cycle ends.

Plannt eliminates the credential entirely. Every request generates a Lightning invoice. The payment preimage becomes a one-time cryptographic access token. When the request completes the token is spent. There is nothing to steal and nothing to forget.

```
Traditional model:    Key issued → Key stored → Key leaked → Bill arrives
Plannt model:         Request made → Invoice generated → Payment verified → Access granted → Token spent
```

---

## How It Works

Plannt implements the [L402 / LSAT protocol](https://github.com/lightning/blips/pull/26) on top of Bitcoin Lightning.

### The Five-Step Flow

| Step | Action |
|------|--------|
| 01 | Agent requests a protected endpoint — no credentials sent |
| 02 | Server responds `402` with a BOLT11 invoice and a macaroon |
| 03 | Agent pays the invoice over Lightning — preimage returned as proof |
| 04 | Agent retries with `Authorization: L402 <macaroon>:<preimage>` |
| 05 | Server verifies `HMAC(root_key, payment_hash) == macaroon_id` — access granted |

### Why This Is Secure

- **No key to steal** — nothing is issued, nothing is stored
- **No session to exploit** — tokens are single-use and expire on use
- **No runaway spend** — each request requires a discrete payment
- **No database lookup** — verification is pure cryptography

---

## Live Endpoints

Base URL: `https://api.plannt.com`

| Method | Endpoint | Description | Price |
|--------|----------|-------------|-------|
| `GET` | `/v1/demo` | Issues 402 with invoice + L402 token | 21 sats |
| `GET` | `/v1/data` | Returns protected payload on valid token | 100 sats |
| `POST` | `/v1/generate` | Submits prompt, returns GPT-4 inference | 250 sats |
| `GET` | `/status` | Health check | Public |

---

## Quick Start

### 1. Request a protected endpoint

```bash
curl -i https://api.plannt.com/v1/demo
```

Response:
```json
{
  "error": "Payment Required",
  "invoice": "lnbc210n1...",
  "authorization_format": "L402 <macaroon>:<preimage>"
}
```

### 2. Pay the invoice

Pay the `lnbc...` invoice using any Lightning wallet — [Alby](https://getalby.com), [Phoenix](https://phoenix.acinq.co), or any Lightning-native agent.

### 3. Retry with proof of payment

```bash
curl -i https://api.plannt.com/v1/demo \
  -H "Authorization: L402 <macaroon>:<preimage>"
```

### Agent Integration (Node.js)

```javascript
const res = await fetch('https://api.plannt.com/v1/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'your prompt here' })
});

if (res.status === 402) {
  const { invoice, authorization_format } = await res.json();

  // Pay the Lightning invoice — returns preimage
  const preimage = await yourLightningWallet.pay(invoice);

  // Retry with proof of payment
  const result = await fetch('https://api.plannt.com/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `L402 ${authorization_format.split(' ')[1].split(':')[0]}:${preimage}`
    },
    body: JSON.stringify({ prompt: 'your prompt here' })
  });

  const data = await result.json();
  console.log(data.response);
}
```

---

## Self-Hosted Deployment

Plannt is designed to run on your own infrastructure with your own Lightning node. All sats settle directly to your node — no intermediary, no platform dependency.

### Requirements

- Node.js 18+
- LND node with inbound liquidity
- Fly.io account (or any Node.js hosting)

### Environment Variables

```bash
LND_MACAROON=   # Admin macaroon (hex or base64)
LND_CERT=       # TLS certificate (base64)
LND_SOCKET=     # gRPC host:port (e.g. yournode.voltageapp.io:10009)
OPENAI_KEY=     # Optional — required for /v1/generate endpoint
```

### Deploy to Fly.io

```bash
git clone https://github.com/DanSanchez/plannt-api
cd plannt-api
npm install

# Set your Lightning node credentials
fly secrets set LND_MACAROON="your-macaroon" \
  LND_CERT="your-cert" \
  LND_SOCKET="your-node:10009" \
  --app your-app-name

fly deploy
```

### Test your deployment

```bash
curl -i https://your-app.fly.dev/v1/demo
# Should return HTTP 402 with a Lightning invoice
```

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Protocol | L402 / LSAT (bLIP-26) |
| Payment Rail | Bitcoin Lightning / LND |
| Auth Tokens | Macaroons — HMAC-verified, stateless |
| Access Logic | Stateless middleware — no database required |
| Runtime | Node.js / Express |
| Deployment | Fly.io |
| Agent Integration | ln-service / WebLN |

---

## Repository Structure

```
plannt-api/
├── index.js              # Main API server
├── generate-route.js     # GPT inference endpoint
├── middleware/
│   └── lsat.js           # L402 authentication middleware
├── docs/
│   ├── architecture.md   # Technical architecture overview
│   ├── integration.md    # Agent integration guide
│   └── self-hosting.md   # Self-hosting documentation
├── examples/
│   ├── agent-node.js     # Node.js agent example
│   ├── agent-python.py   # Python agent example
│   └── curl-flow.sh      # curl walkthrough
└── node/
    └── setup.md          # Lightning node setup guide
```

---

## Roadmap

- [x] L402 / LSAT protocol implementation
- [x] BOLT11 invoice generation via LND
- [x] Stateless macaroon verification
- [x] GPT-4 inference endpoint
- [x] Fly.io deployment
- [ ] MCP server integration
- [ ] MDK liquidity layer integration
- [ ] Developer dashboard
- [ ] Multi-endpoint pricing tiers
- [ ] Agent SDK (Node.js)
- [ ] Agent SDK (Python)
- [ ] BitcoinSchool integration

---

## The Broader Vision

Plannt is the access control layer for the machine economy.

AI agents need to pay for things. The existing infrastructure — API keys, subscriptions, credit cards — was built for humans. Plannt is built for machines. Every API that integrates Plannt becomes instantly monetizable by any agent with a Lightning wallet, anywhere in the world, with no accounts, no KYC, and no platform permission required.

The long-term goal is a network of Plannt-gated APIs that any agent can discover and pay for autonomously — a permissionless marketplace for machine-to-machine commerce built entirely on Bitcoin.

---

## Links

- [Website](https://plannt.com)
- [Whitepaper](https://plannt.com/whitepaper)
- [API Documentation](https://plannt.com/docs)
- [The API Key Problem](https://plannt.com/problem)

---

## Contact

**Daniel Sanchez** — Founder  
[hey@DanSanchez.com](mailto:hey@DanSanchez.com)  
[@DanSanchez](https://x.com/DanSanchez)

---

*Built for the machine economy.*
