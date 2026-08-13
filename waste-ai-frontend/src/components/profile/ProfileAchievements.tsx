import { motion } from 'framer-motion'
import { Award, Star, Zap, Target, Trophy, Medal, Lock } from 'lucide-react'

interface ProfileAchievementsProps {
  scanCount: number
}

const BADGES = [
  { id: 'first', label: 'First Contribution', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10', threshold: 1, description: 'Uploaded your first waste scan' },
  { id: 'thinker', label: 'Circular Thinker', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10', threshold: 5, description: 'Reached 5 intelligent waste detections' },
  { id: 'explorer', label: 'Data Explorer', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', threshold: 10, description: 'Analyzed 10 different items' },
  { id: 'champion', label: 'Eco Champion', icon: Trophy, color: 'text-primary', bg: 'bg-primary/10', threshold: 50, description: 'Contributed 50 items to sustainability' },
  { id: 'legend', label: 'Eco Legend', icon: Medal, color: 'text-rose-500', bg: 'bg-rose-500/10', threshold: 100, description: 'Elite contributor with 100+ scans' },
]

export function ProfileAchievements({ scanCount }: ProfileAchievementsProps) {
  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold mb-2">Platform Achievements</h3>
        <p className="text-muted-foreground text-sm">Unlock premium badges as you contribute more to a cleaner planet.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((badge: any, i) => {
          const isUnlocked = scanCount >= badge.threshold
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-3xl p-8 border-2 transition-all duration-500 ${
                isUnlocked ? 'border-primary/20 shadow-2xl bg-primary/[0.02]' : 'border-border/50 opacity-50 grayscale'
              }`}
            >
              <div className="relative mb-6">
                <div className={`h-16 w-16 mx-auto ${isUnlocked ? badge.bg + ' ' + badge.color : 'bg-muted'} rounded-2xl flex items-center justify-center`}>
                  {isUnlocked ? <badge.icon className="h-8 w-8" /> : <Lock className="h-8 w-8 text-muted-foreground" />}
                </div>
                {isUnlocked && (
                   <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     className="absolute -top-2 -right-2 h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg"
                   >
                     ✓
                   </motion.div>
                )}
              </div>
              <div className="text-center">
                <h4 className="font-bold mb-1">{badge.label}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed px-4">{badge.description}</p>
                {!isUnlocked && (
                   <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Requirement</p>
                      <p className="text-xs font-bold">
                        {`${scanCount} / ${badge.threshold} Scans`}
                      </p>
                   </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
