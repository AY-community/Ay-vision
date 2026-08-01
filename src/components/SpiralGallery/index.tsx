'use client'

import dynamic from 'next/dynamic'

const SpiralGallery = dynamic(
  () => import('./SpiralGallery'),
  { ssr: false }
)

export default SpiralGallery
