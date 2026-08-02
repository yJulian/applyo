import http from 'node:http';

const PORT = process.env.PORT || 8080;

const server = http.createServer(async (req, res) => {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS preflight request immediately
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'applyo-cors-proxy' }));
    return;
  }

  // Extract target URL from header 'x-target-url' or query param '?url=...'
  const targetUrl =
    req.headers['x-target-url'] ||
    new URL(req.url, `http://${req.headers.host}`).searchParams.get('url');

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Missing x-target-url header or url query parameter',
        exampleHeader: 'x-target-url: https://api.openai.com/v1/chat/completions',
      })
    );
    return;
  }

  try {
    // Collect body chunks
    const bodyBuffers = [];
    for await (const chunk of req) {
      bodyBuffers.push(chunk);
    }
    const body = Buffer.concat(bodyBuffers);

    // Forward request headers except host & x-target-url
    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!['host', 'x-target-url', 'connection'].includes(key.toLowerCase())) {
        forwardHeaders[key] = value;
      }
    }

    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && body.length > 0) {
      fetchOptions.body = body;
    }

    // Forward request to target
    const targetResponse = await fetch(targetUrl, fetchOptions);

    // Forward headers from target (excluding existing CORS headers to avoid collisions)
    const resHeaders = {};
    targetResponse.headers.forEach((val, key) => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        resHeaders[key] = val;
      }
    });

    resHeaders['Access-Control-Allow-Origin'] = '*';
    resHeaders['Access-Control-Allow-Headers'] = '*';
    resHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';

    res.writeHead(targetResponse.status, resHeaders);

    const responseBuffer = await targetResponse.arrayBuffer();
    res.end(Buffer.from(responseBuffer));
  } catch (err) {
    console.error('CORS Proxy Error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy request failed', details: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Applyo CORS Proxy running on port ${PORT}`);
});
