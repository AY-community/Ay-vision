'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import styles from './SpiralGallery.module.css'

const CARD_COUNT = 12
const NAMES = ['Jupiter', 'Nova', 'Echo', 'Fable', 'Kite', 'Orbit', 'Prism', 'Halo', 'Lumen', 'Vector', 'Zenith', 'Aria']
const COLORS: number[] = [0x3355ff, 0xffb020, 0x22c58a, 0xff5577, 0x8855ff, 0x22c9c9, 0xffd93d, 0x5599ff, 0xff8844, 0x33dd88, 0xdd44ff, 0x44aaff]
const ANGLE_STEP = 0.34
const RADIUS_BASE = 1.15
const RADIUS_STEP = 0.05
const HEIGHT_STEP = 0.42
const SCALE_STEP = 0.025
const CARD_W = 2.0
const CARD_H = 1.4

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

interface LayoutEntry {
  pos: THREE.Vector3
  scale: number
  rotX: number
  rotY: number
  rotZ: number
}

export default function SpiralGallery() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredName, setHoveredName] = useState<string | null>(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })
  const [labelVisible, setLabelVisible] = useState(false)
  const [viewMode, setViewMode] = useState<'spiral' | 'list'>('spiral')
  const modeRef = useRef<'spiral' | 'list'>('spiral')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x05070a, 0.035)

    const camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0.6, 5.2)

    scene.add(new THREE.AmbientLight(0x334455, 1.1))
    const pt1 = new THREE.PointLight(0x66aaff, 2.2, 12)
    pt1.position.set(2, 3, 4)
    scene.add(pt1)
    const pt2 = new THREE.PointLight(0xff66aa, 1.4, 10)
    pt2.position.set(-3, -1, 3)
    scene.add(pt2)

    const grid = new THREE.GridHelper(40, 40, 0x223344, 0x111a22)
    grid.position.y = -3.5
    scene.add(grid)

    const group = new THREE.Group()
    scene.add(group)

    const cards: THREE.Mesh[] = []
    const spiralLayout: LayoutEntry[] = []
    const listLayout: LayoutEntry[] = []

    for (let i = 0; i < CARD_COUNT; i++) {
      const angle = i * ANGLE_STEP
      const radius = RADIUS_BASE + i * RADIUS_STEP
      const scale = Math.max(0.45, 1 - i * SCALE_STEP)

      spiralLayout.push({
        pos: new THREE.Vector3(radius * Math.cos(angle), -2 + i * HEIGHT_STEP, radius * Math.sin(angle)),
        scale,
        rotX: (seededRandom(i) - 0.5) * 1.1,
        rotY: (seededRandom(i + 100) - 0.5) * 0.9,
        rotZ: (seededRandom(i + 50) - 0.5) * 1.3,
      })

      const cols = 4
      listLayout.push({
        pos: new THREE.Vector3((i % cols - (cols - 1) / 2) * 2.1, 2.2 - Math.floor(i / cols) * 1.6, 0),
        scale: 1,
        rotX: 0,
        rotY: 0,
        rotZ: 0,
      })

      const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 12, 8)
      const posAttr = geo.attributes.position
      for (let v = 0; v < posAttr.count; v++) {
        const x = posAttr.getX(v)
        posAttr.setZ(v, posAttr.getZ(v) + Math.sin((x / CARD_W) * Math.PI) * 0.06)
      }
      geo.computeVertexNormals()

      const mat = new THREE.MeshStandardMaterial({
        color: COLORS[i % COLORS.length],
        roughness: 0.35,
        metalness: 0.1,
        side: THREE.DoubleSide,
      })

      const mesh = new THREE.Mesh(geo, mat)
      mesh.userData = { index: i, name: NAMES[i % NAMES.length], baseScale: scale }
      group.add(mesh)
      cards.push(mesh)
    }

    function snapLayout(layout: LayoutEntry[]) {
      cards.forEach((mesh, i) => {
        const t = layout[i]
        mesh.position.copy(t.pos)
        mesh.scale.setScalar(t.scale)
        mesh.rotation.x = t.rotX
        mesh.rotation.y = t.rotY
        mesh.rotation.z = t.rotZ
      })
    }

    function setLayoutTarget(layout: LayoutEntry[]) {
      cards.forEach((mesh, i) => {
        const t = layout[i]
        mesh.userData.targetPos = t.pos
        mesh.userData.targetScale = t.scale
        mesh.userData.targetRotX = t.rotX
        mesh.userData.targetRotY = t.rotY
        mesh.userData.targetRotZ = t.rotZ
      })
    }

    snapLayout(spiralLayout)
    setLayoutTarget(spiralLayout)

    let isDragging = false
    let prevX = 0
    let prevY = 0
    let targetRotY = 0.4
    let currentRotY = 0.4
    let targetRotX = 0
    let currentRotX = 0

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true; prevX = e.clientX; prevY = e.clientY
    }
    const onPointerUp = () => { isDragging = false }

    let hoveredMesh: THREE.Mesh | null = null
    const raycaster = new THREE.Raycaster()
    const mouseNDC = new THREE.Vector2()

    function checkHover(clientX: number, clientY: number) {
      mouseNDC.x = (clientX / window.innerWidth) * 2 - 1
      mouseNDC.y = -(clientY / window.innerHeight) * 2 + 1
      raycaster.setFromCamera(mouseNDC, camera)
      const hits = raycaster.intersectObjects(cards)

      if (hits.length > 0) {
        const m = hits[0].object as THREE.Mesh
        hoveredMesh = m
        setHoveredName(m.userData.name as string)
        setHoverPos({ x: clientX, y: clientY })
        setLabelVisible(true)
      } else {
        hoveredMesh = null
        setLabelVisible(false)
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        targetRotY += (e.clientX - prevX) * 0.005
        targetRotX += (e.clientY - prevY) * 0.003
        targetRotX = Math.max(-0.4, Math.min(0.4, targetRotX))
        prevX = e.clientX; prevY = e.clientY
      }
      checkHover(e.clientX, e.clientY)
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)

    let pendingToggle: 'spiral' | 'list' | null = null
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent).detail
      pendingToggle = detail.mode
    }
    window.addEventListener('spiral-toggle', onToggle)

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()
    let raf: number

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = clock.getDelta()
      const factor = 1 - Math.pow(0.001, dt)

      if (pendingToggle) {
        const layout = pendingToggle === 'spiral' ? spiralLayout : listLayout
        setLayoutTarget(layout)
        pendingToggle = null
      }

      currentRotY += (targetRotY - currentRotY) * 0.06
      currentRotX += (targetRotX - currentRotX) * 0.06
      group.rotation.y = currentRotY
      group.rotation.x = currentRotX

      cards.forEach((mesh) => {
        const u = mesh.userData
        if (!u.targetPos) return
        mesh.position.lerp(u.targetPos, factor)
        const targetScale = u.targetScale * (mesh === hoveredMesh ? 1.15 : 1)
        mesh.scale.setScalar(mesh.scale.x + (targetScale - mesh.scale.x) * factor)
        mesh.rotation.x += (u.targetRotX - mesh.rotation.x) * factor
        mesh.rotation.y += (u.targetRotY - mesh.rotation.y) * factor
        mesh.rotation.z += (u.targetRotZ - mesh.rotation.z) * factor
      })

      const globalArray: any[] = (window as any).__CUBES_2D_POSITIONS__ || []
      cards.forEach((mesh, i) => {
        const worldPos = new THREE.Vector3()
        mesh.getWorldPosition(worldPos)
        worldPos.project(camera)
        const texX = (worldPos.x + 1) / 2
        const texY = (worldPos.y + 1) / 2
        const lastPos = globalArray[i]
        const vX = lastPos ? (texX - lastPos.x) * 100 : 0
        const vY = lastPos ? (texY - lastPos.y) * 100 : 0
        globalArray[i] = { x: texX, y: texY, vx: vX, vy: vY, intensity: 1 }
      })
      ;(window as any).__CUBES_2D_POSITIONS__ = globalArray

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('spiral-toggle', onToggle)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  const handleToggle = (mode: 'spiral' | 'list') => {
    if (modeRef.current === mode) return
    modeRef.current = mode
    setViewMode(mode)
    window.dispatchEvent(new CustomEvent('spiral-toggle', { detail: { mode } }))
  }

  return (
    <div className={styles.wrapper}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.toggle}>
        <span
          className={viewMode === 'spiral' ? styles.toggleActive : ''}
          onClick={() => handleToggle('spiral')}
        >
          spiral
        </span>
        <span className={styles.toggleDot} />
        <span
          className={viewMode === 'list' ? styles.toggleActive : ''}
          onClick={() => handleToggle('list')}
        >
          list
        </span>
      </div>

      <div
        className={`${styles.label} ${labelVisible ? styles.labelVisible : ''}`}
        style={{ left: hoverPos.x, top: hoverPos.y }}
      >
        {hoveredName}
      </div>

      <div className={styles.hint}>drag to rotate · hover a card</div>
    </div>
  )
}
