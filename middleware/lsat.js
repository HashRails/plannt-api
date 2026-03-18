// L402 / LSAT authentication middleware
// Verifies payment preimage against macaroon
// Stateless — no database lookup required

async function lsatMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('LSAT ')) {
    return res.status(402).json({ error: 'Payment required' });
  }
  const token = auth.replace('LSAT ', '');
  if (!token.includes(':')) return res.status(400).json({ error: 'Malformed LSAT' });
  const [macaroon, preimage] = token.split(':');
  if (!macaroon || !preimage) return res.status(400).json({ error: 'Invalid token format' });
  if (req.app.locals.issuedTokens.get(preimage) !== macaroon) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
}

module.exports = { lsatMiddleware };
