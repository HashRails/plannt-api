# Plannt Architecture

## Overview

Plannt implements the L402 protocol (bLIP-26) on top of Bitcoin Lightning.
The architecture is stateless — no database is required for access decisions.
All verification is pure cryptography.

## Protocol Flow

```
Client                    Plannt API               LND Node
  |                           |                        |
  |-- GET /v1/endpoint ------>|                        |
  |                           |-- createInvoice() ---->|
  |                           |<-- BOLT11 invoice -----|
  |<-- 402 + invoice + mac ---|                        |
  |                           |                        |
  |-- pay invoice ----------->|----------------------->|
  |<-- preimage -------------->|<----------------------|
  |                           |                        |
  |-- GET /v1/endpoint ------>|                        |
  |   Authorization: L402     |-- verify HMAC -------->|
  |   macaroon:preimage       |                        |
  |<-- 200 + data ------------|                        |
```

## Security Properties

- No persistent credentials issued
- Single-use tokens — expired on use
- Cryptographic verification only — HMAC(root_key, payment_hash)
- No session state maintained
- No user data stored
