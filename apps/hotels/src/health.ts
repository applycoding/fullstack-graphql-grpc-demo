import http from 'http';

export function startHealthServer(port: number): http.Server {
  const server = http.createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ ok: true }));
      return;
    }
    response.writeHead(404);
    response.end();
  });
  server.listen(port, () => {
    console.log(`Hotel health listening on ${port}`);
  });
  return server;
}
