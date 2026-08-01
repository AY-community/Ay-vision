'use client'

// Dynamic wrapper — Three.js must only run on the client
import dynamic from 'next/dynamic'

const SpaceCanvas = dynamic(
  () => import('./SpaceCanvas'),
  { ssr: false }
)

export default SpaceCanvas
