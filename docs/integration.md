# Agent Integration Guide

## Overview

Any HTTP client that speaks L402 can integrate with Plannt.
The flow is four steps: request, receive 402, pay invoice, retry with proof.

## Node.js

See `examples/agent-node.js` for a complete working example.

## Python

See `examples/agent-python.py` for a complete working example.

## curl

See `examples/curl-flow.sh` for a command-line walkthrough.

## Compatible Lightning Wallets

- Alby (browser extension + API)
- Phoenix (mobile)
- Any LND node via ln-service
- WebLN-compatible wallets

## MCP Integration

Plannt endpoints are compatible with MCP tool servers.
Full MCP integration guide coming in v0.2.
