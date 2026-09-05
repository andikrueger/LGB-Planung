import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
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
  lengthMm: number
  radiusMm?: number
  angleDeg?: number
}

type TrackConnection = { x: number; y: number; angle: number }
type TrackGeometry = { paths: string[]; connections: TrackConnection[] }

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

type CanvasSize = {
  widthMeters: number
  heightMeters: number
}

type TrackInventory = Record<string, number>

type PlannerOptions = {
  straightSections: number
  sidings: number
  stationTracks: number
}

const TRACKS: TrackDefinition[] = [
  { id: 'g41', article: '10040', name: 'Gerades Gleis', detail: '41 mm', kind: 'straight', lengthMm: 41 },
  { id: 'g52', article: '10050', name: 'Gerades Gleis', detail: '52 mm', kind: 'straight', lengthMm: 52 },
  { id: 'g75', article: '10070', name: 'Gerades Gleis', detail: '75 mm', kind: 'straight', lengthMm: 75 },
  { id: 'g82', article: '10080', name: 'Gerades Gleis', detail: '82 mm', kind: 'straight', lengthMm: 82 },
  { id: 'g-adjustable', article: '10090', name: 'Verstellbares Gleis', detail: '88–120 mm', kind: 'special', lengthMm: 104 },
  { id: 'g150', article: '10150', name: 'Gerades Gleis', detail: '150 mm', kind: 'straight', lengthMm: 150 },
  { id: 'g300', article: '10000', name: 'Gerades Gleis', detail: '300 mm', kind: 'straight', lengthMm: 300 },
  { id: 'g600', article: '10600', name: 'Gerades Gleis', detail: '600 mm', kind: 'straight', lengthMm: 600 },
  { id: 'g1200', article: '10610', name: 'Gerades Gleis', detail: '1.200 mm', kind: 'straight', lengthMm: 1200 },
  { id: 'r1-7-5', article: '11040', name: 'Kurve R1', detail: '7,5° · R 600 mm', kind: 'curve', lengthMm: 79, radiusMm: 600, angleDeg: 7.5 },
  { id: 'r1-15', article: '11020', name: 'Kurve R1', detail: '15° · R 600 mm', kind: 'curve', lengthMm: 157, radiusMm: 600, angleDeg: 15 },
  { id: 'r1', article: '11000', name: 'Kurve R1', detail: '30° · R 600 mm', kind: 'curve', lengthMm: 314, radiusMm: 600, angleDeg: 30 },
  { id: 'r2', article: '15000', name: 'Kurve R2', detail: '30° · R 780 mm', kind: 'curve', lengthMm: 408, radiusMm: 780, angleDeg: 30 },
  { id: 'r3', article: '16000', name: 'Kurve R3', detail: '22,5° · R 1.195 mm', kind: 'curve', lengthMm: 469, radiusMm: 1195, angleDeg: 22.5 },
  { id: 'r5-7-5', article: '18020', name: 'Kurve R5', detail: '7,5° · R 2.320 mm', kind: 'curve', lengthMm: 304, radiusMm: 2320, angleDeg: 7.5 },
  { id: 'r5', article: '18000', name: 'Kurve R5', detail: '15° · R 2.320 mm', kind: 'curve', lengthMm: 607, radiusMm: 2320, angleDeg: 15 },
  { id: 'wr-r1', article: '12000', name: 'Handweiche rechts R1', detail: '30° · 300 mm', kind: 'switch-right', lengthMm: 300, radiusMm: 600, angleDeg: 30 },
  { id: 'wr-r1-electric', article: '12050', name: 'Elektroweiche rechts R1', detail: '30° · 300 mm', kind: 'switch-right', lengthMm: 300, radiusMm: 600, angleDeg: 30 },
  { id: 'wl-r1', article: '12100', name: 'Handweiche links R1', detail: '30° · 300 mm', kind: 'switch-left', lengthMm: 300, radiusMm: 600, angleDeg: 30 },
  { id: 'wl-r1-electric', article: '12150', name: 'Elektroweiche links R1', detail: '30° · 300 mm', kind: 'switch-left', lengthMm: 300, radiusMm: 600, angleDeg: 30 },
  { id: 'wr-r3', article: '16040', name: 'Handweiche rechts R3', detail: '22,5° · R 1.195 mm', kind: 'switch-right', lengthMm: 440, radiusMm: 1195, angleDeg: 22.5 },
  { id: 'wr-r3-electric', article: '16050', name: 'Elektroweiche rechts R3', detail: '22,5° · R 1.195 mm', kind: 'switch-right', lengthMm: 440, radiusMm: 1195, angleDeg: 22.5 },
  { id: 'wl-r3', article: '16140', name: 'Handweiche links R3', detail: '22,5° · R 1.195 mm', kind: 'switch-left', lengthMm: 440, radiusMm: 1195, angleDeg: 22.5 },
  { id: 'wl-r3-electric', article: '16150', name: 'Elektroweiche links R3', detail: '22,5° · R 1.195 mm', kind: 'switch-left', lengthMm: 440, radiusMm: 1195, angleDeg: 22.5 },
  { id: 'wr-r5-manual', article: '18050', name: 'Handweiche rechts R5', detail: '15° · 600 mm', kind: 'switch-right', lengthMm: 600, radiusMm: 2320, angleDeg: 15 },
  { id: 'wl-r5-manual', article: '18150', name: 'Handweiche links R5', detail: '15° · 600 mm', kind: 'switch-left', lengthMm: 600, radiusMm: 2320, angleDeg: 15 },
  { id: 'double-slip', article: '12260', name: 'Doppelkreuzungsweiche', detail: 'R2 · 22,5° · 375 mm', kind: 'crossing', lengthMm: 375, angleDeg: 22.5 },
  { id: 'three-way', article: '12360', name: 'Dreiwegeweiche', detail: 'R1 · 30° · 375 mm', kind: 'switch-three', lengthMm: 375, radiusMm: 600, angleDeg: 30 },
  { id: 'cross', article: '13000', name: 'Kreuzung R1', detail: '30°', kind: 'crossing', lengthMm: 300, angleDeg: 30 },
  { id: 'cross-90', article: '13100', name: 'Kreuzung', detail: '90°', kind: 'crossing', lengthMm: 150, angleDeg: 90 },
  { id: 'cross-r3', article: '13200', name: 'Kreuzung R3', detail: '22,5° · 375 mm', kind: 'crossing', lengthMm: 375, angleDeg: 22.5 },
  { id: 'reverse-loop', article: '10151', name: 'Kehrschleifengleis-Set', detail: '2 × 150 mm · analog', kind: 'special', lengthMm: 300 },
  { id: 'isolation-double', article: '10152', name: 'Trenngleis, zweipolig', detail: '150 mm', kind: 'special', lengthMm: 150 },
  { id: 'isolation-single', article: '10153', name: 'Trenngleis, einpolig', detail: '150 mm', kind: 'special', lengthMm: 150 },
  { id: 'uncoupler-manual', article: '10520', name: 'Entkupplungsgleis manuell', detail: '150 mm', kind: 'special', lengthMm: 150 },
  { id: 'uncoupler', article: '10560', name: 'Entkupplungsgleis elektrisch', detail: '150 mm', kind: 'special', lengthMm: 150 },
  { id: 'flex', article: '10005', name: 'Flexgleis-Schiene', detail: '1.500 mm · individuell biegbar', kind: 'special', lengthMm: 1500 },
  { id: 'rack', article: '10210', name: 'Zahnstange', detail: '300 mm · Zahnradbahn', kind: 'special', lengthMm: 300 },
  { id: 'road-crossing', article: '10007', name: 'Straßenüberfahrt', detail: '300 mm', kind: 'special', lengthMm: 300 },
  { id: 'buffer', article: '10310', name: 'Prellbock beleuchtet', detail: 'Modern', kind: 'buffer', lengthMm: 300 },
  { id: 'buffer-standard', article: '10315', name: 'Prellbock', detail: 'Standard', kind: 'buffer', lengthMm: 300 },
  { id: 'buffer-rhb', article: '10316', name: 'Prellbock RhB', detail: 'Epoche VI', kind: 'buffer', lengthMm: 300 },
  { id: 'buffer-old', article: '10320', name: 'Prellbock Old Timer', detail: 'Gebogene Schienen', kind: 'buffer', lengthMm: 300 },
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

const UNITS_PER_METER = 150
const DEFAULT_CANVAS = { widthMeters: 8, heightMeters: 5 }
const MIN_CANVAS_METERS = 1
const MAX_CANVAS_METERS = 100
const MIN_ZOOM = 25
const MAX_ZOOM = 200
const ZOOM_STEP = 25
const MILLIMETERS_TO_UNITS = UNITS_PER_METER / 1000
const SNAP_DISTANCE = 15
const CONNECTION_TOLERANCE_UNITS = 1
const ROTATION_STEP = 7.5
const OVAL_CURVES_PER_END = 6
const PLACEMENT_GRID_STEPS = 5
const NO_CONNECTIONS = new Set<number>()

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))
const toUnits = (millimeters: number) => millimeters * MILLIMETERS_TO_UNITS
const toRadians = (degrees: number) => degrees * Math.PI / 180
const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360

const getTrackGeometry = (definition: TrackDefinition): TrackGeometry => {
  const length = toUnits(definition.lengthMm)
  const half = length / 2

  if (definition.kind === 'curve') {
    const radius = toUnits(definition.radiusMm ?? definition.lengthMm)
    const angle = definition.angleDeg ?? 0
    const halfAngle = toRadians(angle / 2)
    const x = radius * Math.sin(halfAngle)
    return {
      paths: [`M ${-x} 0 A ${radius} ${radius} 0 0 1 ${x} 0`],
      connections: [
        { x: -x, y: 0, angle: 180 - angle / 2 },
        { x, y: 0, angle: angle / 2 },
      ],
    }
  }

  if (definition.kind === 'switch-left' || definition.kind === 'switch-right' || definition.kind === 'switch-three') {
    const radius = toUnits(definition.radiusMm ?? definition.lengthMm)
    const angle = definition.angleDeg ?? 0
    const angleRadians = toRadians(angle)
    const branchX = -half + radius * Math.sin(angleRadians)
    const branchOffset = radius * (1 - Math.cos(angleRadians))
    const sides = definition.kind === 'switch-three' ? [-1, 1] : [definition.kind === 'switch-left' ? -1 : 1]
    const paths = [`M ${-half} 0 L ${half} 0`]
    const connections: TrackConnection[] = [{ x: -half, y: 0, angle: 180 }, { x: half, y: 0, angle: 0 }]
    sides.forEach((side) => {
      const branchY = side * branchOffset
      paths.push(`M ${-half} 0 A ${radius} ${radius} 0 0 ${side > 0 ? 1 : 0} ${branchX} ${branchY}`)
      connections.push({ x: branchX, y: branchY, angle: side * angle })
    })
    return { paths, connections }
  }

  if (definition.kind === 'crossing') {
    const halfAngle = toRadians((definition.angleDeg ?? 90) / 2)
    const x = half * Math.cos(halfAngle)
    const y = half * Math.sin(halfAngle)
    return {
      paths: [`M ${-x} ${-y} L ${x} ${y}`, `M ${-x} ${y} L ${x} ${-y}`],
      connections: [
        { x: -x, y: -y, angle: 180 + (definition.angleDeg ?? 90) / 2 },
        { x, y, angle: (definition.angleDeg ?? 90) / 2 },
        { x: -x, y, angle: 180 - (definition.angleDeg ?? 90) / 2 },
        { x, y: -y, angle: -(definition.angleDeg ?? 90) / 2 },
      ],
    }
  }

  return {
    paths: [`M ${-half} 0 L ${half} 0`],
    connections: definition.kind === 'buffer'
      ? [{ x: -half, y: 0, angle: 180 }]
      : [{ x: -half, y: 0, angle: 180 }, { x: half, y: 0, angle: 0 }],
  }
}

const rotatePoint = (point: TrackConnection, rotation: number) => {
  const radians = toRadians(rotation)
  return {
    x: point.x * Math.cos(radians) - point.y * Math.sin(radians),
    y: point.x * Math.sin(radians) + point.y * Math.cos(radians),
    angle: normalizeAngle(point.angle + rotation),
  }
}

const getWorldConnections = (track: PlacedTrack) => {
  const definition = TRACKS.find((item) => item.id === track.definitionId) ?? TRACKS[0]
  return getTrackGeometry(definition).connections.map((connection, index) => {
    const rotated = rotatePoint(connection, track.rotation)
    return { ...rotated, x: track.x + rotated.x, y: track.y + rotated.y, trackId: track.id, index }
  })
}

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

const getOpenConnections = (otherTracks: PlacedTrack[], excludedId?: string) => {
  const connections = otherTracks.filter((track) => track.id !== excludedId).flatMap(getWorldConnections)
  const buckets = new Map<string, typeof connections>()
  const coordinate = (value: number) => Math.floor(value / CONNECTION_TOLERANCE_UNITS)
  const key = (x: number, y: number) => `${x}:${y}`
  connections.forEach((connection) => {
    const bucketKey = key(coordinate(connection.x), coordinate(connection.y))
    const bucket = buckets.get(bucketKey) ?? []
    bucket.push(connection)
    buckets.set(bucketKey, bucket)
  })
  return connections.filter((connection) => {
    const x = coordinate(connection.x)
    const y = coordinate(connection.y)
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const nearby = buckets.get(key(x + offsetX, y + offsetY)) ?? []
        if (nearby.some((other) => other.trackId !== connection.trackId && distance(connection, other) < CONNECTION_TOLERANCE_UNITS)) return false
      }
    }
    return true
  })
}

const alignConnection = (track: PlacedTrack, source: TrackConnection, target: TrackConnection) => {
  const rotation = normalizeAngle(target.angle + 180 - source.angle)
  const rotated = rotatePoint(source, rotation)
  return { ...track, x: target.x - rotated.x, y: target.y - rotated.y, rotation }
}

const snapTrack = (track: PlacedTrack, otherTracks: PlacedTrack[]) => {
  const definition = TRACKS.find((item) => item.id === track.definitionId) ?? TRACKS[0]
  const geometry = getTrackGeometry(definition)
  const worldConnections = getWorldConnections(track)
  const targets = getOpenConnections(otherTracks, track.id)
  let best: { source: TrackConnection; target: TrackConnection; distance: number } | null = null

  for (const [index, world] of worldConnections.entries()) {
    for (const target of targets) {
      const gap = distance(world, target)
      if (gap <= SNAP_DISTANCE && (!best || gap < best.distance)) {
        best = { source: geometry.connections[index], target, distance: gap }
      }
    }
  }

  return best ? alignConnection(track, best.source, best.target) : track
}

const normalizeInventory = (value: unknown): TrackInventory => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).flatMap(([id, count]) => {
    const definitionExists = TRACKS.some((track) => track.id === id)
    const normalized = Number(count)
    return definitionExists && Number.isFinite(normalized)
      ? [[id, clamp(Math.floor(normalized), 0, 999)]]
      : []
  }))
}

const generateAutomaticLayout = (
  options: PlannerOptions,
  canvasSize: CanvasSize,
  terrain: TerrainPatch[],
  inventory: TrackInventory,
) => {
  const branchCount = options.sidings + options.stationTracks
  const straightSections = Math.max(options.straightSections, branchCount)
  const sequence: { definitionId: string; trackClass: TrackClass; branchClass?: TrackClass }[] = []

  for (let index = 0; index < straightSections; index += 1) {
    if (index < branchCount) {
      sequence.push({
        definitionId: 'wl-r1',
        trackClass: 'main',
        branchClass: index < options.stationTracks ? 'station' : 'siding',
      })
      sequence.push({ definitionId: 'g300', trackClass: 'main' })
    } else {
      sequence.push({ definitionId: 'g600', trackClass: 'main' })
    }
  }
  for (let index = 0; index < OVAL_CURVES_PER_END; index += 1) sequence.push({ definitionId: 'r1', trackClass: 'main' })
  for (let index = 0; index < straightSections; index += 1) sequence.push({ definitionId: 'g600', trackClass: 'main' })
  for (let index = 0; index < OVAL_CURVES_PER_END; index += 1) sequence.push({ definitionId: 'r1', trackClass: 'main' })

  const generated: PlacedTrack[] = []
  const switches: { track: PlacedTrack; trackClass: TrackClass }[] = []
  sequence.forEach((item, index) => {
    const definition = TRACKS.find((track) => track.id === item.definitionId) ?? TRACKS[0]
    let track: PlacedTrack = {
      id: uid(),
      definitionId: item.definitionId,
      x: 0,
      y: 0,
      rotation: 0,
      circuit: 'A',
      trackClass: item.trackClass,
    }
    if (index === 0) {
      track.x = toUnits(definition.lengthMm) / 2
    } else {
      const previous = generated[index - 1]
      const target = getWorldConnections(previous)[1]
      track = alignConnection(track, getTrackGeometry(definition).connections[0], target)
    }
    generated.push(track)
    if (item.branchClass) switches.push({ track, trackClass: item.branchClass })
  })

  switches.forEach(({ track: switchTrack, trackClass }) => {
    let target = getWorldConnections(switchTrack)[2]
    for (const definitionId of ['g600', 'buffer-standard']) {
      const definition = TRACKS.find((track) => track.id === definitionId) ?? TRACKS[0]
      const branchTrack = alignConnection({
        id: uid(),
        definitionId,
        x: 0,
        y: 0,
        rotation: 0,
        circuit: 'A',
        trackClass,
      }, getTrackGeometry(definition).connections[0], target)
      generated.push(branchTrack)
      target = getWorldConnections(branchTrack)[1] ?? target
    }
  })

  const required = generated.reduce<Record<string, number>>((counts, track) => {
    counts[track.definitionId] = (counts[track.definitionId] ?? 0) + 1
    return counts
  }, {})
  const shortages = Object.entries(required).flatMap(([id, count]) => {
    const available = inventory[id]
    if (available === undefined || available >= count) return []
    const definition = TRACKS.find((track) => track.id === id)
    return [`${definition?.article ?? id}: ${count - available} fehlen`]
  })
  if (shortages.length) return { success: false as const, message: `Bestand reicht nicht aus: ${shortages.join(', ')}` }

  const points = generated.flatMap((track) => [{ x: track.x, y: track.y }, ...getWorldConnections(track)])
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  const canvasWidth = canvasSize.widthMeters * UNITS_PER_METER
  const canvasHeight = canvasSize.heightMeters * UNITS_PER_METER
  const margin = 30
  const availableX = canvasWidth - (maxX - minX) - margin * 2
  const availableY = canvasHeight - (maxY - minY) - margin * 2
  if (availableX < 0 || availableY < 0) {
    return { success: false as const, message: 'Die gewünschte Anlage passt nicht auf die aktuelle Planfläche.' }
  }

  let best = { x: margin - minX + availableX / 2, y: margin - minY + availableY / 2, conflicts: Infinity }
  const placementDivisor = Math.max(PLACEMENT_GRID_STEPS - 1, 1)
  for (let column = 0; column < PLACEMENT_GRID_STEPS; column += 1) {
    for (let row = 0; row < PLACEMENT_GRID_STEPS; row += 1) {
      const x = margin - minX + availableX * column / placementDivisor
      const y = margin - minY + availableY * row / placementDivisor
      const conflicts = generated.reduce((sum, track) => sum + terrain.filter((patch) =>
        distance({ x: track.x + x, y: track.y + y }, patch) < (patch.kind === 'building' ? 100 : 80)).length, 0)
      if (conflicts < best.conflicts) best = { x, y, conflicts }
    }
  }

  return {
    success: true as const,
    tracks: generated.map((track) => ({ ...track, x: track.x + best.x, y: track.y + best.y })),
    message: best.conflicts > 0
      ? `Plan erstellt. ${best.conflicts} Geländekonflikte konnten nicht vermieden werden.`
      : `Plan mit ${generated.length} Gleisen erstellt.`,
  }
}

const getConnectedIndexes = (tracks: PlacedTrack[]) => {
  const result = new Map<string, Set<number>>()
  const buckets = new Map<string, ReturnType<typeof getWorldConnections>>()
  const connections = tracks.flatMap(getWorldConnections)
  const bucketCoordinate = (value: number) => Math.floor(value / CONNECTION_TOLERANCE_UNITS)
  const bucketKey = (x: number, y: number) => `${x}:${y}`

  connections.forEach((connection) => {
    result.set(connection.trackId, result.get(connection.trackId) ?? new Set())
    const x = bucketCoordinate(connection.x)
    const y = bucketCoordinate(connection.y)
    const key = bucketKey(x, y)
    const bucket = buckets.get(key) ?? []
    bucket.push(connection)
    buckets.set(key, bucket)
  })

  connections.forEach((connection) => {
    const x = bucketCoordinate(connection.x)
    const y = bucketCoordinate(connection.y)
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const nearby = buckets.get(bucketKey(x + offsetX, y + offsetY)) ?? []
        if (nearby.some((other) => other.trackId !== connection.trackId && distance(connection, other) < CONNECTION_TOLERANCE_UNITS)) {
          result.get(connection.trackId)?.add(connection.index)
        }
      }
    }
  })

  return result
}

const normalizeCanvasSize = (value: unknown): CanvasSize => {
  const size = value && typeof value === 'object' ? value as Partial<CanvasSize> : {}
  return {
    widthMeters: clamp(Number(size.widthMeters) || DEFAULT_CANVAS.widthMeters, MIN_CANVAS_METERS, MAX_CANVAS_METERS),
    heightMeters: clamp(Number(size.heightMeters) || DEFAULT_CANVAS.heightMeters, MIN_CANVAS_METERS, MAX_CANVAS_METERS),
  }
}

const toCanvasPoint = (svg: SVGSVGElement, clientX: number, clientY: number) => {
  const matrix = svg.getScreenCTM()
  if (!matrix) return null
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  return point.matrixTransform(matrix.inverse())
}

const loadCanvasSize = () => {
  try {
    return normalizeCanvasSize(JSON.parse(localStorage.getItem('lgb-canvas') || '{}'))
  } catch {
    return DEFAULT_CANVAS
  }
}

function TrackShape({ track, selected, preview = false, connected = NO_CONNECTIONS }: { track: PlacedTrack; selected: boolean; preview?: boolean; connected?: Set<number> }) {
  const definition = TRACKS.find((item) => item.id === track.definitionId) ?? TRACKS[0]
  const circuit = CIRCUITS.find((item) => item.id === track.circuit) ?? CIRCUITS[0]
  const rail = circuit.color
  const geometry = getTrackGeometry(definition)
  const extent = Math.max(toUnits(definition.lengthMm), toUnits(definition.radiusMm ?? 0) * (1 - Math.cos(toRadians(definition.angleDeg ?? 0))), 30)
  const previewScale = Math.min(1, 78 / extent)
  const transform = `translate(${track.x} ${track.y}) rotate(${track.rotation})${preview ? ` scale(${previewScale})` : ''}`

  return (
    <g transform={transform} className="track-shape">
      {selected && geometry.paths.map((path, index) => <path key={`selection-${index}`} d={path} className="selection-ring" />)}
      {geometry.paths.map((path, index) => (
        <g key={index}>
          <path d={path} className="track-sleepers" />
          <path d={path} className="track-rails" style={{ stroke: rail }} />
          <path d={path} className="track-gauge" />
        </g>
      ))}
      {definition.kind === 'special' && <rect x="-7" y="-10" width="14" height="20" rx="3" className="special-marker" />}
      {definition.kind === 'buffer' && <path d={`M ${toUnits(definition.lengthMm) / 2 - 3} -12 V 12`} className="buffer-stop" />}
      {!preview && geometry.connections.map((connection, index) => (
        <circle key={index} cx={connection.x} cy={connection.y} r={connected.has(index) ? 4 : 3} className={`track-connection ${connected.has(index) ? 'connected' : ''} ${selected ? 'visible' : ''}`} />
      ))}
      <g className="track-badge" transform={`translate(0 20) rotate(${-track.rotation})`}>
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
  const [activeTrack, setActiveTrack] = useState<string | null>(null)
  const [terrainBrush, setTerrainBrush] = useState<TerrainKind | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeCircuit, setActiveCircuit] = useState('A')
  const [trackClass, setTrackClass] = useState<TrackClass>('main')
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'track' | 'switch' | 'special'>('all')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [inventory, setInventory] = useState<TrackInventory>(() => {
    try { return normalizeInventory(JSON.parse(localStorage.getItem('lgb-inventory') || '{}')) } catch { return {} }
  })
  const [plannerOpen, setPlannerOpen] = useState(false)
  const [plannerOptions, setPlannerOptions] = useState<PlannerOptions>({ straightSections: 3, sidings: 1, stationTracks: 1 })
  const [plannerMessage, setPlannerMessage] = useState('')
  const [plannerNotice, setPlannerNotice] = useState('')
  const [plannerReplaceConfirmed, setPlannerReplaceConfirmed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [projectName, setProjectName] = useState('Meine Gartenbahn')
  const [canvasSize, setCanvasSize] = useState(loadCanvasSize)
  const [canvasInputs, setCanvasInputs] = useState(() => ({
    widthMeters: String(canvasSize.widthMeters),
    heightMeters: String(canvasSize.heightMeters),
  }))
  const [zoom, setZoom] = useState(100)
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const touchPointersRef = useRef(new Map<number, { x: number; y: number; startX: number; startY: number; moved: boolean; startedOnTrack: boolean }>())
  const pinchRef = useRef<{ distance: number; zoom: number; scrollLeft: number; scrollTop: number; focalX: number; focalY: number } | null>(null)
  const hadPinchRef = useRef(false)
  const zoomFrameRef = useRef<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const plannerButtonRef = useRef<HTMLButtonElement>(null)
  const plannerModalRef = useRef<HTMLElement>(null)
  const canvasWidth = canvasSize.widthMeters * UNITS_PER_METER
  const canvasHeight = canvasSize.heightMeters * UNITS_PER_METER
  const roomWidth = Math.max(0, canvasWidth - 90)
  const roomHeight = Math.max(0, canvasHeight - 90)
  const roomDoorWidth = Math.min(135, roomWidth * .25)
  const roomDoorDepth = Math.min(100, roomHeight * .25)
  const connectedIndexes = useMemo(() => getConnectedIndexes(tracks), [tracks])
  const usedInventory = useMemo(() => tracks.reduce<Record<string, number>>((counts, track) => {
    counts[track.definitionId] = (counts[track.definitionId] ?? 0) + 1
    return counts
  }, {}), [tracks])
  const inventoryShortages = useMemo(() => TRACKS.filter((track) =>
    track.id in inventory && (usedInventory[track.id] ?? 0) > inventory[track.id]), [inventory, usedInventory])

  useEffect(() => {
    localStorage.setItem('lgb-tracks', JSON.stringify(tracks))
    localStorage.setItem('lgb-terrain', JSON.stringify(terrain))
  }, [tracks, terrain])

  useEffect(() => {
    localStorage.setItem('lgb-inventory', JSON.stringify(inventory))
  }, [inventory])

  useEffect(() => {
    localStorage.setItem('lgb-canvas', JSON.stringify(canvasSize))
  }, [canvasSize])

  useEffect(() => {
    if (!plannerNotice) return
    const timeout = window.setTimeout(() => setPlannerNotice(''), 5000)
    return () => window.clearTimeout(timeout)
  }, [plannerNotice])

  useEffect(() => {
    if (plannerOpen) plannerModalRef.current?.focus()
  }, [plannerOpen])

  const canvasPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    return toCanvasPoint(event.currentTarget, event.clientX, event.clientY)
  }

  const applyCanvasTool = (svg: SVGSVGElement, target: EventTarget, clientX: number, clientY: number) => {
    if ((target as Element).closest('[data-track]')) return
    const point = toCanvasPoint(svg, clientX, clientY)
    if (!point) return
    setSelectedId(null)
    if (terrainBrush) {
      setTerrain((items) => [...items, { id: uid(), x: point.x, y: point.y, kind: terrainBrush }])
    } else if (activeTrack) {
      const definition = TRACKS.find((track) => track.id === activeTrack) ?? TRACKS[0]
      let item: PlacedTrack = { id: uid(), definitionId: activeTrack, x: point.x, y: point.y, rotation: 0, circuit: activeCircuit, trackClass }
      const target = getOpenConnections(tracks)
        .map((connection) => ({ connection, gap: distance(point, connection) }))
        .filter(({ gap }) => gap <= SNAP_DISTANCE)
        .sort((a, b) => a.gap - b.gap)[0]?.connection
      if (target) {
        const source = getTrackGeometry(definition).connections
          .map((connection) => {
            const rotated = rotatePoint(connection, item.rotation)
            return { connection, gap: distance({ x: item.x + rotated.x, y: item.y + rotated.y }, target) }
          })
          .sort((a, b) => a.gap - b.gap)[0].connection
        item = alignConnection(item, source, target)
      }
      setTracks((items) => [...items, item])
      setSelectedId(item.id)
      setActiveTrack(null)
    }
  }

  const handleCanvasDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch') return
    applyCanvasTool(event.currentTarget, event.target, event.clientX, event.clientY)
  }

  const handleTouchDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== 'touch') return
    const pointers = touchPointersRef.current
    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      startedOnTrack: Boolean((event.target as Element).closest('[data-track]')),
    })
    if (pointers.size !== 2) return

    const [first, second] = [...pointers.values()]
    const wrap = canvasWrapRef.current
    if (!wrap) return
    const bounds = wrap.getBoundingClientRect()
    const midpointX = (first.x + second.x) / 2 - bounds.left
    const midpointY = (first.y + second.y) / 2 - bounds.top
    pinchRef.current = {
      distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
      zoom,
      scrollLeft: wrap.scrollLeft,
      scrollTop: wrap.scrollTop,
      focalX: midpointX,
      focalY: midpointY,
    }
    hadPinchRef.current = true
    dragRef.current = null
  }

  const handleTouchMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== 'touch') return
    const pointer = touchPointersRef.current.get(event.pointerId)
    if (!pointer) return
    pointer.x = event.clientX
    pointer.y = event.clientY
    pointer.moved ||= Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) > 6

    const pinch = pinchRef.current
    if (!pinch || touchPointersRef.current.size < 2) return
    const [first, second] = [...touchPointersRef.current.values()]
    const distance = Math.hypot(second.x - first.x, second.y - first.y)
    const nextZoom = clamp(Math.round(pinch.zoom * distance / pinch.distance), MIN_ZOOM, MAX_ZOOM)
    setZoom(nextZoom)
    if (zoomFrameRef.current !== null) cancelAnimationFrame(zoomFrameRef.current)
    zoomFrameRef.current = requestAnimationFrame(() => {
      zoomFrameRef.current = null
      const wrap = canvasWrapRef.current
      if (!wrap) return
      const bounds = wrap.getBoundingClientRect()
      const midpointX = (first.x + second.x) / 2 - bounds.left
      const midpointY = (first.y + second.y) / 2 - bounds.top
      const ratio = nextZoom / pinch.zoom
      wrap.scrollLeft = (pinch.scrollLeft + pinch.focalX) * ratio - midpointX
      wrap.scrollTop = (pinch.scrollTop + pinch.focalY) * ratio - midpointY
    })
  }

  const handleTouchEnd = (event: React.PointerEvent<SVGSVGElement>, cancelled = false) => {
    if (event.pointerType !== 'touch') return
    const pointers = touchPointersRef.current
    const pointer = pointers.get(event.pointerId)
    pointers.delete(event.pointerId)
    if (!cancelled && pointers.size === 0 && !hadPinchRef.current && pointer && !pointer.moved && !pointer.startedOnTrack) {
      applyCanvasTool(event.currentTarget, event.target, event.clientX, event.clientY)
    }
    if (pointers.size < 2) pinchRef.current = null
    if (pointers.size === 0) hadPinchRef.current = false
  }

  const startDrag = (event: React.PointerEvent<SVGGElement>, track: PlacedTrack) => {
    event.stopPropagation()
    if (event.pointerType === 'touch' && touchPointersRef.current.size > 1) return
    const svg = event.currentTarget.ownerSVGElement
    if (!svg) return
    const point = toCanvasPoint(svg, event.clientX, event.clientY)
    if (!point) return
    dragRef.current = { id: track.id, dx: point.x - track.x, dy: point.y - track.y }
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelectedId(track.id)
  }

  const moveDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return
    const point = canvasPoint(event)
    if (!point) return
    const { id, dx, dy } = dragRef.current
    setTracks((items) => items.map((item) => item.id === id
      ? snapTrack({ ...item, x: point.x - dx, y: point.y - dy }, items)
      : item))
  }

  const updateSelected = (change: Partial<PlacedTrack>) => {
    setTracks((items) => items.map((item) => item.id === selectedId ? { ...item, ...change } : item))
  }

  const commitCanvasDimension = (dimension: keyof CanvasSize) => {
    const value = clamp(Number(canvasInputs[dimension]) || canvasSize[dimension], MIN_CANVAS_METERS, MAX_CANVAS_METERS)
    setCanvasSize((size) => ({ ...size, [dimension]: value }))
    setCanvasInputs((inputs) => ({ ...inputs, [dimension]: String(value) }))
  }

  const selected = tracks.find((item) => item.id === selectedId)
  const selectedCanvasX = selected ? selected.x * zoom / 100 : 0
  const selectionPanelMargin = Math.min(250, canvasWidth * zoom / 200)
  const selectionPanelLeft = clamp(selectedCanvasX, selectionPanelMargin, canvasWidth * zoom / 100 - selectionPanelMargin)
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

  const createAutomaticPlan = () => {
    if (tracks.length > 0 && !plannerReplaceConfirmed) {
      setPlannerMessage('Der automatische Plan ersetzt die aktuell verlegten Gleise. Zum Bestätigen erneut „Plan erstellen“ wählen.')
      setPlannerReplaceConfirmed(true)
      return
    }
    const result = generateAutomaticLayout(plannerOptions, canvasSize, terrain, inventory)
    if (!result.success) {
      setPlannerMessage(result.message)
      return
    }
    setTracks(result.tracks)
    setSelectedId(null)
    setPlannerNotice(result.message)
    setPlannerMessage('')
    closePlanner()
  }

  const closePlanner = () => {
    setPlannerOpen(false)
    setPlannerReplaceConfirmed(false)
    requestAnimationFrame(() => plannerButtonRef.current?.focus())
  }

  const updatePlannerOptions = (change: Partial<PlannerOptions>) => {
    setPlannerOptions((options) => ({ ...options, ...change }))
    setPlannerReplaceConfirmed(false)
    setPlannerMessage('')
  }

  const handlePlannerKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      closePlanner()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = [...(plannerModalRef.current?.querySelectorAll<HTMLElement>('button, input, select, [tabindex]:not([tabindex="-1"])') ?? [])]
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ version: 3, projectName, environment, canvas: canvasSize, tracks, terrain, inventory }, null, 2)], { type: 'application/json' })
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
        if (data.version !== undefined && ![1, 2, 3].includes(data.version)) throw new Error()
        setTracks(data.tracks)
        setTerrain(data.terrain)
        setProjectName(data.projectName || 'Importierter Plan')
        setEnvironment(data.environment === 'indoor' ? 'indoor' : 'outdoor')
        if (data.inventory !== undefined) setInventory(normalizeInventory(data.inventory))
        const importedCanvasSize = normalizeCanvasSize(data.canvas)
        setCanvasSize(importedCanvasSize)
        setCanvasInputs({
          widthMeters: String(importedCanvasSize.widthMeters),
          heightMeters: String(importedCanvasSize.heightMeters),
        })
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
            <div><span className="eyebrow">Bauteile</span><h2>{inventoryOpen ? 'Gleisbestand' : 'Gleiskatalog'}</h2></div>
            <button className="inventory-toggle" onClick={() => setInventoryOpen((open) => !open)}>
              {inventoryOpen ? 'Katalog' : 'Bestand'}
            </button>
            <button className="close-catalog" onClick={() => setSidebarOpen(false)} aria-label="Katalog schließen">×</button>
          </div>
          {inventoryOpen ? (
            <>
              <div className={`inventory-summary ${inventoryShortages.length ? 'warning' : ''}`}>
                <strong>{inventoryShortages.length ? `${inventoryShortages.length} Artikel fehlen` : 'Plan ist baubar'}</strong>
                <span>Nicht erfasste Artikel gelten als unbegrenzt verfügbar.</span>
              </div>
              <div className="inventory-list">
                {TRACKS.map((item) => {
                  const used = usedInventory[item.id] ?? 0
                  const available = inventory[item.id]
                  const missing = available === undefined ? 0 : Math.max(0, used - available)
                  return (
                    <label key={item.id} className={missing ? 'inventory-row missing' : 'inventory-row'}>
                      <span><strong>{item.article}</strong><small>{item.name}</small></span>
                      <span className="inventory-used">{used} verbaut</span>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        placeholder="∞"
                        value={available ?? ''}
                        aria-label={`Verfügbarer Bestand ${item.article}`}
                        onChange={(event) => {
                          const value = event.target.value
                          setInventory((current) => {
                            if (value === '') {
                              const next = { ...current }
                              delete next[item.id]
                              return next
                            }
                            return { ...current, [item.id]: clamp(Math.floor(Number(value) || 0), 0, 999) }
                          })
                        }}
                      />
                      {missing > 0 && <em>{missing} fehlen</em>}
                    </label>
                  )
                })}
              </div>
            </>
          ) : (
            <>
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
                {filteredTracks.map((item) => {
                  const used = usedInventory[item.id] ?? 0
                  const available = inventory[item.id]
                  return (
                    <button key={item.id} className={`catalog-card ${activeTrack === item.id && !terrainBrush ? 'active' : ''}`} onClick={() => { setActiveTrack(item.id); setTerrainBrush(null); if (window.innerWidth <= 900) setSidebarOpen(false) }}>
                      <span className={`track-preview ${item.kind}`} aria-hidden="true">
                        <svg viewBox="0 0 100 56"><TrackShape track={{ id: '', definitionId: item.id, x: 50, y: 28, rotation: 0, circuit: 'A', trackClass: 'main' }} selected={false} preview /></svg>
                      </span>
                      <span><strong>{item.name}</strong><small>{item.article} · {item.detail}</small><small>{used} verbaut · {available === undefined ? 'Bestand ∞' : `${available} verfügbar`}</small></span>
                      <span className="add-symbol">＋</span>
                    </button>
                  )
                })}
              </div>
              <div className="catalog-hint"><strong>Magnetische Verbindungen</strong><p>Nahe an einem freien Gleisende platzieren oder ziehen – das neue Gleis richtet sich automatisch exakt aus.</p></div>
            </>
          )}
        </aside>

        <section className="workspace">
          <div className="workspace-toolbar">
            <button className="mobile-catalog" onClick={() => setSidebarOpen(true)}>☰ <span>Gleise</span></button>
            <button ref={plannerButtonRef} className="planner-button" onClick={() => { setPlannerMessage(''); setPlannerReplaceConfirmed(false); setPlannerOpen(true) }}>✦ Auto-Plan</button>
            <div className="mode-switch">
              <button className={environment === 'outdoor' ? 'active' : ''} onClick={() => setEnvironment('outdoor')}>☀ Outdoor</button>
              <button className={environment === 'indoor' ? 'active' : ''} onClick={() => setEnvironment('indoor')}>⌂ Indoor</button>
            </div>
            <div className="toolbar-divider" />
            <label className="track-setting">Stromkreis
              <select value={activeCircuit} onChange={(event) => setActiveCircuit(event.target.value)}>
                {CIRCUITS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="track-setting">Gleistyp
              <select value={trackClass} onChange={(event) => setTrackClass(event.target.value as TrackClass)}>
                <option value="main">Hauptstrecke</option><option value="siding">Abstellgleis</option><option value="station">Bahnhofsgleis</option>
              </select>
            </label>
            <div className="toolbar-divider" />
            <label className="dimension-control">Breite
              <span><input type="number" min={MIN_CANVAS_METERS} max={MAX_CANVAS_METERS} step="0.1" value={canvasInputs.widthMeters} onChange={(event) => setCanvasInputs((inputs) => ({ ...inputs, widthMeters: event.target.value }))} onBlur={() => commitCanvasDimension('widthMeters')} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} aria-label="Planbreite in Metern" /> m</span>
            </label>
            <label className="dimension-control">Höhe
              <span><input type="number" min={MIN_CANVAS_METERS} max={MAX_CANVAS_METERS} step="0.1" value={canvasInputs.heightMeters} onChange={(event) => setCanvasInputs((inputs) => ({ ...inputs, heightMeters: event.target.value }))} onBlur={() => commitCanvasDimension('heightMeters')} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} aria-label="Planhöhe in Metern" /> m</span>
            </label>
            <div className="zoom-control" aria-label="Zoom">
              <button type="button" onClick={() => setZoom((value) => clamp(value - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))} disabled={zoom === MIN_ZOOM} aria-label="Verkleinern">−</button>
              <button type="button" className="zoom-value" onClick={() => setZoom(100)} title="Auf 100 % zurücksetzen">{zoom}%</button>
              <button type="button" onClick={() => setZoom((value) => clamp(value + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))} disabled={zoom === MAX_ZOOM} aria-label="Vergrößern">＋</button>
            </div>
          </div>

          <div className="canvas-wrap" ref={canvasWrapRef}>
            <svg
              className={`layout-canvas ${environment}`}
              viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
              width={canvasWidth * zoom / 100}
              height={canvasHeight * zoom / 100}
              preserveAspectRatio="xMinYMin meet"
              onPointerDownCapture={handleTouchDown}
              onPointerMoveCapture={handleTouchMove}
              onPointerUpCapture={handleTouchEnd}
              onPointerCancelCapture={(event) => handleTouchEnd(event, true)}
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
              <rect width={canvasWidth} height={canvasHeight} className="canvas-ground" />
              {environment === 'indoor' && (
                <g className="room-outline">
                  <rect x="45" y="45" width={roomWidth} height={roomHeight} rx="6" />
                  <path d={`M ${45 + roomDoorWidth} 45 v${roomDoorDepth} h${-roomDoorWidth} M ${canvasWidth - 45 - roomDoorWidth} ${canvasHeight - 45} v${-roomDoorDepth} h${roomDoorWidth}`} />
                </g>
              )}
              {terrain.map((patch) => (
                <g key={patch.id} transform={`translate(${patch.x} ${patch.y})`} className={`terrain-patch ${patch.kind}`} onDoubleClick={() => setTerrain((items) => items.filter((item) => item.id !== patch.id))}>
                  {patch.kind === 'building' ? <rect x="-55" y="-42" width="110" height="84" rx="7" /> : <ellipse rx={patch.kind === 'water' ? 80 : 62} ry={patch.kind === 'water' ? 40 : 52} />}
                  <text textAnchor="middle" dominantBaseline="central">{TERRAIN.find((item) => item.id === patch.kind)?.icon}</text>
                </g>
              ))}
              <rect width={canvasWidth} height={canvasHeight} fill="url(#largeGrid)" className="grid" />
              {tracks.map((track) => (
                <g key={track.id} data-track="" onPointerDown={(event) => startDrag(event, track)} className={`placed-track ${track.trackClass}`}>
                  <TrackShape track={track} selected={selectedId === track.id} connected={connectedIndexes.get(track.id) ?? NO_CONNECTIONS} />
                </g>
              ))}
              {tracks.length === 0 && terrain.length === 0 && (
                <g className="empty-state" transform={`translate(${canvasWidth / 2} ${canvasHeight / 2 - 35})`}>
                  <circle r="54" /><text y="8">⌁</text>
                  <text className="empty-title" y="92">Deine Anlage beginnt hier</text>
                  <text className="empty-copy" y="124">Wähle links ein Gleis oder unten ein Geländewerkzeug.</text>
                </g>
              )}
            </svg>
            <div className="scale"><span style={{ width: `${UNITS_PER_METER * zoom / 100}px` }} /> 1 m</div>
            <div className="status-pill">{plannerNotice || `${tracks.length} Gleise · ${terrain.length} Geländeelemente`}</div>
            {selected && (
              <div
                className={`selection-panel ${selected.y * zoom / 100 < 90 ? 'below' : ''}`}
                data-track={selected.id}
                style={{
                  left: `${selectionPanelLeft}px`,
                  top: `${selected.y * zoom / 100}px`,
                  '--menu-pointer-offset': `${selectedCanvasX - selectionPanelLeft}px`,
                } as CSSProperties}
              >
                <div><small>Auswahl</small><strong>{TRACKS.find((item) => item.id === selected.definitionId)?.name}</strong></div>
                <button aria-label="Gleis nach links drehen" onClick={() => updateSelected({ rotation: normalizeAngle(selected.rotation - ROTATION_STEP) })}>↶ <span>Links drehen</span></button>
                <button aria-label="Gleis nach rechts drehen" onClick={() => updateSelected({ rotation: normalizeAngle(selected.rotation + ROTATION_STEP) })}>↷ <span>Rechts drehen</span></button>
                <label><span>Stromkreis</span><select value={selected.circuit} onChange={(event) => updateSelected({ circuit: event.target.value })}>{CIRCUITS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label><span>Kennzeichnung</span><select value={selected.trackClass} onChange={(event) => updateSelected({ trackClass: event.target.value as TrackClass })}><option value="main">Hauptstrecke</option><option value="siding">Abstellgleis</option><option value="station">Bahnhofsgleis</option></select></label>
                <button className="delete-button" aria-label="Gleis löschen" onClick={() => { setTracks((items) => items.filter((item) => item.id !== selected.id)); setSelectedId(null) }}>⌫ <span>Löschen</span></button>
              </div>
            )}
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

        </section>
      </main>
      {plannerOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closePlanner}>
          <section ref={plannerModalRef} className="planner-modal" role="dialog" aria-modal="true" aria-labelledby="planner-title" tabIndex={-1} onClick={(event) => event.stopPropagation()} onKeyDown={handlePlannerKeyDown}>
            <span className="eyebrow">Automatischer Planungsmodus</span>
            <h2 id="planner-title">Anlage entwerfen</h2>
            <p>Erstellt eine geschlossene Hauptstrecke, berücksichtigt die Planfläche und sucht eine Position mit möglichst wenigen Geländekonflikten.</p>
            <label>Geraden je Längsseite
              <input type="number" min="1" max="8" value={plannerOptions.straightSections} onChange={(event) => updatePlannerOptions({ straightSections: clamp(Number(event.target.value) || 1, 1, 8) })} />
            </label>
            <label>Bahnhofsgleise
              <input type="number" min="0" max="4" value={plannerOptions.stationTracks} onChange={(event) => updatePlannerOptions({ stationTracks: clamp(Number(event.target.value) || 0, 0, 4) })} />
            </label>
            <label>Abstellgleise
              <input type="number" min="0" max="4" value={plannerOptions.sidings} onChange={(event) => updatePlannerOptions({ sidings: clamp(Number(event.target.value) || 0, 0, 4) })} />
            </label>
            {plannerMessage && <div className="planner-message" role="alert">{plannerMessage}</div>}
            <div className="modal-actions">
              <button onClick={closePlanner}>Abbrechen</button>
              <button className="primary" onClick={createAutomaticPlan}>Plan erstellen</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
