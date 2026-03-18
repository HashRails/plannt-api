// Add this to index.js after other app.get() routes

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
