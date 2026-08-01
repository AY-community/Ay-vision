'use client'

import dynamic from 'next/dynamic'

// The Cursor component uses window/canvas so it must be client-side only
const Cursor = dynamic(() => import('./Cursor'), { ssr: false })

export default Cursor
