# Lightning Node Setup

## Recommended: Voltage.cloud

1. Create account at voltage.cloud
2. Create a new LND node
3. Fund with Bitcoin and open channels
4. Export: admin macaroon + TLS cert + gRPC socket
5. Set as environment variables

## Minimum Liquidity

500,000 sats total — both inbound and outbound capacity required to issue invoices.

## Credential Conversion

```bash
base64 -i admin.macaroon | tr -d '\n'   # → LND_MACAROON
base64 -i tls.cert | tr -d '\n'          # → LND_CERT
# LND_SOCKET = yournode.voltageapp.io:10009
```
