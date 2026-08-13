import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumb?: { label: string; href?: string }[]
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumb }) => {
  return (
    <motion.div 
      className="mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">
        <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
          <Home size={12} />
          <span>EcoScan</span>
        </Link>
        {breadcrumb ? (
          breadcrumb.map((item, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={10} className="opacity-50" />
              {item.href ? (
                <Link to={item.href} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-primary/80">{item.label}</span>
              )}
            </React.Fragment>
          ))
        ) : (
          <>
            <ChevronRight size={10} className="opacity-50" />
            <span className="text-primary/80">{title}</span>
          </>
        )}
      </div>
      
      <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground mt-2 font-medium text-lg max-w-2xl">
          {subtitle}
        </p>
      )}
      
      <div className="h-1 w-20 bg-gradient-to-r from-primary to-chart-4 rounded-full mt-4" />
    </motion.div>
  )
}
