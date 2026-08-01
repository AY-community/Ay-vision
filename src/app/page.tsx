import Hero from '@/components/Hero'
import Cursor from '@/components/Cursor'
import SmokeyCursor from '@/components/Cursor/SmokeyCursor'

export default function Home() {
  return (
    <main>
      {/* Custom premium cursor and smoke effect */}
      <Cursor />
      <SmokeyCursor 
        splatRadius={0.05} 
        splatForce={4000} 
        densityDissipation={3.0} 
        velocityDissipation={2.0}
        colorUpdateSpeed={2}
        pressureIterations={12}
        dyeResolution={1024}
        simulationResolution={100}
      />

      {/* Hero section with integrated 3D helix gallery */}
      <Hero />
    </main>
  )
}
