import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/PageHeader'
import { toast } from 'sonner'
import api from '@/services/api'
import { buildFileUrl } from '@/lib/config'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import {
  Users,
  Upload,
  Trash2,
  TrendingUp,
  Activity,
  Server,
  Cpu,
  HardDrive,
  Zap,
  Shield,
  Search,
  MoreVertical,
  UserPlus,
  UserMinus,
  Ban,
  Eye,
  FileText,
  AlertCircle,
  Lightbulb,
  Download
} from 'lucide-react'

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export default function AdminPage() {
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [scans, setScans] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const wasteDistribution = useMemo(() => {
    const order = ['Paper', 'Cardboard', 'Plastic', 'Metal', 'Glass']
    const rawData = Array.isArray(stats?.wasteDistribution) ? stats.wasteDistribution : []
    const mapped = new Map<string, number>()

    rawData.forEach((item: any) => {
      const name = String(item?.name || '').trim()
      const key = name.toLowerCase()
      const matchedName = key.includes('paper') ? 'Paper'
        : key.includes('cardboard') ? 'Cardboard'
        : key.includes('plastic') ? 'Plastic'
        : key.includes('metal') ? 'Metal'
        : key.includes('glass') ? 'Glass'
        : name

      if (order.includes(matchedName)) {
        mapped.set(matchedName, Number(item?.value || 0))
      }
    })

    return order.map((name) => ({
      name,
      value: mapped.get(name) || 0,
    }))
  }, [stats?.wasteDistribution])

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-chart-1',
      bgColor: 'from-chart-1/20 to-chart-1/5',
    },
    {
      title: 'Total Scans',
      value: stats?.totalScans || 0,
      icon: Upload,
      color: 'text-chart-2',
      bgColor: 'from-chart-2/20 to-chart-2/5',
    },
    {
      title: 'Total Detections',
      value: stats?.totalDetections || 0,
      icon: Trash2,
      color: 'text-chart-3',
      bgColor: 'from-chart-3/20 to-chart-3/5',
    },
    {
      title: 'Avg Confidence',
      value: `${stats?.avgConfidence || 0}%`,
      icon: Zap,
      color: 'text-chart-4',
      bgColor: 'from-chart-4/20 to-chart-4/5',
    },
  ]

  if (session?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const fetchAdminData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, analyticsRes, usersRes, scansRes, insightsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/analytics'),
        api.get('/admin/users'),
        api.get('/admin/scans'),
        api.get('/admin/insights')
      ])
      
      setStats(statsRes.data)
      setAnalytics(analyticsRes.data)
      setUsers(usersRes.data)
      setScans(scansRes.data)
      setInsights(insightsRes.data)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
      toast.error('Failed to load admin dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromote = async (id: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin'
      await api.put(`/admin/users/${id}`, { role: newRole })
      toast.success(`User ${currentRole === 'admin' ? 'demoted' : 'promoted'} successfully`)
      fetchAdminData()
    } catch (error) {
      toast.error('Action failed')
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure? This will delete all user data.')) return
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success('User deleted successfully')
      fetchAdminData()
    } catch (error) {
      toast.error('Deletion failed')
    }
  }

  const exportCSV = (data: any[], filename: string) => {
    const csvRows = []
    const headers = Object.keys(data[0])
    csvRows.push(headers.join(','))
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header]
        return `"${val}"`
      })
      csvRows.push(values.join(','))
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('hidden', '')
    a.setAttribute('href', url)
    a.setAttribute('download', filename)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (isLoading && !stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Initializing Admin Engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="Admin Panel" 
          subtitle="Operations, analytics and user management." 
        />
        <div className="flex items-center gap-2 mt-auto mb-4">
          <Button variant="outline" size="sm" className="glass gap-2 border-border/50" onClick={() => exportCSV(users, 'users_report.csv')}>
            <Download className="h-4 w-4" /> Export Users
          </Button>
          <Button size="sm" className="btn-gradient gap-2 text-white border-0" onClick={fetchAdminData}>
            <Activity className="h-4 w-4" /> Refresh Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8" onValueChange={setActiveTab}>
        <TabsList className="glass-card p-1 gap-2 border-border/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-6">Overview</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-6">Users</TabsTrigger>
          <TabsTrigger value="scans" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-6">Scans</TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-6">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-0">
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="glass-card rounded-3xl p-6 border-white/5 relative overflow-hidden group">
                  <div className="flex items-center justify-between relative z-10">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.bgColor} shadow-lg`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="mt-4 relative z-10">
                    <div className="text-3xl font-black text-white capitalize">{stat.value}</div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{stat.title}</p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                    <stat.icon size={120} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Growth Chart */}
            <motion.div className="lg:col-span-2 glass-card rounded-3xl p-8" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">Platform Activity</h3>
                  <p className="text-xs text-muted-foreground font-bold">Last 30 days upload trend</p>
                </div>
                <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10">Active Tracking</Badge>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.uploadsTrend || []}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Area type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Waste Distro */}
            <motion.div className="glass-card rounded-3xl p-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 className="text-xl font-bold mb-8">Waste Distribution</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wasteDistribution}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {wasteDistribution.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-6">
                {wasteDistribution.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="font-bold capitalize">{item.name}</span>
                    </div>
                    <span className="font-mono text-muted-foreground">{item.value} scans</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Smart Insights */}
          <motion.div className="glass-card rounded-3xl p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-6 text-chart-4">
              <Lightbulb className="h-5 w-5" />
              <h3 className="text-xl font-bold">AI Platform Insights</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {insights.map((insight, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                  <div className={`p-2 rounded-xl h-fit ${
                    insight.priority === 'high' ? 'bg-red-500/20 text-red-500' : 
                    insight.priority === 'medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">{insight.text}</p>
                    <Badge variant="outline" className="text-[9px] uppercase mt-2 opacity-50">{insight.type}</Badge>
                  </div>
                </div>
              ))}
              {insights.length === 0 && (
                <p className="text-sm text-muted-foreground italic col-span-3">No critical insights at this time.</p>
              )}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">User Management</h3>
                <p className="text-xs text-muted-foreground">Monitor and manage access controls</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search email..." 
                  className="w-full bg-white/5 border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-8 py-4">User</th>
                    <th className="px-8 py-4 text-center">Status</th>
                    <th className="px-8 py-4 text-center">Uploads</th>
                    <th className="px-8 py-4 text-center">Role</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user._id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/30 to-chart-5/30 flex items-center justify-center font-bold text-xs">
                            {user.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{user.email}</div>
                            <div className="text-[10px] text-muted-foreground">ID: {user._id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <Badge variant="outline" className="text-[9px] uppercase border-emerald-500/50 text-emerald-500">Active</Badge>
                      </td>
                      <td className="px-8 py-5 text-center font-mono font-bold text-sm">{user.uploadCount || 0}</td>
                      <td className="px-8 py-5 text-center">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-[9px] uppercase">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:text-primary"
                            onClick={() => handlePromote(user._id, user.role)}
                            title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          >
                            {user.role === 'admin' ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:text-red-500"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scans" className="mt-0">
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Recent Scans</h3>
                <p className="text-xs text-muted-foreground">Global activity feed</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white">All</Button>
                <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white">Low Conf</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-8 py-4">Scan</th>
                    <th className="px-8 py-4">User</th>
                    <th className="px-8 py-4 text-center">Type</th>
                    <th className="px-8 py-4 text-center">Confidence</th>
                    <th className="px-8 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {scans.map((scan) => {
                    const detections = Array.isArray(scan?.detections) ? scan.detections : []
                    const firstDetection = detections[0] || null

                    return (
                      <tr key={scan._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-5">
                          <div className="h-12 w-16 rounded-lg bg-slate-800 border border-white/5 overflow-hidden">
                            <img 
                              src={buildFileUrl(scan.image)} 
                              className="h-full w-full object-cover opacity-50 hover:opacity-100 transition-opacity" 
                            />
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-bold">{scan.user?.email || 'Anonymous'}</div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <Badge variant="outline" className="capitalize text-[10px]">{firstDetection?.type || 'Unknown'}</Badge>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-xs font-black ${Number(firstDetection?.confidence || 0) < 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                              {Math.round(Number(firstDetection?.confidence || 0))}%
                            </span>
                            <Progress value={Number(firstDetection?.confidence || 0)} className="h-1 w-16 bg-white/5" />
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right font-mono text-[10px] text-muted-foreground">
                          {new Date(scan.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="health" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Core API Server', status: 'Healthy', icon: Server, color: 'text-emerald-500' },
              { name: 'AI Prediction Engine', status: 'Active', icon: Cpu, color: 'text-emerald-500' },
              { name: 'MongoDB Instance', status: 'Connected', icon: HardDrive, color: 'text-chart-4' },
              { name: 'Media Storage', status: 'Online', icon: Zap, color: 'text-emerald-500' },
            ].map((node, i) => (
              <motion.div key={i} className="glass-card rounded-3xl p-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-white/5 ${node.color}`}>
                    <node.icon className="h-5 w-5" />
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h4 className="font-bold text-sm">{node.name}</h4>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">{node.status}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 glass-card rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6">Service Latency (Simulated)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Auth', ms: 120 },
                  { name: 'Upload', ms: 450 },
                  { name: 'Analyze', ms: 1200 },
                  { name: 'History', ms: 85 },
                  { name: 'Report', ms: 210 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px' }} />
                  <Bar dataKey="ms" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
