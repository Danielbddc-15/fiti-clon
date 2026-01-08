// Simple proxy server for Shellcatch config
// Usage: node server/proxy.js

const express = require('express')
const fetch = require('node-fetch')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// Lightweight root endpoint for health checks (returns 200)
app.get('/', (req, res) => {
  res.json({ ok: true })
})

app.get('/shellcatch-config', async (req, res) => {
  try {
    const upstream = 'https://api-fiti-us-dev.shellcatch.com/v1/script/get-config-script'
    const r = await fetch(upstream, {
      headers: {
        Accept: 'application/json',
        // Spoof Origin/Referer to match the dev host so upstream accepts the request.
        // NOTE: this is a development workaround. For production the API should whitelist your real host.
        Origin: 'http://localhost:5174',
        Referer: 'http://localhost:5174/'
      }
    })
    let json
    try {
      json = await r.json()
    } catch (parseErr) {
      console.error('Failed to parse upstream response as JSON:', parseErr)
      const text = await r.text().catch(()=>null)
      console.error('Upstream response text:', text)
      return res.status(502).json({ success:false, error: 'bad-upstream-response', details: text })
    }
    if (!r.ok) {
      console.error('Upstream returned non-OK status', r.status, json)
      return res.status(r.status).json(json)
    }
    return res.status(200).json(json)
  } catch (err) {
    console.error('Proxy error while fetching upstream:', err && err.stack ? err.stack : err)
    res.status(500).json({ success: false, error: err.message || String(err) })
  }
})

// Fetch and return the upstream embed HTML so hosted clients can load the
// dashboard through this proxy (avoids upstream blocking direct browser requests).
app.get('/embed', async (req, res) => {
  try {
    // First fetch the config to discover the embed URL
    const upstreamConfig = 'https://api-fiti-us-dev.shellcatch.com/v1/script/get-config-script'
    const cfgResp = await fetch(upstreamConfig, {
      headers: { Accept: 'application/json', Origin: 'http://localhost:5174', Referer: 'http://localhost:5174/' }
    })
    const cfgJson = await cfgResp.json().catch(()=>null)
    if (!cfgJson || !cfgJson.success || !cfgJson.data || !cfgJson.data.url) {
      return res.status(502).send('Could not retrieve embed URL from upstream')
    }
    let embedUrl = cfgJson.data.url
    // Normalize relative URLs
    if (embedUrl && !/^https?:\/\//i.test(embedUrl)) {
      embedUrl = `https://api-fiti-us-dev.shellcatch.com/${embedUrl.replace(/^\//, '')}`
    }

    // Fetch the embed HTML
    const embedResp = await fetch(embedUrl, { headers: { Referer: 'http://localhost:5174' } })
    const contentType = embedResp.headers.get('content-type') || 'text/html'
    const body = await embedResp.text().catch(()=>null)
    if (!body) return res.status(502).send('Failed to fetch embed HTML')
    res.set('Content-Type', contentType)
    // Allow cross-origin embedding from GitHub Pages
    res.set('Access-Control-Allow-Origin', '*')
    return res.status(200).send(body)
  } catch (err) {
    console.error('Error in /embed proxy:', err)
    return res.status(500).send('Proxy error')
  }
})

// Prefer hosting provider port (process.env.PORT), fall back to PROXY_PORT for local overrides, then 3000
const PORT = process.env.PORT || process.env.PROXY_PORT || 3000
app.listen(PORT, () => console.log(`Shellcatch proxy listening on http://0.0.0.0:${PORT}`))
