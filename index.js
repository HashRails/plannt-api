require('dotenv').config();
const express = require('express');
const lnService = require('ln-service');
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.disable('x-powered-by');
app.use(cors({
  origin: 'https://plannt.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/demo', rateLimit({
  windowMs: 60_000,
  max: 3,
  message: { error: 'Rate limit exceeded' }
}));

// Connect to LND
const lndConfig = {
  macaroon: Buffer.from(process.env.LND_MACAROON, 'base64').toString(),
  socket: process.env.LND_SOCKET
};

if (process.env.LND_CERT) {
  lndConfig.cert = Buffer.from(process.env.LND_CERT, 'base64').toString();
}

const { lnd } = lnService.authenticatedLndGrpc(lndConfig);

lnService.getWalletInfo({ lnd })
  .then(info => console.log('LND connected. Alias:', info.alias))
  .catch(err => console.error('LND CONNECTION FAILED:', JSON.stringify(err), ...err));

const issuedTokens = new Map();

// Fee tiers
const PRICES = {
  '/v1/demo': 21,
  '/v1/data': 100,
  '/v1/generate': 250
};

// Generate a BOLT11 invoice
async function generateInvoice(req, tokens) {
  try {
    const preimage = crypto.randomBytes(32);
    const id = preimage.toString('hex');
    const invoice = await lnService.createInvoice({
      lnd,
      id,
      tokens,
      description: `Access ${req.path}`
    });
    return { id, request: invoice.request, preimage };
  } catch (err) {
    console.error('LND RAW ERROR:', JSON.stringify(err));
    console.error('LND ERROR SPREAD:', ...err);
    throw err;
  }
}

// Middleware to check LSAT token
async function lsatMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('LSAT ')) {
    return res.status(402).json({ error: 'Payment required' });
  }

  const token = auth.replace('LSAT ', '');
  if (!token.includes(':')) return res.status(400).json({ error: 'Malformed LSAT' });

  const [macaroon, preimage] = token.split(':');
  if (!macaroon || !preimage) return res.status(400).json({ error: 'Invalid token format' });

  if (issuedTokens.get(preimage) !== macaroon) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
}

app.get('/v1/demo', async (req, res) => {
  try {
    const price = PRICES[req.path] || 21;
    const { request, id, preimage } = await generateInvoice(req, price);
    issuedTokens.set(preimage.toString('hex'), id);
    res.status(402).json({
      error: 'Payment Required',
      invoice: request,
      authorization_format: `LSAT ${id}:${preimage.toString('hex')}`
    });
  } catch (err) {
    console.error('LND ERROR:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    res.status(503).send(`503,AddInvoiceError,${JSON.stringify(err, Object.getOwnPropertyNames(err))}`);
  }
});

app.get('/v1/data', lsatMiddleware, (req, res) => {
  res.json({ message: 'Access granted to protected Plannt data.' });
});

app.get('/status', (req, res) => {
  res.send('OK');
});

// GPT logic

app.post('/v1/generate', express.json(), async (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('LSAT ')) {
    const { request, id, preimage } = await generateInvoice(req, 250);
    issuedTokens.set(preimage.toString('hex'), id);
    return res.status(402).json({
      error: 'Payment Required',
      invoice: request,
      authorization_format: `LSAT ${id}:${preimage.toString('hex')}`
    });
  }

  const token = auth.replace('LSAT ', '');
  if (!token.includes(':')) return res.status(400).json({ error: 'Malformed LSAT' });
  const [macaroon, preimage] = token.split(':');
  if (!macaroon || !preimage) return res.status(400).json({ error: 'Invalid token format' });
  if (issuedTokens.get(preimage) !== macaroon) return res.status(401).json({ error: 'Invalid token' });

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prompt' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a machine-native assistant responding only to LSAT-authenticated API agents.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await openaiRes.json();
    if (!data || !data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'Invalid GPT response' });
    }

    res.json({ response: data.choices[0].message.content.trim() });
  } catch (err) {
    res.status(500).json({ error: 'GPT request failed', detail: err.message });
  }
});

app.listen(3000, '0.0.0.0', () => console.log('Plannt API running on port 3000'));
