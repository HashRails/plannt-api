// Plannt L402 Agent Example — Node.js

async function payLightningInvoice(invoice) {
  // Connect to your Lightning node and pay the invoice
  // Returns the payment preimage as a hex string
  throw new Error('Implement with your Lightning wallet');
}

async function callPlanntAPI(endpoint, options = {}) {
  const url = `https://api.plannt.com${endpoint}`;
  const challenge = await fetch(url, options);

  if (challenge.status !== 402) return challenge.json();

  const { invoice, authorization_format } = await challenge.json();
  const macaroon = authorization_format.split(' ')[1].split(':')[0];
  const preimage = await payLightningInvoice(invoice);

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `L402 ${macaroon}:${preimage}`
    }
  }).then(r => r.json());
}

// Example
callPlanntAPI('/v1/data').then(console.log).catch(console.error);
