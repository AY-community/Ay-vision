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
              style={{ perspective: 500 }}
            >
              <motion.div
                className={styles.progressCounter}
                initial={{ translateZ: 0, scale: 1, rotateY: 0, color: "rgba(255, 255, 255, 0.6)" }}
                animate={{ 
                  translateZ: [0, 20, 0],
                  x: [0, 2, 0],
                  y: [0, -2, 0],
                  scale: [1, 1.15, 1],
                  rotateY: [0, 20, 0],
                  color: ["rgba(255, 255, 255, 0.6)", "#ffffff", "rgba(255, 255, 255, 0.6)"]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 0.1,
                  ease: "easeInOut"
                }}
              >
                {Math.round(progress).toString().padStart(3, '0')}
                <span className={styles.percentSymbol}>%</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Screen reader only progress */}
          <span className={styles.srOnly}>Loading {progress}%</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
