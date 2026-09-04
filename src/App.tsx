import { useEffect, useRef, useState } from 'react'
import './App.css'

type TrackKind = 'straight' | 'curve' | 'switch-left' | 'switch-right' | 'switch-three' | 'crossing' | 'buffer' | 'special'
type TrackClass = 'main' | 'siding' | 'station'
type TerrainKind = 'grass' | 'earth' | 'water' | 'hill' | 'building'

type TrackDefinition = {
  id: string
  article: string
  name: string
  detail: string
  kind: TrackKind
  size: number
}

type PlacedTrack = {
  id: string
  definitionId: string
  x: number
  y: number
  rotation: number
  circuit: string
  trackClass: TrackClass
}

type TerrainPatch = {
  id: string
  x: number
  y: number
  kind: TerrainKind
}

const TRACKS: TrackDefinition[] = [
  { id: 'g41', article: '10040', name: 'Gerades Gleis', detail: '41 mm', kind: 'straight', size: 38 },
  { id: 'g52', article: '10050', name: 'Gerades Gleis', detail: '52 mm', kind: 'straight', size: 42 },
  { id: 'g75', article: '10070', name: 'Gerades Gleis', detail: '75 mm', kind: 'straight', size: 46 },
  { id: 'g82', article: '10080', name: 'Gerades Gleis', detail: '82 mm', kind: 'straight', size: 48 },
  { id: 'g-adjustable', article: '10090', name: 'Verstellbares Gleis', detail: '88–120 mm', kind: 'special', size: 54 },
  { id: 'g150', article: '10150', name: 'Gerades Gleis', detail: '150 mm', kind: 'straight', size: 58 },
  { id: 'g300', article: '10000', name: 'Gerades Gleis', detail: '300 mm', kind: 'straight', size: 80 },
  { id: 'g600', article: '10600', name: 'Gerades Gleis', detail: '600 mm', kind: 'straight', size: 120 },
  { id: 'g1200', article: '10610', name: 'Gerades Gleis', detail: '1.200 mm', kind: 'straight', size: 180 },
  { id: 'r1-7-5', article: '11040', name: 'Kurve R1', detail: '7,5° · R 600 mm', kind: 'curve', size: 48 },
  { id: 'r1-15', article: '11020', name: 'Kurve R1', detail: '15° · R 600 mm', kind: 'curve', size: 68 },
  { id: 'r1', article: '11000', name: 'Kurve R1', detail: '30° · R 600 mm', kind: 'curve', size: 88 },
  { id: 'r2', article: '15000', name: 'Kurve R2', detail: '30° · R 780 mm', kind: 'curve', size: 100 },
  { id: 'r3', article: '16000', name: 'Kurve R3', detail: '22,5° · R 1.195 mm', kind: 'curve', size: 112 },
  { id: 'r5-7-5', article: '18020', name: 'Kurve R5', detail: '7,5° · R 2.320 mm', kind: 'curve', size: 92 },
  { id: 'r5', article: '18000', name: 'Kurve R5', detail: '15° · R 2.320 mm', kind: 'curve', size: 126 },
  { id: 'wr-r1', article: '12000', name: 'Handweiche rechts R1', detail: '30° · 300 mm', kind: 'switch-right', size: 116 },
  { id: 'wr-r1-electric', article: '12050', name: 'Elektroweiche rechts R1', detail: '30° · 300 mm', kind: 'switch-right', size: 116 },
  { id: 'wl-r1', article: '12100', name: 'Handweiche links R1', detail: '30° · 300 mm', kind: 'switch-left', size: 116 },
  { id: 'wl-r1-electric', article: '12150', name: 'Elektroweiche links R1', detail: '30° · 300 mm', kind: 'switch-left', size: 116 },
  { id: 'wr-r3', article: '16040', name: 'Handweiche rechts R3', detail: '22,5° · R 1.195 mm', kind: 'switch-right', size: 138 },
  { id: 'wr-r3-electric', article: '16050', name: 'Elektroweiche rechts R3', detail: '22,5° · R 1.195 mm', kind: 'switch-right', size: 138 },
  { id: 'wl-r3', article: '16140', name: 'Handweiche links R3', detail: '22,5° · R 1.195 mm', kind: 'switch-left', size: 138 },
  { id: 'wl-r3-electric', article: '16150', name: 'Elektroweiche links R3', detail: '22,5° · R 1.195 mm', kind: 'switch-left', size: 138 },
  { id: 'wr-r5-manual', article: '18050', name: 'Handweiche rechts R5', detail: '15° · 600 mm', kind: 'switch-right', size: 166 },
  { id: 'wl-r5-manual', article: '18150', name: 'Handweiche links R5', detail: '15° · 600 mm', kind: 'switch-left', size: 166 },
  { id: 'double-slip', article: '12260', name: 'Doppelkreuzungsweiche', detail: 'R2 · 22,5° · 375 mm', kind: 'crossing', size: 138 },
  { id: 'three-way', article: '12360', name: 'Dreiwegeweiche', detail: 'R1 · 30° · 375 mm', kind: 'switch-three', size: 138 },
  { id: 'cross', article: '13000', name: 'Kreuzung R1', detail: '30°', kind: 'crossing', size: 105 },
  { id: 'cross-90', article: '13100', name: 'Kreuzung', detail: '90°', kind: 'crossing', size: 92 },
  { id: 'cross-r3', article: '13200', name: 'Kreuzung R3', detail: '22,5° · 375 mm', kind: 'crossing', size: 138 },
  { id: 'reverse-loop', article: '10151', name: 'Kehrschleifengleis-Set', detail: '2 × 150 mm · analog', kind: 'special', size: 62 },
  { id: 'isolation-double', article: '10152', name: 'Trenngleis, zweipolig', detail: '150 mm', kind: 'special', size: 62 },
  { id: 'isolation-single', article: '10153', name: 'Trenngleis, einpolig', detail: '150 mm', kind: 'special', size: 62 },
  { id: 'uncoupler-manual', article: '10520', name: 'Entkupplungsgleis manuell', detail: '150 mm', kind: 'special', size: 62 },
  { id: 'uncoupler', article: '10560', name: 'Entkupplungsgleis elektrisch', detail: '150 mm', kind: 'special', size: 62 },
  { id: 'flex', article: '10005', name: 'Flexgleis-Schiene', detail: '1.500 mm · individuell biegbar', kind: 'special', size: 200 },
  { id: 'rack', article: '10210', name: 'Zahnstange', detail: '300 mm · Zahnradbahn', kind: 'special', size: 80 },
  { id: 'road-crossing', article: '10007', name: 'Straßenüberfahrt', detail: '300 mm', kind: 'special', size: 80 },
  { id: 'buffer', article: '10310', name: 'Prellbock beleuchtet', detail: 'Modern', kind: 'buffer', size: 58 },
  { id: 'buffer-standard', article: '10315', name: 'Prellbock', detail: 'Standard', kind: 'buffer', size: 58 },
  { id: 'buffer-rhb', article: '10316', name: 'Prellbock RhB', detail: 'Epoche VI', kind: 'buffer', size: 58 },
  { id: 'buffer-old', article: '10320', name: 'Prellbock Old Timer', detail: 'Gebogene Schienen', kind: 'buffer', size: 58 },
]

const CIRCUITS = [
  { id: 'A', name: 'Stromkreis A', color: '#ef5b3f' },
  { id: 'B', name: 'Stromkreis B', color: '#3c82e0' },
  { id: 'C', name: 'Stromkreis C', color: '#e6a52e' },
  { id: 'D', name: 'Digital / frei', color: '#805cc7' },
]

const TERRAIN: { id: TerrainKind; label: string; icon: string }[] = [
  { id: 'grass', label: 'Wiese', icon: '♧' },
  { id: 'earth', label: 'Erde', icon: '◌' },
  { id: 'water', label: 'Wasser', icon: '≈' },
  { id: 'hill', label: 'Hügel', icon: '⌁' },
  { id: 'building', label: 'Gebäude', icon: '▣' },
]

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

function TrackShape({ track, selected }: { track: PlacedTrack; selected: boolean }) {
  const definition = TRACKS.find((item) => item.id === track.definitionId) ?? TRACKS[0]
  const circuit = CIRCUITS.find((item) => item.id === track.circuit) ?? CIRCUITS[0]
  const rail = circuit.color
  const length = definition.size
  const common = { fill: 'none', stroke: rail, strokeWidth: 7, strokeLinecap: 'round' as const }
  const sleeper = { stroke: '#433b32', strokeWidth: 16, strokeDasharray: '3 9', opacity: .85 }

  return (
    <g transform={`translate(${track.x} ${track.y}) rotate(${track.rotation})`} className="track-shape">
      {selected && <rect x={-length / 2 - 15} y={-36} width={length + 30} height={72} rx={14} className="selection-ring" />}
      {definition.kind === 'straight' || definition.kind === 'special' || definition.kind === 'buffer' ? (
        <>
          <line x1={-length / 2} y1="0" x2={length / 2} y2="0" {...sleeper} />
          <line x1={-length / 2} y1="-7" x2={length / 2} y2="-7" {...common} />
          <line x1={-length / 2} y1="7" x2={length / 2} y2="7" {...common} />
          {definition.kind === 'special' && <rect x="-14" y="-24" width="28" height="48" rx="5" fill="#f4c65d" stroke="#433b32" strokeWidth="3" />}
          {definition.kind === 'buffer' && <path d={`M ${length / 2 - 8} -25 V 25 M ${length / 2 - 18} -19 L ${length / 2 - 8} 0 L ${length / 2 - 18} 19`} stroke="#433b32" strokeWidth="7" fill="none" />}
        </>
      ) : definition.kind === 'curve' ? (
        <>
          <path d={`M ${-length / 2} 22 Q 0 -34 ${length / 2} 6`} {...sleeper} />
          <path d={`M ${-length / 2} 15 Q 0 -41 ${length / 2} -1`} {...common} />
          <path d={`M ${-length / 2} 29 Q 0 -27 ${length / 2} 13`} {...common} />
        </>
      ) : definition.kind === 'crossing' ? (
        <>
          <path d={`M ${-length / 2} -20 L ${length / 2} 20 M ${-length / 2} 20 L ${length / 2} -20`} {...sleeper} />
          <path d={`M ${-length / 2} -27 L ${length / 2} 13 M ${-length / 2} -13 L ${length / 2} 27 M ${-length / 2} 13 L ${length / 2} -27 M ${-length / 2} 27 L ${length / 2} -13`} {...common} />
        </>
      ) : definition.kind === 'switch-three' ? (
        <>
          <path d={`M ${-length / 2} 0 L ${length / 2} 0 M -10 0 Q 35 -42 ${length / 2} -38 M -10 0 Q 35 42 ${length / 2} 38`} {...sleeper} />
          <path d={`M ${-length / 2} -7 L ${length / 2} -7 M ${-length / 2} 7 L ${length / 2} 7`} {...common} />
          <path d={`M -12 -5 Q 32 -48 ${length / 2} -45 M -7 7 Q 38 -35 ${length / 2} -31`} {...common} />
          <path d={`M -12 5 Q 32 48 ${length / 2} 45 M -7 -7 Q 38 35 ${length / 2} 31`} {...common} />
        </>
      ) : (
        <>
          <path d={`M ${-length / 2} 0 L ${length / 2} 0 M -10 0 Q 35 ${definition.kind === 'switch-left' ? -42 : 42} ${length / 2} ${definition.kind === 'switch-left' ? -38 : 38}`} {...sleeper} />
          <path d={`M ${-length / 2} -7 L ${length / 2} -7 M ${-length / 2} 7 L ${length / 2} 7`} {...common} />
          <path d={`M -12 -5 Q 32 ${definition.kind === 'switch-left' ? -48 : 34} ${length / 2} ${definition.kind === 'switch-left' ? -45 : 31}`} {...common} />
          <path d={`M -7 7 Q 38 ${definition.kind === 'switch-left' ? -35 : 48} ${length / 2} ${definition.kind === 'switch-left' ? -31 : 45}`} {...common} />
        </>
      )}
      <g className="track-badge" transform={`translate(0 34) rotate(${-track.rotation})`}>
        <rect x="-16" y="-10" width="32" height="20" rx="10" fill={rail} />
        <text textAnchor="middle" dominantBaseline="central">{track.trackClass === 'siding' ? 'AG' : track.trackClass === 'station' ? 'Bf' : track.circuit}</text>
      </g>
    </g>
  )
}

function App() {
  const [tracks, setTracks] = useState<PlacedTrack[]>(() => {
    try { return JSON.parse(localStorage.getItem('lgb-tracks') || '[]') } catch { return [] }
  })
  const [terrain, setTerrain] = useState<TerrainPatch[]>(() => {
    try { return JSON.parse(localStorage.getItem('lgb-terrain') || '[]') } catch { return [] }
  })
  const [environment, setEnvironment] = useState<'outdoor' | 'indoor'>('outdoor')
  const [activeTrack, setActiveTrack] = useState<string | null>('g600')
  const [terrainBrush, setTerrainBrush] = useState<TerrainKind | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeCircuit, setActiveCircuit] = useState('A')
  const [trackClass, setTrackClass] = useState<TrackClass>('main')
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'track' | 'switch' | 'special'>('all')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [projectName, setProjectName] = useState('Meine Gartenbahn')
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem('lgb-tracks', JSON.stringify(tracks))
    localStorage.setItem('lgb-terrain', JSON.stringify(terrain))
  }, [tracks, terrain])

  const canvasPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: ((event.clientX - rect.left) / rect.width) * 1200, y: ((event.clientY - rect.top) / rect.height) * 750 }
  }

  const handleCanvasDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if ((event.target as Element).closest('[data-track]')) return
    const point = canvasPoint(event)
    setSelectedId(null)
    if (terrainBrush) {
      setTerrain((items) => [...items, { id: uid(), x: point.x, y: point.y, kind: terrainBrush }])
    } else if (activeTrack) {
      const item: PlacedTrack = { id: uid(), definitionId: activeTrack, x: point.x, y: point.y, rotation: 0, circuit: activeCircuit, trackClass }
      setTracks((items) => [...items, item])
      setSelectedId(item.id)
    }
  }

  const startDrag = (event: React.PointerEvent<SVGGElement>, track: PlacedTrack) => {
    event.stopPropagation()
    const svg = event.currentTarget.ownerSVGElement
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 1200
    const y = ((event.clientY - rect.top) / rect.height) * 750
    dragRef.current = { id: track.id, dx: x - track.x, dy: y - track.y }
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelectedId(track.id)
  }

  const moveDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return
    const point = canvasPoint(event)
    const { id, dx, dy } = dragRef.current
    setTracks((items) => items.map((item) => item.id === id ? { ...item, x: point.x - dx, y: point.y - dy } : item))
  }

  const updateSelected = (change: Partial<PlacedTrack>) => {
    setTracks((items) => items.map((item) => item.id === selectedId ? { ...item, ...change } : item))
  }

  const selected = tracks.find((item) => item.id === selectedId)
  const filteredTracks = TRACKS.filter((item) => {
    const matchesCategory =
      catalogFilter === 'track' ? item.kind === 'straight' || item.kind === 'curve'
        : catalogFilter === 'switch' ? item.kind.includes('switch')
          : catalogFilter === 'special' ? ['crossing', 'buffer', 'special'].includes(item.kind)
            : true
    const query = catalogSearch.trim().toLocaleLowerCase('de')
    return matchesCategory && (!query || `${item.article} ${item.name} ${item.detail}`.toLocaleLowerCase('de').includes(query))
  })

  const resetProject = () => {
    if (tracks.length + terrain.length > 0 && !window.confirm('Den aktuellen Plan wirklich leeren?')) return
    setTracks([])
    setTerrain([])
    setSelectedId(null)
  }

  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ version: 1, projectName, environment, tracks, terrain }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${projectName.replace(/[^a-z0-9äöüß]+/gi, '-').toLowerCase()}.lgb.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const importProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (!Array.isArray(data.tracks) || !Array.isArray(data.terrain)) throw new Error()
        setTracks(data.tracks)
        setTerrain(data.terrain)
        setProjectName(data.projectName || 'Importierter Plan')
        setEnvironment(data.environment === 'indoor' ? 'indoor' : 'outdoor')
      } catch {
        window.alert('Diese Datei ist kein gültiger LGB-Plan.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span>G</span></div>
          <div><strong>LGB Planer</strong><small>Gartenbahn gestalten</small></div>
        </div>
        <label className="project-title">
          <span>Projekt</span>
          <input value={projectName} onChange={(event) => setProjectName(event.target.value)} aria-label="Projektname" />
        </label>
        <div className="header-actions">
          <button className="icon-button" onClick={resetProject} title="Neuer Plan">＋<span>Neu</span></button>
          <button className="icon-button" onClick={() => fileRef.current?.click()} title="Plan öffnen">↥<span>Öffnen</span></button>
          <button className="save-button" onClick={exportProject}>↓ <span>Plan sichern</span></button>
          <input ref={fileRef} type="file" accept=".json,.lgb" hidden onChange={importProject} />
        </div>
      </header>

      <main>
        <aside className={`catalog ${sidebarOpen ? 'open' : ''}`}>
          <div className="panel-heading">
            <div><span className="eyebrow">Bauteile</span><h2>Gleiskatalog</h2></div>
            <button className="close-catalog" onClick={() => setSidebarOpen(false)} aria-label="Katalog schließen">×</button>
          </div>
          <div className="segment-control">
            {(['all', 'track', 'switch', 'special'] as const).map((filter) => (
              <button key={filter} className={catalogFilter === filter ? 'active' : ''} onClick={() => setCatalogFilter(filter)}>
                {{ all: 'Alle', track: 'Gleise', switch: 'Weichen', special: 'Sonder' }[filter]}
              </button>
            ))}
          </div>
          <label className="catalog-search">
            <span aria-hidden="true">⌕</span>
            <input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder={`${TRACKS.length} Gleisartikel durchsuchen`} aria-label="Gleiskatalog durchsuchen" />
          </label>
          <div className="track-list">
            {filteredTracks.map((item) => (
              <button key={item.id} className={`catalog-card ${activeTrack === item.id && !terrainBrush ? 'active' : ''}`} onClick={() => { setActiveTrack(item.id); setTerrainBrush(null); if (window.innerWidth <= 900) setSidebarOpen(false) }}>
                <span className={`track-preview ${item.kind}`} aria-hidden="true">
                  <svg viewBox="0 0 100 56"><TrackShape track={{ id: '', definitionId: item.id, x: 50, y: 28, rotation: 0, circuit: 'A', trackClass: 'main' }} selected={false} /></svg>
                </span>
                <span><strong>{item.name}</strong><small>{item.article} · {item.detail}</small></span>
                <span className="add-symbol">＋</span>
              </button>
            ))}
          </div>
          <div className="catalog-hint"><strong>Tipp</strong><p>Bauteil wählen und anschließend in die Planfläche tippen. Bereits platzierte Gleise lassen sich ziehen.</p></div>
        </aside>

        <section className="workspace">
          <div className="workspace-toolbar">
            <button className="mobile-catalog" onClick={() => setSidebarOpen(true)}>☰ <span>Gleise</span></button>
            <div className="mode-switch">
              <button className={environment === 'outdoor' ? 'active' : ''} onClick={() => setEnvironment('outdoor')}>☀ Outdoor</button>
              <button className={environment === 'indoor' ? 'active' : ''} onClick={() => setEnvironment('indoor')}>⌂ Indoor</button>
            </div>
            <div className="toolbar-divider" />
            <label>Stromkreis
              <select value={activeCircuit} onChange={(event) => setActiveCircuit(event.target.value)}>
                {CIRCUITS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>Gleistyp
              <select value={trackClass} onChange={(event) => setTrackClass(event.target.value as TrackClass)}>
                <option value="main">Hauptstrecke</option><option value="siding">Abstellgleis</option><option value="station">Bahnhofsgleis</option>
              </select>
            </label>
          </div>

          <div className="canvas-wrap">
            <svg
              className={`layout-canvas ${environment}`}
              viewBox="0 0 1200 750"
              preserveAspectRatio="none"
              onPointerDown={handleCanvasDown}
              onPointerMove={moveDrag}
              onPointerUp={() => { dragRef.current = null }}
              onPointerCancel={() => { dragRef.current = null }}
              aria-label="Planfläche"
            >
              <defs>
                <pattern id="smallGrid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="1" /></pattern>
                <pattern id="largeGrid" width="150" height="150" patternUnits="userSpaceOnUse"><rect width="150" height="150" fill="url(#smallGrid)" /><path d="M 150 0 L 0 0 0 150" fill="none" stroke="currentColor" strokeWidth="1.5" /></pattern>
                <filter id="patchShadow"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity=".15" /></filter>
              </defs>
              <rect width="1200" height="750" className="canvas-ground" />
              {environment === 'indoor' && <g className="room-outline"><rect x="45" y="45" width="1110" height="660" rx="6" /><path d="M 180 45 v100 h-135 M 970 705 v-115 h185" /></g>}
              {terrain.map((patch) => (
                <g key={patch.id} transform={`translate(${patch.x} ${patch.y})`} className={`terrain-patch ${patch.kind}`} onDoubleClick={() => setTerrain((items) => items.filter((item) => item.id !== patch.id))}>
                  {patch.kind === 'building' ? <rect x="-55" y="-42" width="110" height="84" rx="7" /> : <ellipse rx={patch.kind === 'water' ? 80 : 62} ry={patch.kind === 'water' ? 40 : 52} />}
                  <text textAnchor="middle" dominantBaseline="central">{TERRAIN.find((item) => item.id === patch.kind)?.icon}</text>
                </g>
              ))}
              <rect width="1200" height="750" fill="url(#largeGrid)" className="grid" />
              {tracks.map((track) => (
                <g key={track.id} data-track="" onPointerDown={(event) => startDrag(event, track)} className={`placed-track ${track.trackClass}`}>
                  <TrackShape track={track} selected={selectedId === track.id} />
                </g>
              ))}
              {tracks.length === 0 && terrain.length === 0 && (
                <g className="empty-state" transform="translate(600 340)">
                  <circle r="54" /><text y="8">⌁</text>
                  <text className="empty-title" y="92">Deine Anlage beginnt hier</text>
                  <text className="empty-copy" y="124">Wähle links ein Gleis oder unten ein Geländewerkzeug.</text>
                </g>
              )}
            </svg>
            <div className="scale"><span /> 1 m</div>
            <div className="status-pill">{tracks.length} Gleise · {terrain.length} Geländeelemente</div>
          </div>

          <div className="bottom-tools">
            <div className="terrain-tools">
              <span><small>Gelände</small><strong>Grobmodellierung</strong></span>
              {TERRAIN.map((item) => (
                <button key={item.id} className={terrainBrush === item.id ? 'active' : ''} onClick={() => { setTerrainBrush(terrainBrush === item.id ? null : item.id); setActiveTrack(null) }} title={item.label}>
                  <b>{item.icon}</b><span>{item.label}</span>
                </button>
              ))}
            </div>
            <button className="clear-terrain" onClick={() => setTerrain([])} disabled={!terrain.length}>Gelände löschen</button>
          </div>

          {selected && (
            <div className="selection-panel">
              <div><small>Auswahl</small><strong>{TRACKS.find((item) => item.id === selected.definitionId)?.name}</strong></div>
              <button onClick={() => updateSelected({ rotation: ((selected.rotation - 15) % 360 + 360) % 360 })}>↶ <span>Drehen</span></button>
              <button onClick={() => updateSelected({ rotation: (selected.rotation + 15) % 360 })}>↷ <span>Drehen</span></button>
              <label><span>Stromkreis</span><select value={selected.circuit} onChange={(event) => updateSelected({ circuit: event.target.value })}>{CIRCUITS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>Kennzeichnung</span><select value={selected.trackClass} onChange={(event) => updateSelected({ trackClass: event.target.value as TrackClass })}><option value="main">Hauptstrecke</option><option value="siding">Abstellgleis</option><option value="station">Bahnhofsgleis</option></select></label>
              <button className="delete-button" onClick={() => { setTracks((items) => items.filter((item) => item.id !== selected.id)); setSelectedId(null) }}>⌫ <span>Löschen</span></button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
