import React from 'react'
import { motion } from 'framer-motion'
import { PROJECTS, CATEGORY_LABELS } from '@/lib/projects'
import styles from './ProjectList.module.css'

interface ProjectListProps {
  phase: string
  onHoverStart: (index: number) => void
  onHoverEnd: () => void
}

const EXPO_OUT = [0.22, 1, 0.36, 1] as const

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
  outro: {
    opacity: 0,
    transition: { duration: 0.5 },
  }
}

const categoryVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EXPO_OUT },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EXPO_OUT },
  },
}

export default function ProjectList({ phase, onHoverStart, onHoverEnd }: ProjectListProps) {
  // Group projects by category
  const categories = ['webapp', 'automation', 'landing'] as const

  const [activeTouchId, setActiveTouchId] = React.useState<string | null>(null)

  const handleProjectClick = (project: any, index: number) => {
    if (!project.link) return

    const isTouch = window.matchMedia('(pointer: coarse)').matches

    if (isTouch) {
      if (activeTouchId === project.id) {
        // Second tap: navigate in the current tab. Opening a new tab on touch
        // devices feels like an accidental popup and breaks the back gesture.
        window.location.assign(project.link)
      } else {
        // First tap: preview it
        setActiveTouchId(project.id)
        onHoverStart(index)
      }
    } else {
      // Desktop: single click to open
      window.open(project.link, '_blank')
    }
  }

  return (
    <motion.div 
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate={phase === 'outro' ? 'visible' : 'hidden'}
      style={{ pointerEvents: phase === 'outro' ? 'auto' : 'none' }}
    >
      <div className={styles.scrollContent}>
        {categories.map((catKey) => {
          const catProjects = PROJECTS.filter(p => p.category === catKey)
          if (catProjects.length === 0) return null

          return (
            <div key={catKey} className={styles.categoryBlock}>
              <motion.div variants={categoryVariants} className={styles.categoryHeader}>
                <span className={styles.categoryLabel}>{CATEGORY_LABELS[catKey]}</span>
                <div className={styles.categoryLine} />
              </motion.div>

              <div className={styles.projectGroup}>
                {catProjects.map((project) => {
                  const projectIndex = PROJECTS.findIndex(p => p.id === project.id)
                  return (
                    <motion.div 
                      key={project.id}
                      variants={itemVariants}
                      className={`${styles.projectItem} ${!project.link ? styles.projectItemDisabled : ''}`}
                      onMouseEnter={() => onHoverStart(projectIndex)}
                      onMouseLeave={onHoverEnd}
                      onClick={() => handleProjectClick(project, projectIndex)}
                    >
                      <h3 className={styles.projectName}>
                        {project.name}
                        {project.link && <span className={styles.linkArrow}>↗</span>}
                      </h3>
                      <div className={styles.projectDetails}>
                        <span className={styles.projectTagline}>{project.tagline}</span>
                        {project.status === 'coming-soon' && (
                          <span className={styles.statusBadge}>Coming Soon</span>
                        )}
                        {project.category === 'automation' && !project.link && (
                          <span className={styles.statusBadge}>Private</span>
                        )}
                      </div>
                      <div className={styles.hoverLine} />
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
