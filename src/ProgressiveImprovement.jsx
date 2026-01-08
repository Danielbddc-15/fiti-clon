import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Public proxy URL (set at build time via VITE_PROXY_URL). Keep empty string
// when not configured so checks like `if (proxyUrl)` are safe. We also
// support a runtime-config file `runtime-proxy.json` in `public/` so the
// deployed build can be pointed to a proxy without rebuilding.
const proxyUrl = import.meta.env.VITE_PROXY_URL || ''

// Helper: load the Shellcatch script
const loadShellcatchScript = () => {
  const existingScript = document.querySelector('script[src="https://api-fiti-us-dev.shellcatch.com/static/script_v2.js"]')
  if (existingScript) existingScript.remove()
  const script = document.createElement('script')
  script.id = 'shellcatch-script'
  script.src = 'https://api-fiti-us-dev.shellcatch.com/static/script_v2.js'
  script.async = true
  document.body.appendChild(script)
}

const unloadShellcatchScript = () => {
  const existing = document.getElementById('shellcatch-script') || document.querySelector('script[src="https://api-fiti-us-dev.shellcatch.com/static/script_v2.js"]')
  if (existing) existing.remove()
  const container = document.getElementById('shellcatch_container_v2')
  if (container) {
    Array.from(container.children).forEach(child => {
      if (!child.classList || !child.classList.contains('shellcatch-loading')) child.remove()
    })
  }
}

const fetchAndInjectShellcatchIframe = async (container) => {
  if (!container) return false
    try {
    let res = null
      // If no build-time proxy is set, try to load a runtime proxy file
      let runtimeProxy = ''
      if (!proxyUrl) {
        try {
          const rp = await fetch(`${import.meta.env.BASE_URL}runtime-proxy.json`)
          if (rp && rp.ok) {
            const rpjson = await rp.json().catch(()=>null)
            runtimeProxy = (rpjson && rpjson.proxy) ? rpjson.proxy : ''
          }
        } catch (e) { /* ignore */ }
      }
    // Try configured public proxy first (VITE_PROXY_URL). Only attempt the
    // localhost proxy in development mode to avoid hitting localhost from
    // hosted clients.
      if (!res && import.meta.env.DEV) {
        try { res = await fetch('/__shellcatch_config') } catch(e){ res = null }
      }
    const effectiveProxy = proxyUrl || runtimeProxy || ''
    if (!res && effectiveProxy) {
      try {
        const normalized = effectiveProxy.replace(/\/$/, '')
        res = await fetch(`${normalized}/shellcatch-config`)
      } catch (e) { res = null }
    }
    if (!res && import.meta.env.DEV) {
      try { res = await fetch('http://localhost:3000/shellcatch-config') } catch(e){ res = null }
    }
    if (!res) res = await fetch('/__shellcatch_config')
    const contentType = (res && res.headers && res.headers.get) ? (res.headers.get('content-type') || '') : ''
    let json = null
    if (contentType.includes('application/json')) {
      try { json = await res.json() } catch (e) { const t = await res.text().catch(()=>null); console.error('Error parsing JSON from config endpoint', t); return false }
    } else {
      const text = await res.text().catch(()=>null)
      console.warn('Config endpoint returned non-JSON response', res && res.status)
      try {
        const localRes = await fetch(`${import.meta.env.BASE_URL}shellcatch-config.json`)
          if (localRes && localRes.ok) {
            const localJson = await localRes.json().catch(()=>null)
            if (localJson && localJson.success && localJson.data && localJson.data.url) {
              // Normalize relative URL to Vite base
              const data = localJson.data
              let url = data.url || ''
              if (url && !/^https?:\/\//i.test(url)) {
                url = `${import.meta.env.BASE_URL || '/'}${url.replace(/^\//, '')}`
              }
              localJson.data.url = url
              json = localJson
            } else { console.error('Local fallback config is invalid', localJson); return false }
          } else { console.error('Local fallback not available', localRes && localRes.status); return false }
      } catch (err) { console.error('Error loading local fallback config', err); return false }
    }

    if (json && json.success && json.data && json.data.url) {
      const data = json.data
      const iframe = document.createElement('iframe')
      iframe.src = data.url
      iframe.style.width = data.width || '100%'
      // force iframe to fill the container so internal scrolling happens inside it
      iframe.style.height = '100%'
      iframe.style.border = data.border || '0'
      iframe.style.transition = data.transition || 'none'
      iframe.style.overflow = 'auto'
      iframe.setAttribute('scrolling', 'yes')
      iframe.allow = 'fullscreen; geolocation; microphone; camera; autoplay'
      iframe.setAttribute('allowfullscreen', '')
      iframe.referrerPolicy = 'no-referrer'
      Array.from(container.querySelectorAll('iframe')).forEach(n=>n.remove())
      container.appendChild(iframe)
      return true
    }
    return false
  } catch (err) {
    console.warn('Error fetching config:', err)
    return false
  }
}

export default function ProgressiveImprovement(){
  const navigate = useNavigate()

  useEffect(()=>{
    // In production (hosted) prefer local static fallback first to avoid blocked
    // upstream requests. In dev we still try to load the script which will call
    // upstream or the proxy.
    unloadShellcatchScript()
    loadShellcatchScript()
    const t = setTimeout(async ()=>{
      const c = document.getElementById('shellcatch_container_v2')
      if (!c) return
      const hasContent = Array.from(c.children).some(ch => !ch.classList || !ch.classList.contains('shellcatch-loading'))
      if (!hasContent) {
        // Try proxy (or dev proxies) first; only fall back to the bundled static
        // config when proxy attempts fail. This ensures hosted deployments which
        // set `VITE_PROXY_URL` will use the public proxy instead of the local
        // placeholder file.
        const usedProxy = await fetchAndInjectShellcatchIframe(c)
        if (!usedProxy) {
          // fallback: try local static config
          try {
            const localRes = await fetch(`${import.meta.env.BASE_URL}shellcatch-config.json`)
            if (localRes && localRes.ok) {
              const localJson = await localRes.json().catch(()=>null)
              if (localJson && localJson.success && localJson.data && localJson.data.url) {
                const data = localJson.data
                const iframe = document.createElement('iframe')
                iframe.src = data.url
                iframe.style.width = data.width || '100%'
                iframe.style.height = '100%'
                iframe.style.border = data.border || '0'
                iframe.style.overflow = 'auto'
                iframe.setAttribute('scrolling', 'yes')
                iframe.allow = 'fullscreen; geolocation; microphone; camera; autoplay'
                iframe.setAttribute('allowfullscreen', '')
                Array.from(c.querySelectorAll('iframe')).forEach(n=>n.remove())
                c.appendChild(iframe)
                return
              }
            }
          } catch (e) {
            // nothing else to do
          }
        }
      }
    }, 800)
    return ()=>{ clearTimeout(t); unloadShellcatchScript() }
  }, [])

  return (
    <main className="shellcatch-page-main">
      <div className="shellcatch-page">
        <div className="shellcatch-page-inner">
          <button className="shellcatch-close" onClick={() => navigate(-1)}>✕</button>
          <h2 className="shellcatch-page-title">Progressive Improvement Tracker</h2>
          <div
            id="shellcatch_container_v2"
            data-shellcatch="true"
            data-container="shellcatch"
            data-dashboard="progressive-improvement"
            role="region"
            aria-label="Progressive Improvement Dashboard"
            style={{ width: '100%', height: '100%' }}
          >
            <div className="shellcatch-loading"><p>Cargando dashboard...</p></div>
          </div>
        </div>
      </div>
    </main>
  )
}
