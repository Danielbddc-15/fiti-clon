addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(req) {
  try {
    const url = new URL(req.url)
    // Only expose a single helper path
    if (url.pathname !== '/shellcatch-config') {
      return new Response('Not found', { status: 404 })
    }

    const upstream = 'https://api-fiti-us-dev.shellcatch.com/v1/script/get-config-script'

    // Forward request to upstream, spoofing Origin/Referer similar to the dev proxy
    const upstreamRes = await fetch(upstream, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Origin: 'https://workers.dev',
        Referer: 'https://workers.dev/'
      }
    })

    // Try to parse JSON; if parsing fails, return a 502 with text body
    const contentType = upstreamRes.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await upstreamRes.text()
      return new Response(body, {
        status: upstreamRes.status,
        headers: { 'content-type': 'application/json' }
      })
    }

    // Non-JSON upstream response: return 502 with text for debugging
    const txt = await upstreamRes.text().catch(()=>null)
    return new Response(JSON.stringify({ success:false, error: 'bad-upstream-response', details: txt }), {
      status: 502,
      headers: { 'content-type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ success:false, error: String(err) }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}
