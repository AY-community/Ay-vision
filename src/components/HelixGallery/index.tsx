'use client'

import dynamic from 'next/dynamic'

const HelixGallery = dynamic(
  () => import('./HelixGallery'),
  { ssr: false }
)

export default HelixGallery
