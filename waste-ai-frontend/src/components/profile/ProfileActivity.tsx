import { motion } from 'framer-motion'
import { Upload, Shield, Download, Lightbulb, Clock } from 'lucide-react'

interface ProfileActivityProps {
  activity: any[]
}

export function ProfileActivity({ activity }: ProfileActivityProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'report': return <Download className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'upload': return 'bg-emerald-500/10 text-emerald-500'
      case 'security': return 'bg-blue-500/10 text-blue-500'
      case 'chat': return 'bg-purple-500/10 text-purple-500'
      case 'report': return 'bg-amber-500/10 text-amber-500'
      default: return 'bg-primary/10 text-primary'
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
       <div className="flex items-center gap-2 px-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-xl font-bold">Recent Activity</h3>
       </div>

       <div className="relative pl-8 space-y-12 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent">
          {activity.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className={`absolute -left-8 top-1 h-7 w-7 rounded-full border-4 border-background ${getColor(item.type)} flex items-center justify-center shadow-lg`}>
                {getIcon(item.type)}
              </div>
              <div className="glass-card rounded-2xl p-5 shadow-lg border-border/50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                   <div>
                     <p className="font-bold text-sm">{item.text}</p>
                     <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Platform Action • Auto Verified</p>
                   </div>
                   <span className="text-[10px] font-medium text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                     {new Date(item.timestamp).toLocaleString()}
                   </span>
                </div>
              </div>
            </motion.div>
          ))}

          {activity.length === 0 && (
            <div className="text-center py-20 opacity-30">
               <Clock className="h-12 w-12 mx-auto mb-4" />
               <p>No recent activity recorded.</p>
            </div>
          )}
       </div>
    </div>
  )
}
