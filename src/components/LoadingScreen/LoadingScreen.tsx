'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TextShimmerWave from '../TextShimmerWave/TextShimmerWave'
import styles from './LoadingScreen.module.css'

interface LoadingScreenProps {
  progress: number   // 0–100
  isComplete: boolean
}

const EXPO_OUT = [0.16, 1, 0.3, 1] as const

export default function LoadingScreen({ progress, isComplete }: LoadingScreenProps) {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  // The overlay covers the page, so prevent the page behind it from moving on
  // touch devices before the portfolio gesture controls are ready.
  useEffect(() => {
    if (!visible) return

    const htmlOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = htmlOverflow
      document.body.style.overflow = bodyOverflow
    }
  }, [visible])

  useEffect(() => {
    if (isComplete) {
      const t1 = setTimeout(() => setLeaving(true), 300)
      const t2 = setTimeout(() => setVisible(false), 1800)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [isComplete])

  if (!visible) return null

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.9, delay: 0.2, ease: EXPO_OUT } }}
        >
          <div className={styles.content}>
            <TextShimmerWave
              duration={1.5}
              spread={1.5}
              zDistance={20}
              scaleDistance={1.15}
              rotateYDistance={20}
            >
              AY VISION
            </TextShimmerWave>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <TextShimmerWave
                className={styles.progressCounter}
                as="div"
                duration={1.5}
                spread={1.5}
                zDistance={14}
                xDistance={1.5}
                yDistance={-1.5}
                scaleDistance={1.08}
                rotateYDistance={14}
                letterStyle={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  fontWeight: 400,
                  letterSpacing: '0.18em',
                }}
              >
                {`${Math.round(progress).toString().padStart(3, '0')}%`}
              </TextShimmerWave>
            </motion.div>
          </div>

          {/* Screen reader only progress */}
          <span className={styles.srOnly}>Loading {progress}%</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
