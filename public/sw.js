self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/stream/')) {
    event.respondWith(handleStream(event.request));
  }
});

async function handleStream(request) {
  const url = new URL(request.url);
  const fileId = decodeURIComponent(url.pathname.split('/stream/')[1]);
  const rangeHeader = request.headers.get('Range');

  let clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  let matchAttempts = 0;
  while (clients.length === 0 && matchAttempts < 5) {
    await new Promise((r) => setTimeout(r, 100));
    clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    matchAttempts++;
  }
  if (clients.length === 0) {
    return new Response("No active window after SW wakeup", { status: 500 });
  }
  
  // Route to the active/visible window client if possible to avoid dead/unloading frames
  const client = clients.find(c => c.visibilityState === 'visible') || clients[0];

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    
    let controllerRef = null;
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(new Response("Stream timed out", { status: 504 }));
      }
    }, 15000);

    const stream = new ReadableStream({
      start(controller) {
        controllerRef = controller;
      },
      cancel() {
        // If the browser cancels/aborts the video request, notify main window to stop download
        messageChannel.port1.postMessage({ type: 'ABORT' });
      }
    });

    messageChannel.port1.onmessage = (event) => {
      const data = event.data;
      
      if (data.type === 'HEADER') {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          const status = data.status || 206;
          const contentLength = data.contentLength ?? Math.max(0, data.end - data.start + 1);
          const headers = {
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength.toString(),
            'Content-Type': data.mimeType || 'application/octet-stream',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          };
          if (status === 206) {
            headers['Content-Range'] = `bytes ${data.start}-${data.end}/${data.totalSize}`;
          }
          const response = new Response(stream, {
            status,
            headers
          });
          resolve(response);
        }
      } else if (data.type === 'CHUNK') {
        if (controllerRef) {
          // Convert array back to Uint8Array if needed
          controllerRef.enqueue(new Uint8Array(data.chunk));
        }
      } else if (data.type === 'END') {
        if (controllerRef) {
          try { controllerRef.close(); } catch (e) {}
        }
      } else if (data.type === 'ERROR') {
        if (controllerRef) {
          try { controllerRef.error(new Error(data.error)); } catch (e) {}
        }
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(new Response(data.error, { status: data.status || 500 }));
        }
      }
    };

    client.postMessage({
      type: 'FETCH_STREAM',
      fileId,
      range: rangeHeader
    }, [messageChannel.port2]);
  });
}
