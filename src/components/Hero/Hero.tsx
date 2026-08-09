'use client'

import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import InteractiveTitle from './InteractiveTitle'
import HelixGallery from '@/components/HelixGallery'
import ProjectList from '../ProjectList/ProjectList'
import LoadingScreen from '@/components/LoadingScreen/LoadingScreen'
import { PROJECTS } from '@/lib/projects'
import styles from './Hero.module.css'

function OdometerDigit({ digit, digitHeight = 60, delay = 0 }: { digit: number; digitHeight?: number; delay?: number }) {
  const [current, setCurrent] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setCurrent(digit), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [digit, delay])

  return (
    <div
      ref={ref}
      style={{
        height: digitHeight,
        overflow: 'hidden',
        display: 'inline-block',
        position: 'relative',
      }}
    >
      <div
        style={{
          transform: `translateY(-${current * digitHeight}px)`,
          transition: 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div
            key={n}
            style={{
              height: digitHeight,
              lineHeight: `${digitHeight}px`,
              fontSize: digitHeight * 0.7,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  )
}

function OdometerNumber({ value, digitHeight = 60 }: { value: number; digitHeight?: number }) {
  const digits = String(value).split('')
  return (
    <div style={{ display: 'inline-flex' }}>
      {digits.map((d, i) => (
        <OdometerDigit
          key={i}
          digit={parseInt(d, 10)}
          digitHeight={digitHeight}
          delay={i * 80}
        />
      ))}
    </div>
  )
}

// Expo-out easing — the signature curve of premium award-winning sites
const EXPO_OUT = [0.22, 1, 0.36, 1] as const

const uiVariants = (introDelay: number, outroDelay: number) => ({
  hidden:  { opacity: 0, y: 40, filter: 'blur(12px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 1.1, ease: EXPO_OUT, delay: introDelay },
  },
  outro: {
    opacity: 0, y: -40, filter: 'blur(12px)',
    transition: { duration: 0.85, ease: EXPO_OUT, delay: outroDelay },
  }
})

export default function Hero() {
  const [phase, setPhase] = useState<'intro' | 'done' | 'outro'>('intro')
  const [galleryReady, setGalleryReady] = useState(false)
  const [hoveredProjectIndex, setHoveredProjectIndex] = useState<number | null>(null)
  const hoveredProject = hoveredProjectIndex === null ? null : PROJECTS[hoveredProjectIndex]

  // Loading screen progress state
  const [loadProgress, setLoadProgress] = useState(0)
  const [loadComplete, setLoadComplete] = useState(false)
  const progressRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  // Simulate progress: fast to 85%, then wait for galleryReady to hit 100%
  useEffect(() => {
    const target = galleryReady ? 100 : 85
    const step = () => {
      progressRef.current += (target - progressRef.current) * 0.04
      if (progressRef.current < 99.5) {
        setLoadProgress(Math.min(progressRef.current, 100))
        rafRef.current = requestAnimationFrame(step)
      } else {
        setLoadProgress(100)
        setLoadComplete(true)
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [galleryReady])

  // Intro timer — starts after loading screen finishes
  useEffect(() => {
    if (phase !== 'intro' || !loadComplete) return
    const delay = 800 // small grace after loader exits
    const t = setTimeout(() => setPhase('done'), delay)
    return () => clearTimeout(t)
  }, [loadComplete, phase])

  // Scroll/Wheel listener for outro/intro toggle
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (phase === 'done' && e.deltaY > 20) setPhase('outro')
      else if (phase === 'outro' && e.deltaY < -20) setPhase('done')
    }
    
    let startY = 0
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
    }
    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = startY - e.touches[0].clientY
      if (phase === 'done' && deltaY > 30) setPhase('outro')
      else if (phase === 'outro' && deltaY < -30) setPhase('done')
    }

    window.addEventListener('wheel', handleWheel)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [phase])

  return (
    <>
      <LoadingScreen progress={loadProgress} isComplete={loadComplete} />
      <div
        className={`${styles.projectAtmosphere} ${hoveredProject ? styles.projectAtmosphereVisible : ''}`}
        style={{ '--project-color': hoveredProject?.cssColor ?? 'transparent' } as CSSProperties}
        aria-hidden="true"
      />
      <section className={styles.hero} id="hero" aria-label="Hero">
        <div className={styles.split}>

          <div className={styles.left}>

            <motion.p
              className={styles.eyebrow}
              initial="hidden" animate={phase === 'outro' ? 'outro' : phase === 'done' ? 'visible' : 'hidden'}
              variants={uiVariants(0, 0.25)}
            >
              Creative Portfolio · 2026
            </motion.p>

            <div>
              <InteractiveTitle phase={phase} />
            </div>

            <motion.p
              className={styles.tagline}
              initial="hidden" animate={phase === 'outro' ? 'outro' : phase === 'done' ? 'visible' : 'hidden'}
              variants={uiVariants(0.22, 0.15)}
            >
              Building digital experiences that push boundaries — where design meets engineering precision.
            </motion.p>

            <motion.p
              className={styles.bio}
              initial="hidden" animate={phase === 'outro' ? 'outro' : phase === 'done' ? 'visible' : 'hidden'}
              variants={uiVariants(0.38, 0.1)}
            >
              I design and develop high-performance web products — from motion-rich interfaces to
              full-stack platforms powered by AI. Every pixel is intentional.
            </motion.p>

            <motion.div
              className={styles.stats}
              initial="hidden" animate={phase === 'outro' ? 'outro' : phase === 'done' ? 'visible' : 'hidden'}
              variants={uiVariants(0.54, 0.05)}
            >
              <div className={styles.stat}>
                <div className={styles.statNum}>
                  {phase === 'done' ? <OdometerNumber value={6} digitHeight={41} /> : <span>0</span>}+
                </div>
                <span className={styles.statLabel}>Projects</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <div className={styles.statNum}>
                  {phase === 'done' ? <OdometerNumber value={3} digitHeight={41} /> : <span>0</span>}+
                </div>
                <span className={styles.statLabel}>Years</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <div className={styles.statNum}>
                  {phase === 'done' ? <OdometerNumber value={8} digitHeight={41} /> : <span>0</span>}+
                </div>
                <span className={styles.statLabel}>Clients</span>
              </div>
            </motion.div>

            <motion.div
              className={styles.navActions}
              initial="hidden" animate={phase === 'outro' ? 'outro' : phase === 'done' ? 'visible' : 'hidden'}
              variants={uiVariants(0.68, 0)}
            >
              <button
                className={styles.navLink}
                onClick={() => setPhase(phase === 'outro' ? 'done' : 'outro')}
                aria-label="View projects"
              >
                Projects
              </button>
              <a
                href="https://www.linkedin.com/in/aymen-chedri-maamer-80ab53341/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactBtn}
              >
                <div className={styles.contactBlob} />
                <span className={styles.contactInner}>Contact Me</span>
              </a>
            </motion.div>

          </div>

          <div className={styles.right} aria-hidden="true" />

        </div>

      </section>
      <ProjectList 
        phase={phase}
        onHoverStart={setHoveredProjectIndex}
        onHoverEnd={() => setHoveredProjectIndex(null)}
      />
      <HelixGallery 
        onReady={() => setGalleryReady(true)}
        hoveredIndex={hoveredProjectIndex}
      />
    </>
  )
}
