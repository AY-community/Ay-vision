'use client'

import React from "react"
import { motion, Transition } from "framer-motion"
import styles from "./TextShimmerWave.module.css"

type TextShimmerWaveProps = {
  children: string
  as?: React.ElementType
  className?: string
  duration?: number
  zDistance?: number
  xDistance?: number
  yDistance?: number
  spread?: number
  scaleDistance?: number
  rotateYDistance?: number
  transition?: Transition
}

export default function TextShimmerWave({
  children,
  as: Component = "p",
  className,
  duration = 1,
  zDistance = 10,
  xDistance = 2,
  yDistance = -2,
  spread = 1,
  scaleDistance = 1.1,
  rotateYDistance = 10,
  transition,
}: TextShimmerWaveProps) {
  const MotionComponent = motion.create(
    Component as keyof React.JSX.IntrinsicElements,
  )

  // Colors based on dark theme (portfolio is dark)
  const baseColor = "rgba(255, 255, 255, 0.2)"
  const gradientColor = "#ffffff"

  return (
    <MotionComponent
      className={`${styles.container} ${className || ''}`}
      style={{ color: baseColor }}
    >
      {children.split("").map((char, i) => {
        const delay = (i * duration * (1 / spread)) / children.length

        return (
          <motion.span
            key={`${char}-${i}`}
            className={styles.letter}
            initial={{
              translateZ: 0,
              scale: 1,
              rotateY: 0,
              color: baseColor,
            }}
            animate={{
              translateZ: [0, zDistance, 0],
              translateX: [0, xDistance, 0],
              translateY: [0, yDistance, 0],
              scale: [1, scaleDistance, 1],
              rotateY: [0, rotateYDistance, 0],
              color: [baseColor, gradientColor, baseColor],
            }}
            transition={{
              duration,
              repeat: Infinity,
              repeatDelay: (children.length * 0.05) / spread,
              delay,
              ease: "easeInOut",
              ...transition,
            }}
          >
            {char}
          </motion.span>
        )
      })}
    </MotionComponent>
  )
}
