import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/context/auth-context'
import { getMyResults } from '@/services/api'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Upload,
  Scan,
  Cpu,
  Target,
  Zap,
  CheckCircle2,
  Layers,
  ArrowRight,
  History,
  ShieldCheck,
  HelpCircle,
  BarChart3,
  Package,
} from 'lucide-react'

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export default function DashboardPage() {
  const { session } = useAuth()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMyResults()
        setResults(data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derived Computer Vision & Detection Stats
  const stats = useMemo(() => {
    const totalScans = results.length
    let totalDetections = 0
    const categoryCounts: Record<string, number> = {}
    const categoryConfidences: Record<string, { totalConf: number; count: number }> = {}
    
    let totalConfidenceSum = 0
    let allDetectionsCount = 0
    let maxConfidence = 0
    let minConfidence = 100

    let highConfCount = 0 // >75%
    let medConfCount = 0  // 50-75%
    let lowConfCount = 0  // <50%

    results.forEach(res => {
      const resDetections = res.detections || []
      totalDetections += (res.totalDetections || resDetections.length || 0)

      resDetections.forEach((det: any) => {
        const rawType = (det.type || 'Unknown').trim()
        const formattedType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase()
        const conf = typeof det.confidence === 'number' ? det.confidence : 0

        categoryCounts[formattedType] = (categoryCounts[formattedType] || 0) + 1
        
        if (!categoryConfidences[formattedType]) {
          categoryConfidences[formattedType] = { totalConf: 0, count: 0 }
        }
        categoryConfidences[formattedType].totalConf += conf
        categoryConfidences[formattedType].count += 1

        totalConfidenceSum += conf
        allDetectionsCount++

        if (conf > maxConfidence) maxConfidence = conf
        if (conf < minConfidence) minConfidence = conf

        if (conf >= 75) highConfCount++
        else if (conf >= 50) medConfCount++
        else lowConfCount++
      })
    })

    const avgConfidence = allDetectionsCount > 0 ? Math.round(totalConfidenceSum / allDetectionsCount) : 0
    const distinctClassesCount = Object.keys(categoryCounts).length
    if (allDetectionsCount === 0) {
      maxConfidence = 0
      minConfidence = 0
    } else {
      maxConfidence = Math.round(maxConfidence)
      minConfidence = Math.round(minConfidence)
    }

    // Scan activity over the last 7 days
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    }).reverse()

    const trendData = last7Days.map(date => {
      const dayScans = results.filter(r => r.createdAt && r.createdAt.startsWith(date))
      const dayDetections = dayScans.reduce((acc, r) => acc + (r.totalDetections || r.detections?.length || 0), 0)
      return {
        date,
        scans: dayScans.length,
        detections: dayDetections
      }
    })

    // Detected material distribution for Pie Chart
    const wasteOrder = ['Paper', 'Cardboard', 'Plastic', 'Metal', 'Glass']
    const pieData = wasteOrder.map((name) => {
      const matchingKey = Object.keys(categoryCounts).find((key) => key.toLowerCase() === name.toLowerCase())
      const value = matchingKey ? categoryCounts[matchingKey] : 0
      const catData = matchingKey ? categoryConfidences[matchingKey] : undefined
      const avgCatConf = catData && catData.count > 0 ? Math.round(catData.totalConf / catData.count) : 0
      return { name, value, avgConfidence: avgCatConf }
    })

    return {
      totalScans,
      totalDetections,
      distinctClassesCount,
      avgConfidence,
      maxConfidence,
      minConfidence,
      allDetectionsCount,
      highConfCount,
      medConfCount,
      lowConfCount,
      trendData,
      pieData,
      categoryCounts
    }
  }, [results])

  const kpiCards = [
    { title: 'Total Scans', value: stats.totalScans, icon: Upload, color: 'text-chart-1', bgColor: 'bg-chart-1/10' },
    { title: 'Objects Detected', value: stats.totalDetections, icon: Target, color: 'text-chart-2', bgColor: 'bg-chart-2/10' },
    { title: 'Material Classes', value: 5, icon: Layers, color: 'text-chart-4', bgColor: 'bg-chart-4/10' },
    { title: 'Avg Confidence', value: `${stats.avgConfidence}%`, icon: CheckCircle2, color: 'text-chart-3', bgColor: 'bg-chart-3/10' },
    { title: 'System Status', value: 'Online', icon: Zap, color: 'text-chart-5', bgColor: 'bg-chart-5/10' },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-8 animate-pulse max-w-7xl mx-auto">
        <div className="h-32 bg-muted rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-muted rounded-3xl" />
          <div className="h-80 bg-muted rounded-3xl" />
        </div>
      </div>
    )
  }

  const username = session?.email?.split('@')[0] || 'User'

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title="Dashboard" 
        subtitle="AI-powered multi-object waste detection system using computer vision." 
      />

      {/* Hero Section */}
      <motion.div 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/10 p-8 mb-8"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Badge className="mb-4 bg-primary/20 text-primary border-0 py-1.5 px-3.5 text-xs font-semibold">
              <Scan className="h-3.5 w-3.5 mr-2 inline-block" />
              YOLOv11 Multi-Object Detection
            </Badge>
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">
              AI-Powered Multi-Object Waste Detection
            </h2>
            <p className="text-muted-foreground font-medium text-sm max-w-xl leading-relaxed">
              Welcome back, <span className="text-foreground font-bold">{username}</span>. Analyze images and review your detection history and model predictions in real time.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <Button size="lg" className="btn-gradient text-white border-0 px-8 rounded-2xl shadow-lg shadow-primary/20 font-bold" asChild>
              <Link to="/upload">
                <Upload className="mr-2 h-5 w-5" /> Start New Scan
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none">
          <Cpu size={320} />
        </div>
      </motion.div>

      {/* Top Statistics KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            className="glass-card p-5 rounded-2xl border-white/5 flex flex-col items-center text-center group"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -4 }}
          >
            <div className={`p-3 rounded-xl mb-3 ${kpi.bgColor} ${kpi.color} group-hover:scale-110 transition-transform`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-black">{kpi.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{kpi.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Row */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Scan Activity Chart */}
        <motion.div className="lg:col-span-2 glass-card rounded-3xl p-6" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Scan Activity</h3>
              <p className="text-xs text-muted-foreground font-medium">Image scans processed over the last 7 days</p>
            </div>
            <Badge variant="outline" className="border-primary/50 text-primary text-xs font-semibold">
              Live Database
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trendData}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="scans" name="Scans" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Detected Material Distribution */}
        <motion.div className="glass-card rounded-3xl p-6 flex flex-col justify-between" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
          <div>
            <h3 className="text-lg font-bold mb-1">Detected Material Distribution</h3>
            <p className="text-xs text-muted-foreground font-medium mb-4">Breakdown of detected object classes</p>
          </div>
          <div className="h-44">
            {stats.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No detections recorded yet.
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {stats.pieData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="font-bold">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground">{item.value} obj</span>
                  <span className="text-[10px] font-semibold text-primary">{item.avgConfidence}% conf</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Detection Confidence Section */}
      <motion.div className="glass-card rounded-3xl p-6 mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-6 text-primary">
          <ShieldCheck className="h-5 w-5 text-chart-1" />
          <div>
            <h3 className="text-lg font-bold text-foreground leading-none">Detection Confidence Metrics</h3>
            <p className="text-xs text-muted-foreground font-medium mt-1">Real-time prediction confidence analysis derived from YOLOv11 bounding box scores</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Summary Stats */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Confidence Summary
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-background/50 border border-border/30">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Average</div>
                <div className="text-lg font-black text-chart-1">{stats.avgConfidence}%</div>
              </div>
              <div className="p-3 rounded-xl bg-background/50 border border-border/30">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Highest</div>
                <div className="text-lg font-black text-emerald-400">{stats.maxConfidence}%</div>
              </div>
              <div className="p-3 rounded-xl bg-background/50 border border-border/30">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Lowest</div>
                <div className="text-lg font-black text-amber-400">{stats.minConfidence}%</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on <strong className="text-foreground">{stats.allDetectionsCount}</strong> total bounding box predictions across all processed scans.
            </p>
          </div>

          {/* Confidence Tier Breakdown */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-chart-2" /> Tier Breakdown
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-chart-1">High (&gt;75%)</span>
                  <span>{stats.highConfCount} predictions</span>
                </div>
                <Progress 
                  value={stats.allDetectionsCount > 0 ? (stats.highConfCount / stats.allDetectionsCount) * 100 : 0} 
                  className="h-2 bg-slate-900/70"
                  indicatorColor="bg-chart-1"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-chart-2">Medium (50–75%)</span>
                  <span>{stats.medConfCount} predictions</span>
                </div>
                <Progress 
                  value={stats.allDetectionsCount > 0 ? (stats.medConfCount / stats.allDetectionsCount) * 100 : 0} 
                  className="h-2 bg-slate-900/70"
                  indicatorColor="bg-chart-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-chart-3">Low (&lt;50%)</span>
                  <span>{stats.lowConfCount} predictions</span>
                </div>
                <Progress 
                  value={stats.allDetectionsCount > 0 ? (stats.lowConfCount / stats.allDetectionsCount) * 100 : 0} 
                  className="h-2 bg-slate-900/70"
                  indicatorColor="bg-chart-3"
                />
              </div>
            </div>
          </div>

          {/* Technical Note on Confidence vs Accuracy */}
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col justify-between space-y-3 lg:col-span-1 md:col-span-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2 mb-2">
                <HelpCircle className="h-4 w-4" /> Technical Distinction
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                <strong className="text-foreground font-semibold">Model Confidence</strong> represents the statistical score assigned by YOLOv11 to an individual object prediction within a bounding box.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-semibold">Ground-Truth Accuracy</strong> is an empirical evaluation metric measured against human-annotated test datasets.
              </p>
            </div>
            <div className="text-[11px] text-muted-foreground/80 border-t border-primary/10 pt-2.5 italic">
              Note: Model output indicates object category classification confidence only.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Scans Section */}
      <motion.div className="glass-card rounded-3xl p-8 mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold">Recent Scans</h3>
            <p className="text-sm text-muted-foreground">Review your latest image detections and confidence scores</p>
          </div>
          <Button variant="outline" className="glass gap-2 border-border/50 rounded-xl font-bold text-xs" asChild>
            <Link to="/history">
              View History <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5">
                <th className="pb-4 px-2">Visual</th>
                <th className="pb-4">Detected Materials</th>
                <th className="pb-4 text-center">Objects</th>
                <th className="pb-4 text-center">Average Confidence</th>
                <th className="pb-4 text-right">Processed At</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {results.slice(0, 5).map((res) => {
                const primaryType = res.detections?.[0]?.type || 'Unknown'
                const primaryTypeFormatted = primaryType.charAt(0).toUpperCase() + primaryType.slice(1).toLowerCase()
                const detCount = res.totalDetections || res.detections?.length || 0
                const avgScanConf = res.detections?.length > 0 
                  ? Math.round(res.detections.reduce((acc: number, d: any) => acc + (d.confidence || 0), 0) / res.detections.length)
                  : 0

                return (
                  <tr key={res._id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 px-2">
                      <div className="h-12 w-16 rounded-xl bg-slate-800 border border-white/5 overflow-hidden">
                        <img src={`http://localhost:5000/${res.image}`} alt="Scan result" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{primaryTypeFormatted}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">ID: {res._id.slice(-8)}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <Badge variant="secondary" className="bg-white/5 text-xs font-bold px-2.5 py-0.5">{detCount}</Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-black text-primary">{avgScanConf}%</span>
                        <Progress value={avgScanConf} className="h-1 w-16" />
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex flex-col text-right">
                        <span className="text-xs font-bold">{new Date(res.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/results/${res._id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {results.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-4 text-muted-foreground">
                <History size={40} />
              </div>
              <p className="text-muted-foreground font-bold text-sm">No scan history recorded yet.</p>
              <Button variant="link" className="text-primary mt-2 font-bold" asChild>
                <Link to="/upload">Upload an image to start detection</Link>
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Analyze Image', icon: Upload, href: '/upload', color: 'bg-primary/20 text-primary' },
          { label: 'View Detection History', icon: History, href: '/history', color: 'bg-chart-2/20 text-chart-2' },
        ].map((action, i) => (
          <Link key={i} to={action.href}>
            <motion.div 
              className="glass-card p-6 rounded-3xl border-white/5 flex flex-col items-center gap-3 text-center group"
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform shadow-lg`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">{action.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Technical Computer Vision Footer */}
      <motion.div 
        className="mt-12 text-center p-6 rounded-3xl border border-dashed border-primary/20 bg-primary/5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
      >
        <Scan className="h-6 w-6 text-primary mx-auto mb-3" />
        <h4 className="text-lg font-bold uppercase tracking-tight">EcoScan Computer Vision Platform</h4>
        <p className="text-muted-foreground mt-1 text-xs font-medium max-w-lg mx-auto">
          Powered by YOLOv11 real-time multi-object detection and automated bounding box analysis.
        </p>
      </motion.div>
    </div>
  )
}
