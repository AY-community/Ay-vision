'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import styles from './HelixGallery.module.css'
import { PROJECTS } from '@/lib/projects'
import type { Project } from '@/lib/projects'

const RADIUS = 2.0
const ANGLE_STEP = 0.85
const HEIGHT_STEP = 0.5
const CARD_COUNT = 18
const THETA0 = 6.8
const Y0 = -4.0
const CARD_SCALE_X = 1.7
const CARD_SCALE_Y = 1.0
const FOV = 35
const TEXTURE_W = 512
const TEXTURE_H = 282

const AUTO_SPEED = 0.0015
const COAST_DECAY = 0.92
const COAST_MULT = 0.4
const STAGGER_DELAY = 100
const REVEAL_DURATION = 700
const GLOW_SIZE = 2.0

const vertexShader = `
varying vec2 vUv;
#define PI 3.14159265359

uniform float uScrollSpeed;

void main() {
  vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 newPosition = position;
  newPosition.z = sin(uv.x * PI) * 0.2;

  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  viewPosition.x += (worldPosition.y * worldPosition.y) * 0.1;
  viewPosition.x += sin(uv.y * PI) * uScrollSpeed * 2.0;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  vUv = uv;
}
`

const fragmentShader = `
uniform sampler2D uTexture;
uniform float uColorStrength;
uniform float uZoom;
uniform vec2 uPlaneSizes;
uniform vec2 uImageSizes;
uniform float uRevealProgress;

varying vec2 vUv;

float roundedRectSDF(vec2 uv, vec2 size, float radius) {
  vec2 d = abs(uv - 0.5) - size * 0.5 + radius;
  return length(max(d, 0.0)) - radius;
}

void main() {
  vec2 ratio = vec2(
    min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
    min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
  );

  vec2 uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );

  vec2 zoomedUv = (uv - 0.5) / uZoom + 0.5;

  vec4 color;

  if (gl_FrontFacing) {
    color = texture2D(uTexture, zoomedUv);
    color = mix(color, vec4(0.0, 0.0, 0.0, 1.0), uColorStrength);
  } else {
    float offset = 40.0 / 1024.0;
    vec4 c = vec4(0.0);
    c += texture2D(uTexture, uv + vec2(-offset, -offset)) * 1.0;
    c += texture2D(uTexture, uv + vec2( 0.0,    -offset)) * 2.0;
    c += texture2D(uTexture, uv + vec2( offset, -offset)) * 1.0;
    c += texture2D(uTexture, uv + vec2(-offset,  0.0))   * 2.0;
    c += texture2D(uTexture, uv)                         * 4.0;
    c += texture2D(uTexture, uv + vec2( offset,  0.0))   * 2.0;
    c += texture2D(uTexture, uv + vec2(-offset,  offset)) * 1.0;
    c += texture2D(uTexture, uv + vec2( 0.0,     offset)) * 2.0;
    c += texture2D(uTexture, uv + vec2( offset,  offset)) * 1.0;
    c /= 16.0;
    color = c;
  }

  float reveal = clamp(uRevealProgress, 0.0, 1.0);
  vec2 revealSize = vec2(reveal);
  float baseRadius = 0.05;
  float radius = baseRadius * reveal;
  float sdf = roundedRectSDF(vUv, revealSize, radius);
  float edge = 0.002;
  float alpha = 1.0 - smoothstep(0.0, edge, sdf);
  alpha *= smoothstep(0.1, 1.0, uRevealProgress);

  gl_FragColor = vec4(color.rgb, alpha);
}
`

function makeProjectTexture(project: Project): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = TEXTURE_W
  c.height = TEXTURE_H
  const ctx = c.getContext('2d')!
  const color = new THREE.Color(project.color)
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  const hue = hsl.h * 360

  const drawFallback = () => {
    const grad = ctx.createLinearGradient(0, 0, TEXTURE_W, TEXTURE_H)
    grad.addColorStop(0, `hsl(${hue}, 65%, 50%)`)
    grad.addColorStop(1, `hsl(${(hue + 50) % 360}, 65%, 30%)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, TEXTURE_W, TEXTURE_H)

    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    for (let i = 0; i < 40; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * TEXTURE_W, Math.random() * TEXTURE_H, Math.random() * 40 + 5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(project.name, TEXTURE_W / 2, TEXTURE_H * 0.38)

    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '15px sans-serif'
    ctx.fillText(project.tagline, TEXTURE_W / 2, TEXTURE_H * 0.62)

    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '10px sans-serif'
    ctx.fillText(project.category.toUpperCase(), TEXTURE_W / 2, TEXTURE_H * 0.78)
  }

  const texture = new THREE.CanvasTexture(c)

  if (!project.image) {
    drawFallback()
    return texture
  }

  const image = new Image()
  image.onload = () => {
    // Each supplied card stays artwork-only: draw it edge-to-edge without title overlays.
    const scale = Math.max(TEXTURE_W / image.width, TEXTURE_H / image.height)
    const width = image.width * scale
    const height = image.height * scale
    ctx.clearRect(0, 0, TEXTURE_W, TEXTURE_H)
    ctx.drawImage(image, (TEXTURE_W - width) / 2, (TEXTURE_H - height) / 2, width, height)
    texture.needsUpdate = true
  }
  image.src = project.image

  return texture
}

function makeGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')!
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(180, 200, 255, 0.70)')
  grad.addColorStop(0.15, 'rgba(130, 165, 255, 0.35)')
  grad.addColorStop(0.4, 'rgba(70, 110, 255, 0.08)')
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

export default function HelixGallery({ onReady, hoveredIndex }: { onReady?: () => void, hoveredIndex?: number | null }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredName, setHoveredName] = useState<string | null>(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })
  const [labelVisible, setLabelVisible] = useState(false)

  const onReadyRef = useRef(onReady)
  useEffect(() => { onReadyRef.current = onReady })

  // Use a ref to communicate the desired target offset to the animation loop
  const targetOffsetRef = useRef<number | null>(null)

  useEffect(() => {
    if (hoveredIndex !== undefined && hoveredIndex !== null) {
      // The front-facing hero position is layout index 8: it sits in the
      // visual centre of the helix and its rotation is almost square to camera.
      // Index 0 is also front-facing, but sits too low, so it never reads as
      // the selected/main card.
      // Since layout does: i = ((baseIndex + offset - (-3)) % CARD_COUNT + CARD_COUNT) % CARD_COUNT + (-3)
      // and baseIndex runs from -3 to CARD_COUNT-4.
      // Card project index is (i + 3). We want cardProjects[hoveredIndex] at i=8.
      // The base mesh that holds cardProjects[hoveredIndex] originally has baseIndex = hoveredIndex - 3.
      // So offset = 8 - baseIndex = 8 - (hoveredIndex - 3) = 11 - hoveredIndex.
      targetOffsetRef.current = 11 - hoveredIndex
    } else {
      targetOffsetRef.current = null
    }
  }, [hoveredIndex])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    // Clear any stale canvases left over from React StrictMode double-mount
    while (container.firstChild) container.removeChild(container.firstChild)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(FOV, w / h, 0.1, 100)
    camera.position.set(0, 0, 8)

    // Dynamically adjust FOV to maintain horizontal boundaries on narrow/tall screens.
    // We calculate a "virtual" aspect ratio based on the old 55% width so the 
    // object stays the exact same size, but benefits from the new wider 75% canvas bounds.
    const adjustCameraFOV = (width: number, height: number) => {
      const virtualWidth = width * (55 / 75)
      const aspect = virtualWidth / height
      const THRESHOLD = 0.9 // Point at which we start stabilizing horizontal width
      let newFov = FOV

      if (window.innerWidth <= 1000) {
        camera.position.y = 0
        camera.position.z = 12
        newFov = 42
      } else {
        camera.position.y = 0
        camera.position.z = 8
      }

      if (aspect < THRESHOLD) {
        const baseTan = Math.tan((newFov * Math.PI / 180) / 2)
        const adjustedTan = baseTan * (THRESHOLD / aspect)
        newFov = 2 * Math.atan(adjustedTan) * (180 / Math.PI)
      }
      
      camera.fov = newFov
      camera.updateProjectionMatrix()
    }
    adjustCameraFOV(w, h)

    const cardProjects: Project[] = []
    for (let i = 0; i < CARD_COUNT; i++) {
      cardProjects.push(PROJECTS[i % PROJECTS.length])
    }

    const group = new THREE.Group()
    scene.add(group)

    const cards: THREE.Mesh[] = []

    for (let i = -3; i < CARD_COUNT - 3; i++) {
      const geo = new THREE.PlaneGeometry(1, 1, 8, 8)

      const project = cardProjects[i + 3]
      const tex = makeProjectTexture(project)

      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: {
          uTexture: { value: tex },
          uColorStrength: { value: 0 },
          uZoom: { value: 1 },
          uPlaneSizes: { value: new THREE.Vector2(CARD_SCALE_X, CARD_SCALE_Y) },
          uImageSizes: { value: new THREE.Vector2(TEXTURE_W, TEXTURE_H) },
          uRevealProgress: { value: 0 },
          uScrollSpeed: { value: 0 },
        },
      })

      const mesh = new THREE.Mesh(geo, mat)
      mesh.scale.set(CARD_SCALE_X, CARD_SCALE_Y, 1)
      mesh.userData.baseIndex = i
      group.add(mesh)
      cards.push(mesh)
    }

    const glowTex = makeGlowTexture()
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      opacity: 0.55,
    })
    const glow = new THREE.Sprite(glowMat)
    glow.scale.set(GLOW_SIZE, GLOW_SIZE, 1)
    glow.visible = false
    scene.add(glow)

    const cursorWorldPos = new THREE.Vector3()
    const invisiblePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    let glowRevealed = false

    function updateLayout(offset: number) {
      cards.forEach((mesh) => {
        let i = mesh.userData.baseIndex + offset
        i = ((i - (-3)) % CARD_COUNT + CARD_COUNT) % CARD_COUNT + (-3)
        const theta = THETA0 - i * ANGLE_STEP
        mesh.position.x = RADIUS * Math.sin(theta)
        mesh.position.z = RADIUS * Math.cos(theta)
        mesh.position.y = Y0 + i * HEIGHT_STEP
        mesh.rotation.y = theta
      })
    }
    updateLayout(0)

    let isDragging = false
    let prevX = 0
    let prevY = 0
    let offset = 0
    let velocity = 0

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true
      prevX = e.clientX
      prevY = e.clientY
      renderer.domElement.style.cursor = 'grabbing'
    }
    const onPointerUp = () => {
      isDragging = false
      renderer.domElement.style.cursor = 'grab'
    }

    const raycaster = new THREE.Raycaster()
    const mouseNDC = new THREE.Vector2()

    function updateCursorFromPointer(clientX: number, clientY: number) {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const inBounds =
        clientX >= rect.left && clientX <= rect.right &&
        clientY >= rect.top && clientY <= rect.bottom
      if (!inBounds) {
        glow.visible = false
        return
      }
      if (!glowRevealed) {
        glowRevealed = true
        glow.visible = true
      }
      mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1
      mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouseNDC, camera)
      const hits = raycaster.intersectObjects(cards)

      if (hits.length > 0) {
        cursorWorldPos.copy(hits[0].point)
        const m = hits[0].object as THREE.Mesh
        const idx = cards.indexOf(m)
        if (idx >= 0) {
          setHoveredName(cardProjects[idx % cardProjects.length].name)
        }
        setHoverPos({ x: clientX, y: clientY })
        setLabelVisible(true)
      } else {
        const planePoint = new THREE.Vector3()
        raycaster.ray.intersectPlane(invisiblePlane, planePoint)
        if (planePoint) cursorWorldPos.copy(planePoint)
        setLabelVisible(false)
      }
      glow.position.copy(cursorWorldPos)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging && container.contains(renderer.domElement)) {
        const dx = e.clientX - prevX
        const dy = e.clientY - prevY
        const delta = (dx + dy) * 0.01
        offset += delta
        velocity = delta
        prevX = e.clientX
        prevY = e.clientY
      }
      updateCursorFromPointer(e.clientX, e.clientY)
    }

    const onWheel = (e: WheelEvent) => {
      const delta = e.deltaY * 0.002
      offset += delta
      velocity = delta
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('wheel', onWheel, { passive: true })

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width === 0 || height === 0) return
        camera.aspect = width / height
        adjustCameraFOV(width, height)
        renderer.setSize(width, height)
      }
    })
    resizeObserver.observe(container)

    renderer.domElement.style.cursor = 'grab'

    const revealStart = performance.now()
    let frameCount = 0
    let raf: number

    function tick() {
      raf = requestAnimationFrame(tick)
      frameCount++

      if (targetOffsetRef.current !== null) {
        // Smoothly interpolate towards target offset
        let target = targetOffsetRef.current
        
        // Find shortest path for rotation (modulo math)
        const diff = (target - offset) % CARD_COUNT
        const shortestDiff = (diff + CARD_COUNT + (CARD_COUNT/2)) % CARD_COUNT - (CARD_COUNT/2)
        target = offset + shortestDiff
        
        offset += (target - offset) * 0.05
        velocity = 0 // Stop coasting
      } else {
        if (!isDragging) {
          offset += velocity * COAST_MULT
        }
        offset += AUTO_SPEED
        velocity *= COAST_DECAY
      }

      updateLayout(offset)

      const elapsed = performance.now() - revealStart
      cards.forEach((mesh, i) => {
        const cardTime = elapsed - i * STAGGER_DELAY
        let t: number
        if (cardTime >= REVEAL_DURATION || elapsed > 3000) {
          t = 1
        } else if (cardTime > 0) {
          t = cardTime / REVEAL_DURATION
        } else {
          t = 0
        }
        const eased = 1 - Math.pow(1 - t, 3)
        const uniforms = (mesh.material as THREE.ShaderMaterial).uniforms
        uniforms.uRevealProgress.value = eased
        uniforms.uScrollSpeed.value = velocity
      })

      renderer.render(scene, camera)

      if (frameCount === 2) {
        onReadyRef.current?.()
      }
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('wheel', onWheel)
      resizeObserver.disconnect()
      renderer.dispose()
    }
  }, [])

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.canvasContainer} />
      <div
        className={`${styles.label} ${labelVisible ? styles.labelVisible : ''}`}
        style={{ left: hoverPos.x, top: hoverPos.y }}
      >
        {hoveredName}
      </div>
    </div>
  )
}
