'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { PROJECTS } from '@/lib/projects'
import styles from './SpaceCanvas.module.css'

/*
  Cube world positions designed to orbit the "AY VISION" text.
  Camera is at Z=12 looking at origin. Text sits at screen center ≈ world (0,0,0).
  Cubes are at Z -4 to -8 so they sit visibly behind/around the text.
  X spread of ±8-12 keeps them left/right of the name.
  Y spread of ±4-7 keeps them above/below.
*/
// 6 cubes arranged in a circle on the RIGHT side of the screen
// Circle center ≈ (10, 0, -5), radius ≈ 6.0 units
// Angles: 0°, 60°, 120°, 180°, 240°, 300°
const R = 6.0
const CX = 10.0
const CY = 0.0
const CZ_BASE = -5
const CUBE_POSITIONS: [number, number, number][] = [
  [ CX + R,       CY,           CZ_BASE    ],  // 0° — right
  [ CX + R*0.5,   CY + R*0.866, CZ_BASE-1 ],  // 60° — top-right
  [ CX - R*0.5,   CY + R*0.866, CZ_BASE-1 ],  // 120° — top-left
  [ CX - R,       CY,           CZ_BASE    ],  // 180° — left
  [ CX - R*0.5,   CY - R*0.866, CZ_BASE-1 ],  // 240° — bottom-left
  [ CX + R*0.5,   CY - R*0.866, CZ_BASE-1 ],  // 300° — bottom-right
]

// Entry offsets — cubes shoot in from outside screen edges
const CUBE_ENTRY_OFFSETS: [number, number, number][] = [
  [ 55,    0,  0],  // 0°   — from far right
  [ 35,   50,  0],  // 60°  — from top-right corner
  [-35,   50,  0],  // 120° — from top-left corner
  [-55,    0,  0],  // 180° — from far left
  [-35,  -50,  0],  // 240° — from bottom-left corner
  [ 35,  -50,  0],  // 300° — from bottom-right corner
]

const FLOAT_SPEEDS = [0.38, 0.30, 0.50, 0.26, 0.42, 0.46]
const CUBE_SIZE    = 3.2

export default function SpaceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    /* ── Renderer ────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 1)

    /* ── Scene & Camera ─────────────────────────────────────── */
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      600
    )
    camera.position.set(-1, 0, 11)

    /* ── Lighting ────────────────────────────────────────────── */
    // Deep space ambient — barely there
    scene.add(new THREE.AmbientLight(0x0a0a1a, 1))

    // Strong white key light — makes metallic surfaces pop
    const key = new THREE.DirectionalLight(0xffffff, 5)
    key.position.set(20, 25, 15)
    scene.add(key)

    // Cold blue rim — metallic edge definition
    const rim = new THREE.DirectionalLight(0x2244ff, 2.5)
    rim.position.set(-15, -8, -10)
    scene.add(rim)

    // Warm fill from below — subtle color variation
    const fill = new THREE.DirectionalLight(0xff8833, 0.8)
    fill.position.set(5, -20, 5)
    scene.add(fill)

    /* ── Distant stars (tiny, barely visible) ───────────────── */
    const STAR_COUNT = 900
    const starPos    = new Float32Array(STAR_COUNT * 3)
    const starSize   = new Float32Array(STAR_COUNT)
    const starPhase  = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 350
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 350
      starPos[i * 3 + 2] = -(Math.random() * 200 + 80)  // Z -80 to -280
      starSize[i]  = Math.random() * 0.8 + 0.2            // tiny: 0.2–1.0
      starPhase[i] = Math.random() * Math.PI * 2
    }

    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos,   3))
    starGeo.setAttribute('aSize',    new THREE.BufferAttribute(starSize,   1))
    starGeo.setAttribute('aPhase',   new THREE.BufferAttribute(starPhase,  1))

    const starMat = new THREE.ShaderMaterial({
      uniforms: { 
        time: { value: 0 },
        globalAlpha: { value: 0 } 
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        varying float vAlpha;
        uniform float time;
        void main() {
          vAlpha = 0.2 + 0.25 * sin(time + aPhase);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (160.0 / -mv.z);
          gl_Position  = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        uniform float globalAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(1.0, 1.0, 1.0, (1.0 - d * 2.0) * vAlpha * globalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    })
    scene.add(new THREE.Points(starGeo, starMat))

    /* ── Cubes ───────────────────────────────────────────────── */
    const textureLoader = new THREE.TextureLoader()
    interface CubeParts {
      group:     THREE.Group
      glowMats:  THREE.LineBasicMaterial[]
      baseY:     number
      finalX:    number
      finalY:    number
    }
    const cubeParts: CubeParts[] = []

    PROJECTS.forEach((project, i) => {
      const group = new THREE.Group()
      const S = CUBE_SIZE

      /* Solid metallic face */
      const geo = new THREE.BoxGeometry(S, S, S)
      const baseMat = new THREE.MeshStandardMaterial({
        color:     project.color,
        metalness: 0.90,
        roughness: 0.10,
      })
      group.add(new THREE.Mesh(geo, baseMat))

      /* Image Decal (if exists) */
      if (project.image) {
        const decalGeo = new THREE.BoxGeometry(S + 0.02, S + 0.02, S + 0.02)
        const decalMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          metalness: 0.20,
          roughness: 0.80,
          transparent: true,
          depthWrite: false, // Prevents z-fighting with the base cube
        })
        const texture = textureLoader.load(project.image)
        texture.colorSpace = THREE.SRGBColorSpace
        decalMat.map = texture
        group.add(new THREE.Mesh(decalGeo, decalMat))
      }

      /*
        Soft glowing edges — 4 concentric edge layers with decreasing opacity.
        This approximates a bloom/glow look without post-processing.
        Each layer is slightly larger, creating a soft gradient halo on the edges.
      */
      const glowLayers = [
        { scale: 1.00, opacity: 1.00 },  // innermost — bright core
        { scale: 1.04, opacity: 0.60 },  // first halo
        { scale: 1.09, opacity: 0.30 },  // second halo
        { scale: 1.15, opacity: 0.12 },  // outermost fade
      ]

      const glowMats: THREE.LineBasicMaterial[] = []

      glowLayers.forEach(({ scale, opacity }) => {
        const eGeo = new THREE.EdgesGeometry(
          new THREE.BoxGeometry(S * scale, S * scale, S * scale)
        )
        const eMat = new THREE.LineBasicMaterial({
          color: project.color,
          transparent: true,
          opacity,
          depthWrite: false,
        })
        glowMats.push(eMat)
        group.add(new THREE.LineSegments(eGeo, eMat))
      })

      /* Per-cube colored point light for metallic color reflection */
      const pt = new THREE.PointLight(project.color, 8, 12, 1.8)
      pt.position.set(S, S, S)
      group.add(pt)

      /* Position — start off screen, fly to final position */
      const [x, y, z] = CUBE_POSITIONS[i]
      const [ox, oy] = CUBE_ENTRY_OFFSETS[i]
      // Start at off-screen entry position
      group.position.set(x + ox, y + oy, z)
      group.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      )

      scene.add(group)
      cubeParts.push({ group, glowMats, baseY: y, finalX: x, finalY: y })
    })

    /* ── Mouse + Raycaster for per-cube wind hover ───────────── */
    const mouse = { x: 0, y: 0, lx: 0, ly: 0 }
    const raycaster = new THREE.Raycaster()
    const mouseNDC = new THREE.Vector2()

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
      mouseNDC.set(mouse.x, -mouse.y)
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    /* ── Animation ───────────────────────────────────────────── */
    const clock = new THREE.Clock()
    let raf: number

    // Per-cube wind state: how much "wind" is being applied right now
    const windStrength = new Array(cubeParts.length).fill(0)
    const windDriftX   = new Array(cubeParts.length).fill(0)
    const windDriftY   = new Array(cubeParts.length).fill(0)

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()

      mouse.lx += (mouse.x - mouse.lx) * 0.04
      mouse.ly += (mouse.y - mouse.ly) * 0.04

      starMat.uniforms.time.value = t

      // Fade stars in from t=2.5 to t=4.0
      let sAlpha = (t - 2.5) / 1.5
      sAlpha = Math.max(0, Math.min(1, sAlpha))
      starMat.uniforms.globalAlpha.value = sAlpha

      // Raycast to detect which cubes mouse is near
      raycaster.setFromCamera(mouseNDC, camera)

      cubeParts.forEach(({ group, glowMats, baseY, finalX, finalY }, i) => {
        const spd = FLOAT_SPEEDS[i]

        /* ── Fly-in from off-screen edge ────────────────────── */
        const entryStart    = 3.0 + (i * 0.18)
        const entryDuration = 1.2
        const entryProgress = Math.min(1, Math.max(0, (t - entryStart) / entryDuration))
        const eased = entryProgress === 1 ? 1 : 1 - Math.pow(2, -10 * entryProgress)

        const [ox, oy] = CUBE_ENTRY_OFFSETS[i]
        const currentX = (finalX + ox) + (finalX - (finalX + ox)) * eased
        const currentY = (finalY + oy) + (finalY - (finalY + oy)) * eased

        /* Gentle orbital float */
        const floatAmount = eased
        const orbitR = 0.18
        const baseFloatX = currentX + Math.cos(t * spd * 0.7 + i * 1.05) * orbitR * floatAmount
        const baseFloatY = currentY + Math.sin(t * spd + i * 1.3) * 0.3 * floatAmount

        /* ── Wind hover effect via proximity ─────────────────
           Check 3D distance from ray to cube centre.
           If mouse ray passes close to the cube, we inject
           a wind impulse: fast spin + drift away from cursor.
        ────────────────────────────────────────────────────── */
        const cubeWorldPos = new THREE.Vector3()
        group.getWorldPosition(cubeWorldPos)

        // Distance from the ray to the cube's world centre
        const rayDist = raycaster.ray.distanceToPoint(cubeWorldPos)
        const proximity = Math.max(0, 1 - rayDist / 2.5) // influence within 2.5 units

        if (proximity > 0.05) {
          // Mouse direction in world space projected flat
          const mdx = mouse.lx
          const mdy = -mouse.ly
          windStrength[i] += proximity * 0.15
          windDriftX[i]   += (-mdx * proximity) * 0.03  // drift AWAY from cursor
          windDriftY[i]   += (-mdy * proximity) * 0.03
        }

        // Decay wind over time (feels like air resistance)
        windStrength[i] *= 0.92
        windDriftX[i]   *= 0.88
        windDriftY[i]   *= 0.88

        /* ── Apply wind physics ──────────────────────────────── */
        const baseRotSpd = 0.0025
        group.rotation.x += (baseRotSpd + windStrength[i] * 0.12) * spd
        group.rotation.y += (baseRotSpd * 1.4 + windStrength[i] * 0.18) * spd

        group.position.x = baseFloatX + windDriftX[i]
        group.position.y = baseFloatY + windDriftY[i]

        /* ── Emit 2D position for SmokeyCursor fluid sim ────────── */
        group.getWorldPosition(cubeWorldPos)
        cubeWorldPos.project(camera) // Converts to NDC (-1 to 1)

        // Convert NDC to texcoords (0 to 1, where 0,0 is bottom left)
        const texX = (cubeWorldPos.x + 1) / 2
        const texY = (cubeWorldPos.y + 1) / 2
        
        // Calculate velocity (difference from last frame)
        const globalArray = (window as any).__CUBES_2D_POSITIONS__ || []
        const lastPos = globalArray[i]
        const vX = lastPos ? (texX - lastPos.x) * 100 : 0
        const vY = lastPos ? (texY - lastPos.y) * 100 : 0

        globalArray[i] = { x: texX, y: texY, vx: vX, vy: vY, intensity: eased }
        ;(window as any).__CUBES_2D_POSITIONS__ = globalArray
        /* ───────────────────────────────────────────────────────── */

        /* Glow pulse — amplify on wind */
        const pulse = 0.7 + 0.3 * Math.sin(t * 1.2 + i * 1.05)
        const windGlow = 1 + windStrength[i] * 2
        glowMats[0].opacity = Math.min(1,   1.00 * pulse * windGlow)
        glowMats[1].opacity = Math.min(0.9, 0.60 * pulse * windGlow)
        glowMats[2].opacity = Math.min(0.6, 0.30 * pulse * windGlow)
        glowMats[3].opacity = Math.min(0.3, 0.12 * pulse * windGlow)
      })

      /* Camera — FIXED, no parallax */
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    tick()

    /* ── Resize ──────────────────────────────────────────────── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize',    onResize)
      renderer.dispose()
      starGeo.dispose()
      starMat.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.canvas} />
}
