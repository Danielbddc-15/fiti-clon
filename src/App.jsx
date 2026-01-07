import React, { useEffect, useState } from 'react'

// Use hero image from fiti.global
const HERO_BG = 'https://fiti.global/wp-content/uploads/2021/05/sea-684351-scaled.jpg'

// Function to load Shellcatch script when needed
const loadShellcatchScript = () => {
  // Remove any existing script first
  const existingScript = document.querySelector('script[src="https://api-fiti-us-dev.shellcatch.com/static/script_v2.js"]')
  if (existingScript) {
    console.log('🗑️ Removing previous script')
    existingScript.remove()
  }

  console.log('📥 Loading script...')
  const script = document.createElement('script')
  script.id = 'shellcatch-script'
  script.src = 'https://api-fiti-us-dev.shellcatch.com/static/script_v2.js'
  script.async = true
  script.onload = () => {
    console.log('✅ Script loaded successfully')
  }
  script.onerror = () => {
    console.error('❌ Failed to load script')
  }
  document.body.appendChild(script)
}

// Remove/unload Shellcatch script and cleanup container
const unloadShellcatchScript = () => {
  const existing = document.getElementById('shellcatch-script') || document.querySelector('script[src="https://api-fiti-us-dev.shellcatch.com/static/script_v2.js"]')
  if (existing) {
    console.log('🗑️ Removing Shellcatch script')
    existing.remove()
  }
  const container = document.getElementById('shellcatch_container_v2')
  if (container) {
    // remove iframes or other injected children except loading placeholder
    Array.from(container.children).forEach(child => {
      if (!child.classList || !child.classList.contains('shellcatch-loading')) child.remove()
    })
  }
}

// Fallback: fetch config from Shellcatch API and inject iframe manually
const fetchAndInjectShellcatchIframe = async (container) => {
  if (!container) return
  try {
    // Try local server-side proxy first (server/proxy.js)
    let res = null
    try {
      res = await fetch('http://localhost:3000/shellcatch-config')
    } catch (e) {
      // ignore, try vite proxy next
    }
    if (!res) res = await fetch(`/__shellcatch_config`)
    // Defensive parsing: check content-type before calling res.json()
    const contentType = (res && res.headers && res.headers.get) ? (res.headers.get('content-type') || '') : ''
    let json = null
    if (contentType.includes('application/json')) {
      try {
        json = await res.json()
      } catch (parseErr) {
        const text = await res.text().catch(() => null)
        console.error('Error parsing JSON from config endpoint, response text:', text)
        return false
      }
    } else {
      // Not JSON (likely HTML index page). Try local static fallback `public/shellcatch-config.json`.
      const text = await res.text().catch(() => null)
      console.warn('Config endpoint returned non-JSON response', res && res.status)

      try {
        const localRes = await fetch('shellcatch-config.json')
        if (localRes && localRes.ok) {
          const localJson = await localRes.json().catch(()=>null)
          if (localJson && localJson.success && localJson.data && localJson.data.url) {
            json = localJson
          } else {
            console.error('Local fallback config is invalid', localJson)
            return false
          }
        } else {
          console.error('Local fallback not available', localRes && localRes.status)
          return false
        }
      } catch (localErr) {
        console.error('Error loading local fallback config', localErr)
        return false
      }
    }

    if (json && json.success && json.data && json.data.url) {
      const data = json.data
      const iframe = document.createElement('iframe')
      iframe.src = data.url
      iframe.style.width = data.width || '100%'
      iframe.style.height = data.height || '900px'
      iframe.style.border = data.border || '0'
      iframe.style.transition = data.transition || 'none'
      iframe.style.overflow = data.overflow || 'hidden'
      iframe.setAttribute('scrolling', 'no')
        // Allow common features for embedded content and avoid adding sandbox restrictions here
        // Note: if the remote host sends X-Frame-Options or CSP frame-ancestors that block embedding,
        // the iframe will still be blocked — that must be fixed on the provider side or via a proxy.
        iframe.allow = 'fullscreen; geolocation; microphone; camera; autoplay'
        iframe.setAttribute('allowfullscreen', '')
        iframe.referrerPolicy = 'no-referrer'
      // remove prior injected iframes
      Array.from(container.querySelectorAll('iframe')).forEach(n=>n.remove())
      container.appendChild(iframe)
      console.info('✅ Injected  iframe via fallback')
      return true
    } else {
      console.warn('Config endpoint returned no usable data', json)
      return false
    }
  } catch (err) {
    console.warn('Error fetching config:', err)
    return false
  }
}

function Header({onProgressiveImprovementClick}){
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <div className="logo-container">
            <a href="#" className="logo-link" onClick={(e)=>{ e.preventDefault(); window.location.reload(); }} aria-label="Reload page">
              <img
                src="/fiti-clon/images/logo.png"
                alt="FiTI Logo"
                className="fiti-logo"
              />
            </a>
          </div>
        </div>
        <nav className="nav" aria-label="Main navigation">
          <ul className="nav-list">
            <li className="nav-item">
              <a href="#about" aria-haspopup="true">About ▾</a>
              <ul className="dropdown">
                <li><a href="#about">The FiTI</a></li>
                <li><a href="#approach">Timeline</a></li>
                <li><a href="#programmes">FiTI Standard</a></li>
                <li><a href="#programmes">Benefits</a></li>
                <li><a href="#programmes">Partnerships</a></li>
                <li><a href="#programmes">International Secretariat</a></li>
                <li><a href="#programmes">Careers</a></li>
              </ul>
            </li>
            <li className="nav-item">
              <a href="#countries" aria-haspopup="true">Countries ▾</a>
              <ul className="dropdown">
                <li><a href="#countries">Compliant Countries</a></li>
                <li><a href="#countries">Candidate Countries</a></li>
                <li><a href="#countries">Committed Countries</a></li>
                <li><a href="#countries">Target Countries</a></li>
              </ul>
            </li>
            <li className="nav-item">
              <a href="#approach" aria-haspopup="true">Approach ▾</a>
              <ul className="dropdown">
                <li><a href="#standard">Join the FiTI</a></li>
                <li><a href="#">Sign-up steps</a></li>
                <li><a href="#">Candidate application</a></li>
                <li><a href="#">FiTI Reports</a></li>
                <li><a href="#" onClick={(e)=>{ e.preventDefault(); onProgressiveImprovementClick(); }}>Progressive improvement</a></li>
                <li><a href="#">Validation</a></li>
              </ul>
            </li>
            <li className="nav-item">
              <a href="#programmes" aria-haspopup="true">Programmes ▾</a>
              <ul className="dropdown">
                <li><a href="#">tBrief series</a></li>
                <li><a href="#">TAKING STOCK</a></li>
                <li><a href="#">#KnowYourFisheries</a></li>
                <li><a href="#">beneFiTIng</a></li>
              </ul>
            </li>
            <li className="nav-item">
              <a href="#governance">Governance ▾</a>
              <ul className="dropdown">
                <li><a href="#">Association</a></li>
                <li><a href="#">International Board</a></li>
                <li><a href="#">Funding</a></li>
                <li><a href="#">Guiding Documents</a></li>
                <li><a href="#">Compliance Channel</a></li>
              </ul>
            </li>
            <li className="nav-item">
              <a href="#resources" aria-haspopup="true">Resources ▾</a>
              <ul className="dropdown">
                <li><a href="#">News, Updates, Blogs</a></li>
                <li><a href="#">Glossary</a></li>
                <li><a href="#">FAQs</a></li>
                <li><a href="#">Dictionary</a></li>
                <li><a href="#">Document Library</a></li>
              </ul>
            </li>
            <li className="nav-item nav-search">
              <button className="search-toggle" aria-label="Open search" aria-haspopup="true">
                {/* Magnifying glass icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M11 19a8 8 0 1 1 5.293-14.293A8 8 0 0 1 11 19z" stroke="#1e4a66" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 21l-4.35-4.35" stroke="#1e4a66" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <div className="dropdown search-dropdown" role="search">
                <form className="search-form" onSubmit={(e)=>{ e.preventDefault(); /* TODO: integrate search */ }}>
                  <input type="search" name="q" className="search-input" placeholder="Search …" aria-label="Search" />
                  <button type="submit" className="btn search-btn">Search</button>
                </form>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

function Hero(){
  return (
    <section className="hero hero--ocean" style={{backgroundImage:`url(${HERO_BG})`}}>
      <div className="hero-overlay"></div>
      <div className="container hero-inner">
        <h1 className="hero-title">Sustainable marine fisheries through transparency and multi-stakeholder collaboration</h1>
        <p className="lead">The Fisheries Transparency Initiative (FiTI) contributes to the sustainability of marine fisheries by supporting coastal countries to enhance the accessibility, credibility and usability of national fisheries management information.</p>
        <div className="hero-actions">
          <a className="btn primary" href="#join">Join the FiTI</a>
        </div>
      </div>
    </section>
  )
}

// Feature card component + items
function FeatureCard({icon,title,desc,isProgressiveImprovement,isActive,onClick}){
  // Loading handled centrally in `App` when modal opens; no local side-effects here.

  return (
    <div
      className={`feature-card ${isProgressiveImprovement ? 'progressive-improvement-card' : ''} ${isActive ? 'active' : ''}`}
      onClick={isProgressiveImprovement ? onClick : undefined}
      style={isProgressiveImprovement ? { cursor: 'pointer' } : {}}
    >
      <div className="feature-icon-shield">
        <img src={icon} alt="" className="shield-icon" />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  )
}

const items = [
  { 
    title:'Fisheries management',
    desc:'The FiTI focuses on public access to information for 12 thematic areas of marine capture fisheries, such as fishing licenses, vessel registry, catch data, subsidies and beneficial ownership.',
    icon:'/fiti-clon/images/icons/fisheries-management.png'
  },
  { 
    title:'Collective Action',
    desc:'Transparency needs trust! This is why the FiTI is implemented through National Multi-Stakeholder Groups, equally represented by government, companies and civil society.',
    icon:'/fiti-clon/images/icons/collective-action.png'
  },
  { 
    title:'Visibility & Usability',
    desc:'Transparency requires a two-sided approach: making data available in the public domain, and ensuring that stakeholders can draw reliable conclusions from it.',
    icon:'/fiti-clon/images/icons/visibility-usability.png'
  },
  { 
    title:'Progressive Improvement',
    desc:'Countries are not expected to have complete data for every thematic area from the beginning. Instead, public authorities must disclose the information they have, and where important gaps exist, demonstrate improvements over time.',
    icon:'/fiti-clon/images/icons/progressive-improvement.png'
  },
  { 
    title:'Quality At Source',
    desc:'The FiTI does not replace or duplicate existing government systems. Instead, the need for national authorities to develop and strengthen their own systems for collecting and publishing information online is emphasised.',
    icon:'/fiti-clon/images/icons/quality-source.png'
  },
  { 
    title:'Robust Assurance',
    desc:'The FiTI International Board undertakes regular evaluations to verify compliance of all participating countries against the FiTI Standard. This covers the provision of FiTI Reports, the meaningful involvement of stakeholders, as well as the impact of the FiTI in the country.',
    icon:'/fiti-clon/images/icons/robust-assurance.png'
  }
]

function Features({activeProgressiveCard, toggleProgressiveCard}){
  return (
    <section className="features" id="about">
      <div className="container">
        <div className="section-header"><h2>Core characteristics of the FiTI</h2></div>
        <div className="features-grid">
          {items.map((it,idx)=> (
            <FeatureCard
              key={idx}
              icon={it.icon}
              title={it.title}
              desc={it.desc}
              isProgressiveImprovement={it.title === 'Progressive Improvement'}
              isActive={it.title === 'Progressive Improvement' && activeProgressiveCard}
              onClick={toggleProgressiveCard}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FiTIStandard(){
  return (
    <section className="fiti-standard">
      <div className="container">
        <div className="standard-content">
          <h2>FiTI Standard: Defining for the first time what information on fisheries management should be published online by governments!</h2>
          <p>The FiTI Standard is an internationally recognised framework that sets clear requirements on what is expected from countries regarding transparency in marine fisheries. It was developed in a 2-year global consultation process with government representatives from fishing nations, industrial and artisanal fishing entities, civil society and intergovernmental organisations.</p>
          <a href="#standard" className="btn standard-btn">Learn more about the FiTI Standard</a>
        </div>
      </div>
    </section>
  )
}

function Countries(){
  const countries = [
    {name: 'Mauritania', code:'mr'},
    {name: 'Seychelles', code:'sc'},
    {name: 'Cabo Verde', code:'cv'},
    {name: 'Madagascar', code:'mg'},
    {name: 'Sao Tome and Principe', code:'st'},
    {name: 'Ecuador', code:'ec'},
    {name: 'Guinea', code:'gn'},
    {name: 'Chile', code:'cl'},
    {name: 'Comoros', code:'km'},
    {name: 'Ghana', code:'gh'},
    {name: 'Sierra Leone', code:'sl'},
    {name: 'Panama', code:'pa'},
    {name: 'Liberia', code:'lr'}
  ]
  
  return (
    <section className="countries" id="countries">
      <div className="container">
        <div className="countries-content">
          <div className="countries-text">
            <h2>FiTI countries:</h2>
            <p className="countries-intro">We contribute to the sustainability of marine fisheries by supporting the following countries to enhance the accessibility, credibility and usability of national fisheries management information.</p>
          </div>
          <div className="countries-flags">
            <div className="flags-grid">
              {countries.map((country, index) => (
                <div key={index} className="flag-item" title={country.name}>
                  <img src={`https://flagcdn.com/w320/${country.code}.png`} alt={`${country.name} flag`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Numbers(){
  const SVG_COLOR = "#1e4a66";

  const stats = [
    { 
      n:13, 
      t:'Governments committed to implement the FiTI Standard', 
      // Icono: Edificio/Monumento (Gobierno)
      icon:`<rect x="25" y="35" width="50" height="50" stroke="${SVG_COLOR}" stroke-width="3" fill="none"/>
            <path d="M25 45 L75 45" stroke="${SVG_COLOR}" stroke-width="3"/>
            <path d="M35 35 L50 20 L65 35" stroke="${SVG_COLOR}" stroke-width="3" fill="none"/>
            <rect x="35" y="55" width="10" height="15" fill="${SVG_COLOR}"/>
            <rect x="55" y="55" width="10" height="15" fill="${SVG_COLOR}"/>`
    },
    { 
      n:16, 
      t:'Fisheries information reports published by National Multi-Stakeholder Groups', 
      // Icono: Reporte/Documento (Informes)
      icon:`<rect x="30" y="20" width="40" height="60" rx="3" stroke="${SVG_COLOR}" stroke-width="3" fill="none"/>
            <line x1="38" y1="30" x2="62" y2="30" stroke="${SVG_COLOR}" stroke-width="2"/>
            <line x1="38" y1="40" x2="62" y2="40" stroke="${SVG_COLOR}" stroke-width="2"/>
            <line x1="38" y1="50" x2="55" y2="50" stroke="${SVG_COLOR}" stroke-width="2"/>`
    },
    { 
      n:99, 
      t:'Organisations engaged in National Multi-Stakeholder Groups', 
      // Icono: Múltiples personas/Grupo (Stakeholders)
      icon:`<circle cx="35" cy="40" r="10" stroke="${SVG_COLOR}" stroke-width="3" fill="none"/>
            <path d="M35 50 L35 60 A20 20 0 0 0 15 80 L55 80 A20 20 0 0 0 35 60 Z" stroke="${SVG_COLOR}" stroke-width="3" fill="none"/>
            <circle cx="65" cy="40" r="10" stroke="${SVG_COLOR}" stroke-width="3" fill="none"/>
            <path d="M65 50 L65 60 A20 20 0 0 0 45 80 L85 80 A20 20 0 0 0 65 60 Z" stroke="${SVG_COLOR}" stroke-width="3" fill="none"/>`
    },
    { 
      n:4, 
      t:'Country validations conducted to assess compliance against FiTI Standard', 
      // Icono: Martillo de Juez (Validaciones/Reglas)
      icon:`<path d="M25 75 L75 75 L70 65 L30 65 Z" fill="${SVG_COLOR}"/>
            <rect x="45" y="45" width="10" height="20" fill="${SVG_COLOR}"/>
            <rect x="50" y="25" width="30" height="10" rx="3" fill="${SVG_COLOR}"/>`
    },
    { 
      n:10, 
      t:"transparency briefings (short 'tBriefs') published in English, French, Spanish", 
      // Icono: Birrete de Graduación (Educación/Briefings)
      icon:`<path d="M20 40 L50 25 L80 40 L50 55 Z" stroke="${SVG_COLOR}" stroke-width="3" fill="none"/>
            <path d="M20 40 L20 65 M80 40 L80 65" stroke="${SVG_COLOR}" stroke-width="3"/>
            <line x1="20" y1="65" x2="80" y2="65" stroke="${SVG_COLOR}" stroke-width="3"/>
            <circle cx="50" cy="25" r="5" fill="${SVG_COLOR}"/>`
    },
    { 
      n:14, 
      t:'TAKING STOCK country transparency assessments conducted', 
      // Icono: Lupa (Evaluación/TAKING STOCK)
      icon:`<circle cx="40" cy="40" r="25" stroke="${SVG_COLOR}" stroke-width="4" fill="none"/>
            <line x1="58" y1="58" x2="85" y2="85" stroke="${SVG_COLOR}" stroke-width="4" stroke-linecap="round"/>
            <circle cx="40" cy="40" r="5" fill="${SVG_COLOR}"/>`
    }
  ]
  
  return (
    <section className="numbers" aria-label="FiTI in numbers">
      <div className="container">
        <h2>FiTI in numbers:</h2>
        <div className="numbers-grid">
          {stats.map((s,i)=>(
            <div key={i} className="stat">
              <div className="stat-icon">
                {/* Renderiza el SVG incrustado */}
                <svg width="48" height="48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" dangerouslySetInnerHTML={{__html:s.icon}} />
              </div>
              <div className="num">{s.n}</div>
              <div className="txt">{s.t}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function News(){
  const posts = [
    {
      title:'International students explore collective action through FiTI', 
      img:'/fiti-clon/images/news/conferencia.png',  // Imagen real de la videollamada de estudiantes 
      excerpt:'Students from Europe and Latin America explored the FiTI, the FiTI Standard and its multi-stakeholder approach to advancing sustainable fisheries management.',
      author: 'News, Uruguay',
      date: '6 October 2025',
      category: 'News'
    },
    {
      title:'New FiTI Compliance Channel provides avenue to voice concerns about national FiTI implementations', 
      img:'/fiti-clon/images/news/compliance.png', // Imagen real del canal de compliance 
      excerpt:'Today, the Fisheries Transparency Initiative (FiTI) launched its global FiTI Compliance Channel to support the integrity of national FiTI implementations.',
      author: 'By Dorothea Garff',
      date: '6 October 2025',
      category: 'Governance'
    },
    {
      title:'FiTI supports implementation of WTO Agreement on Fisheries Subsidies with new Fisheries Information System (FIS)', 
      img:'/fiti-clon/images/news/navigatingdigital.png', // Imagen real de la conferencia/foro 
      excerpt:'The FiTI announced the launch of the new Fisheries Information System (FIS), a platform that will allow countries to effectively share fisheries information with the public.',
      author: 'By Sven Biermann',
      date: '19 September 2025',
      category: 'Cabo Verde, Events, Ghana, Madagascar, Sao Tome and Principe'
    },
    {
      title:'Supporting Resilient Prosperity in the Caribbean', 
      img:'/fiti-clon/images/news/ECS.png', // Imagen real del diálogo del Caribe 
      excerpt:'The FiTI International Secretariat attended the Caribbean Regional Dialogue to explore "Advancing Resilient Prosperity" in small island developing states.',
      author: 'By Tyann Henry',
      date: '26 August 2025',
      category: 'News'
    },
    {
      title:'FiTI, fisheries transparency discussed in preparation for Cabo Verde\'s 1st Congress of the Fisheries and Aquaculture Sector', 
      img:'/fiti-clon/images/news/boats.png', // Imagen real de barcos/costa de Cabo Verde 
      excerpt:'The Fisheries Transparency Initiative (FiTI), participated in the Preparatory Day of the 1st Congress of the Fisheries and Aquaculture Sector (CESPA 2026-2036).',
      author: 'By Hiliana Silva',
      date: '21 August 2025',
      category: 'Cabo Verde'
    },
    {
      title:'Ghana inaugurates National Multi-Stakeholder Group (MSG) for fisheries transparency', 
      img:'/fiti-clon/images/news/reunion.png', // Imagen real de la inauguración en Ghana 
      excerpt:'The FiTI supported the Republic of Ghana to inaugurate a National Multi-Stakeholder Group to facilitate the effective implementation of the FiTI in Ghana.',
      author: 'By Godfred Ameyaw Asiedu',
      date: '1 August 2025',
      category: 'Ghana, Sign-up steps'
    },
    {
      title:'Latest TAKING STOCK assessment shines light on Indonesia\'s fisheries management transparency', 
      img:'/fiti-clon/images/news/image.png', // Imagen real del informe de Indonesia 
      excerpt:'A new TAKING STOCK assessment by the Fisheries Transparency Initiative (FiTI) explores the online transparency of Indonesia\'s marine fisheries management.',
      author: 'By Andre Standing',
      date: '25 July 2025',
      category: 'Indonesia, TAKING STOCK'
    }
  ]

  return (
    <section className="news" id="news">
      <div className="container">
        <h2>News, Updates, Blogs</h2>
        <div className="news-list">
          {posts.map((p,i)=>(
            <article key={i} className={`news-item ${i % 2 === 0 ? 'left' : 'right'}`}>
              <div className="thumb">
                {/* Usar la URL de la imagen real */}
                <img src={p.img} alt={p.title} />
              </div>
              <div className="news-body">
                <div className="news-meta">
                  {/* Dividir categorías por coma y renderizar como etiquetas */}
                  {p.category.split(',').map((cat, index) => (
                    <span key={index} className="category">{cat.trim()}</span>
                  ))}
                </div>
                <h3>{p.title}</h3>
                <div className="news-author">
                  <span>{p.author}</span>
                  <span className="date">{p.date}</span>
                  <span className="comments">0</span>
                </div>
                <p className="excerpt">{p.excerpt}</p>
                <a className="btn read-more" href="#">READ MORE</a>
              </div>
            </article>
          ))}
        </div>
        <div className="view-more-container">
          <a href="#" className="btn view-more">View More</a>
        </div>
      </div>
    </section>
  )
}

function SocialStrip(){
  return (
    <div className="social-strip" aria-hidden>
      <div className="social-strip-inner container">
        <a href="#" aria-label="Twitter">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M22 5.8c-.6.3-1.3.6-2 .7.7-.4 1.3-1 1.6-1.8-.6.4-1.4.6-2.2.8C18 4.5 17 4 16 4c-1.7 0-3 1.4-3 3 0 .2 0 .4.1.6C10 7.3 7.1 5.7 5.1 3.2c-.3.6-.5 1.3-.5 2 0 1.4.7 2.6 1.9 3.3-.6 0-1.1-.2-1.6-.4v.1c0 1.7 1.2 3.1 2.8 3.4-.3.1-.7.1-1 .1-.2 0-.5 0-.7-.1.5 1.6 2 2.7 3.7 2.7C8.9 18 7 18.6 5 18.2c1.8 1.1 4 1.8 6.3 1.8 7.6 0 11.8-6.1 11.8-11.4v-.5c.8-.6 1.5-1.3 2-2.1-.8.4-1.6.6-2.4.7z"/></svg>
          <span>Twitter</span>
        </a>
        <a href="#" aria-label="LinkedIn">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M4 4h4v16H4zM6 2C4.9 2 4 2.9 4 4s.9 2 2 2 2-.9 2-2S7.1 2 6 2zM9 8h4v2h.1c.6-1 2-2.1 4.2-2.1C22 7.9 23 10 23 13.3V20h-4v-6.2c0-1.5 0-3.5-2.1-3.5-2.1 0-2.4 1.6-2.4 3.4V20H9z"/></svg>
          <span>LinkedIn</span>
        </a>
        <a href="#" aria-label="YouTube">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M23 7s-.2-1.6-.8-2.3C21 4 19.9 4 19.2 4H4.8C4.1 4 3 4 1.8 4.7 1.2 5.4 1 7 1 7S0.9 9 0.9 11v2c0 2 .1 4 1 4s.2 1.6.8 2.3C3 22 4.1 22 4.8 22h14.4c.7 0 1.8 0 2.9-.7.6-.7.8-2.3.8-2.3s.1-2 .1-4v-2c0-2-.1-4-.1-4zM10 15V9l5 3-5 3z"/></svg>
          <span>YouTube</span>
        </a>
        <a href="#" aria-label="Facebook">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M22 12.1C22 6.6 17.5 2 12 2S2 6.6 2 12.1C2 17.1 5.7 21.3 10.5 22v-7.1H8.1v-2.8h2.4V10c0-2.4 1.4-3.7 3.5-3.7 1 0 2 .1 2 .1v2.3h-1.2c-1.1 0-1.4.7-1.4 1.4v1.7h2.8l-.4 2.8h-2.4V22C18.3 21.3 22 17.1 22 12.1z"/></svg>
          <span>Facebook</span>
        </a>
        <a href="#" aria-label="Instagram">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.3A4.7 4.7 0 1 0 16.7 13 4.7 4.7 0 0 0 12 8.3zm6.5-3a1.1 1.1 0 1 1-1.1 1.1A1.1 1.1 0 0 1 18.5 5.3zM12 10.6A1.4 1.4 0 1 1 10.6 12 1.4 1.4 0 0 1 12 10.6z"/></svg>
          <span>Instagram</span>
        </a>
        <a href="#" aria-label="Bluesky">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM8 11.5l4.5-4.5 1.5 1.5L10.5 13l4 4H8v-5.5z"/></svg>
          <span>Bluesky</span>
        </a>
      </div>
    </div>
  )
}

function Footer(){
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h4>Fisheries Transparency Initiative</h4>
              <p>Highway Point Building, PO Box 6079<br/>Providence, Mahé, Seychelles</p>
            </div>
            <div className="footer-col">
              <h4>Recent posts</h4>
              <ul>
                <li><a href="#">International students explore collective action through FiTI</a></li>
                <li><a href="#">New FiTI Compliance Channel provides avenue to voice concerns about national FiTI implementations</a></li>
                <li><a href="#">FiTI supports implementation of WTO Agreement on Fisheries Subsidies with new Fisheries Information System (FIS)</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Key activities</h4>
              <ul>
                <li><a href="#">#KnowYourFisheries</a></li>
                <li><a href="#">beneFiTIng – Incentives for government transparency of marine fisheries management</a></li>
                <li><a href="#">TAKING STOCK – Online Transparency of Fisheries Management Information</a></li>
                <li><a href="#">tBrief series</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>Copyright {new Date().getFullYear()} | Fisheries Transparency Initiative (FiTI) | All rights reserved</p>
        </div>
      </div>
    </footer>
  )
}

export default function App(){
  const [showTop, setShowTop] = useState(false)
  const [activeProgressiveCard, setActiveProgressiveCard] = useState(false)

  useEffect(()=>{
    const onScroll = () => setShowTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top:0, behavior:'smooth' })

  const toggleProgressiveCard = () => {
    setActiveProgressiveCard(!activeProgressiveCard)
  }

  // When modal opens, load Shellcatch; when it closes, unload to force fresh load next time
  useEffect(()=>{
    let timer
    if (activeProgressiveCard) {
      // Wait a tick so the container is mounted into the DOM
      timer = setTimeout(()=>{
        // ensure container exists; the JSX renders it when activeProgressiveCard is true
        const container = document.getElementById('shellcatch_container_v2')
        if (!container) console.warn('Container not found at load time')
        // remove any previous script and load fresh
        unloadShellcatchScript()
        loadShellcatchScript()
        // After a short delay, if the container still has no injected content, try fallback
        setTimeout(async ()=>{
          const c = document.getElementById('shellcatch_container_v2')
          if (!c) return
          // If only the loading placeholder is present (or no children), try fallback
          const hasContent = Array.from(c.children).some(ch => !ch.classList || !ch.classList.contains('shellcatch-loading'))
          if (!hasContent) {
            console.info('No content rendered by script, attempting fallback iframe injection')
            await fetchAndInjectShellcatchIframe(c)
          }
        }, 1400)
      }, 50)
    } else {
      unloadShellcatchScript()
    }
    return ()=>{ if (timer) clearTimeout(timer) }
  }, [activeProgressiveCard])

  return (
    <div>
      <Header onProgressiveImprovementClick={toggleProgressiveCard} />
      <main>
        <Hero />
        <Features activeProgressiveCard={activeProgressiveCard} toggleProgressiveCard={toggleProgressiveCard} />
        <FiTIStandard />
        <Countries />
        <News />
        <Numbers />
        <SocialStrip />
      </main>
      <Footer />

      {activeProgressiveCard && (
        <div className="shellcatch-modal-overlay">
          <div className="shellcatch-modal">
            <button className="shellcatch-close" onClick={toggleProgressiveCard}>✕</button>
            <div
              id="shellcatch_container_v2"
              data-shellcatch="true"
              data-container="shellcatch"
              data-dashboard="progressive-improvement"
              role="region"
              aria-label="Progressive Improvement Dashboard"
              style={{ width: '100%', height: '100%' }}
            >
              <div className="shellcatch-loading">
                <p>Cargando dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button className={`back-to-top ${showTop ? 'visible' : ''}`} aria-label="Back to top" onClick={scrollToTop}>↑</button>
    </div>
  )
}
