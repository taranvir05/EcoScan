import { motion } from 'framer-motion'
import { BarChart, TrendingUp, Leaf, Recycle, Globe2, Sparkles, Droplets, RotateCcw } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { buildFileUrl } from '@/lib/config'

interface ProfileStatsProps {
  stats: any
  onRefresh: () => void
}

export function ProfileStats({ stats, onRefresh }: ProfileStatsProps) {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
         <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground opacity-50">Identity Stats</h3>
         <button 
           onClick={onRefresh}
           className="h-8 w-8 rounded-lg glass-subtle border-border/50 flex items-center justify-center hover:text-primary transition-all"
           title="Refresh Statistics"
         >
           <RotateCcw className="h-4 w-4" />
         </button>
      </div>
      {/* 4 Premium Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Scans', value: stats.totalScans, icon: BarChart, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Common Waste', value: stats.mostCommonType, icon: Recycle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Avg Confidence', value: `${stats.avgConfidence}%`, icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'EcoScore', value: `${stats.ecoScore}/100`, icon: Globe2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ].map((item, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="glass-card rounded-2xl p-6 shadow-lg border-border/50"
          >
            <div className={`h-10 w-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4`}>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
            <p className="text-2xl font-black">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Eco Impact Dashboard */}
        <motion.div variants={itemVariants} className="glass-card rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Leaf className="h-48 w-48" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Your Environmental Impact
            </h3>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                  <span>Landfill Reduction</span>
                  <span className="text-emerald-500">{stats.impactSummary.landfillSaved}kg saved</span>
                </div>
                <Progress value={Math.min(100, stats.impactSummary.landfillSaved * 5)} className="h-2 bg-emerald-500/10" indicatorColor="bg-emerald-500" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                  <span>Carbon Footprint Offset</span>
                  <span className="text-blue-500">{stats.impactSummary.carbonOffset}kg CO2</span>
                </div>
                <Progress value={Math.min(100, stats.impactSummary.carbonOffset * 2)} className="h-2 bg-blue-500/10" indicatorColor="bg-blue-500" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                  <span>Recycling Potential</span>
                  <span className="text-amber-500">{stats.impactSummary.recyclingPotential} items</span>
                </div>
                <Progress value={Math.min(100, stats.impactSummary.recyclingPotential * 10)} className="h-2 bg-amber-500/10" indicatorColor="bg-amber-500" />
              </div>
            </div>

            <div className="mt-10 p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20">
                  {Math.floor(stats.ecoScore / 20) + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-500">Sustainability Level: Eco Warrior</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Top 15% of Contributors</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Latest Insight Card */}
        <motion.div variants={itemVariants} className="glass-card rounded-3xl p-8 shadow-xl bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Latest Contribution
          </h3>
          {stats.latestScan ? (
            <div className="space-y-6">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden group shadow-2xl">
                <img 
                  src={buildFileUrl(stats.latestScan.image)} 
                  alt="Latest scan" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-xs font-black uppercase tracking-widest text-white/70">Detected Type</p>
                  <p className="text-lg font-black text-white capitalize">{stats.latestScan.detections[0]?.type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background/50 rounded-xl border border-border/50">
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Confidence</p>
                  <p className="text-lg font-black">{Math.round(stats.latestScan.detections[0]?.confidence || 0)}%</p>
                </div>
                <div className="p-4 bg-background/50 rounded-xl border border-border/50">
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Date</p>
                  <p className="text-sm font-bold">{new Date(stats.latestScan.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
               <Droplets className="h-16 w-16 mb-4" />
               <p className="font-bold">No scans yet. Start uploading!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
