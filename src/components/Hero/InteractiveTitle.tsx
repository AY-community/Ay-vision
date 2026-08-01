'use client'

import React, { useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import styles from './Hero.module.css'

const TITLE = 'AY VISION'
const TITLE_CHARS = TITLE.split('')

const containerVariants = {
  hidden:  { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
  outro: {
    opacity: 1,
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
}

const charVariants = {
  hidden:  { y: '130%', opacity: 0, rotateX: -70, skewX: '8deg' },
  visible: {
    y: '0%', opacity: 1, rotateX: 0, skewX: '0deg',
    transition: { type: 'spring' as const, damping: 22, stiffness: 220, mass: 0.9 },
  },
  outro: {
    y: '-130%', opacity: 0, rotateX: 70, skewX: '-8deg',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export default function InteractiveTitle({ phase = 'done' }: { phase?: string }) {
  const containerRef = useRef<HTMLHeadingElement>(null)

  const mouseX = useMotionValue(-1000)
  const mouseY = useMotionValue(-1000)
  const smoothX = useSpring(mouseX, { damping: 30, stiffness: 200 })
  const smoothY = useSpring(mouseY, { damping: 30, stiffness: 200 })

  const baseRefs = useRef<(HTMLSpanElement | null)[]>([])
  const chromeRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    }

    const handleMouseLeave = () => {
       mouseX.set(-1000)
       mouseY.set(-1000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.body.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [mouseX, mouseY])

  return (
    <h1 ref={containerRef} className={styles.titleContainer}>
      <motion.div
        className={styles.titleBase}
        aria-label={TITLE}
        variants={containerVariants}
        initial="hidden"
        animate={phase === 'outro' ? 'outro' : phase === 'done' ? 'visible' : 'hidden'}
      >
        {TITLE_CHARS.map((char, i) => (
          <span key={`base-${i}`} className={styles.charWrap} ref={(el) => { baseRefs.current[i] = el }}>
            <motion.span className={styles.char} variants={charVariants}>
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          </span>
        ))}
      </motion.div>

      {phase === 'done' && (
        <motion.div
          className={styles.titleChrome}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            '--mouse-x': smoothX,
            '--mouse-y': smoothY,
          } as any}
        >
          {TITLE_CHARS.map((char, i) => (
            <span
              key={`chrome-${i}`}
              className={styles.charWrap}
              ref={(el) => { chromeRefs.current[i] = el }}
            >
              <span className={styles.char}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            </span>
          ))}
        </motion.div>
      )}
    </h1>
  )
}
