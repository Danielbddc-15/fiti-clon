// Simple proxy server for Shellcatch config
// Usage: node server/proxy.js

const express = require('express')
const fetch = require('node-fetch')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

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

const PORT = process.env.PROXY_PORT || 3000
app.listen(PORT, () => console.log(`Shellcatch proxy listening on http://localhost:${PORT}`))
