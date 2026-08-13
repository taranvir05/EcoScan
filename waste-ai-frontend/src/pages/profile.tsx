import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Settings, 
  Shield, 
  Award, 
  History, 
  Edit3, 
  Mail, 
  Calendar, 
  BadgeCheck,
  Loader2,
  Camera
} from 'lucide-react'
import { toast } from 'sonner'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { ProfilePreferences } from '@/components/profile/ProfilePreferences'
import { ProfileSecurity } from '@/components/profile/ProfileSecurity'
import { ProfileAchievements } from '@/components/profile/ProfileAchievements'
import { ProfileActivity } from '@/components/profile/ProfileActivity'

const BASE_URL = 'http://localhost:5000'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const token = localStorage.getItem('ecoscan_token')
    if (!token) return

    try {
      const [userRes, statsRes, activityRes] = await Promise.all([
        fetch(`${BASE_URL}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/api/users/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/api/users/activity`, { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)
        // Apply theme preference from user data
        if (userData.themePreference) {
          document.documentElement.classList.toggle('dark', userData.themePreference === 'Dark')
        }
      }
      if (statsRes.ok) setStats(await statsRes.json())
      if (activityRes.ok) setActivity(await activityRes.json())
    } catch (err) {
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdateProfile = async (data: any) => {
    const token = localStorage.getItem('ecoscan_token')
    const res = await fetch(`${BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Update failed')
    const updated = await res.json()
    setUser(updated.user)
    
    if (data.themePreference) {
      document.documentElement.classList.toggle('dark', data.themePreference === 'Dark')
    }
  }

  const handleUpdatePassword = async (data: any) => {
    const token = localStorage.getItem('ecoscan_token')
    const res = await fetch(`${BASE_URL}/api/users/password`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Password update failed')
  }

  const handleExportData = async () => {
    const token = localStorage.getItem('ecoscan_token')
    try {
      const res = await fetch(`${BASE_URL}/api/users/export`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ecoscan_data_${user?.email}.json`
      a.click()
      toast.success('Data exported successfully!')
    } catch (err) {
      toast.error('Export failed')
    }
  }

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('ecoscan_token')
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      localStorage.removeItem('ecoscan_token')
      window.location.href = '/login'
    } else {
      toast.error('Failed to delete account')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleEditIdentity = () => {
    const tabsList = document.querySelector('[role="tablist"]')
    const settingsTab = tabsList?.querySelector('[value="settings"]') as HTMLElement
    settingsTab?.click()
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative h-64 w-full bg-gradient-to-br from-primary/20 via-primary/5 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-6 -mt-32 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[2.5rem] p-8 shadow-2xl border-border/50 bg-background/40 backdrop-blur-3xl mb-10"
        >
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative group">
                <div className={`h-32 w-32 rounded-3xl ${user?.avatarColor || 'bg-primary'} flex items-center justify-center text-white text-5xl font-black shadow-2xl transition-transform duration-500 group-hover:scale-105`}>
                  {user?.name?.[0] || user?.email?.[0].toUpperCase()}
                </div>
                <button 
                  onClick={handleEditIdentity}
                  className="absolute -bottom-2 -right-2 h-10 w-10 bg-background border border-border shadow-xl rounded-xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              <div className="text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl font-black tracking-tight">{user?.name || 'User Profile'}</h1>
                  {user?.role === 'admin' && (
                    <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                      <BadgeCheck className="h-3 w-3" /> Admin Access Enabled
                    </span>
                  )}
                  {stats?.ecoScore > 50 && (
                    <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                      <Award className="h-3 w-3" /> Top Contributor
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground text-sm font-medium">
                  <button 
                    onClick={() => copyToClipboard(user?.email)}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
                    title="Click to copy email"
                  >
                    <Mail className="h-4 w-4" /> {user?.email}
                  </button>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Joined {new Date(user?.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-auto flex gap-4">
               <Button 
                 onClick={handleEditIdentity}
                 className="flex-1 lg:flex-none glass-subtle border-border/50 text-foreground gap-2 font-bold px-6"
               >
                 <Edit3 className="h-4 w-4" /> Edit Identity
               </Button>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-muted/30 p-1.5 rounded-2xl border border-border/50 w-full lg:w-fit overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="rounded-xl px-6 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold">
              <User className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl px-6 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl px-6 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold">
              <Shield className="h-4 w-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-xl px-6 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold">
              <Award className="h-4 w-4" /> Achievements
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-xl px-6 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold">
              <History className="h-4 w-4" /> Activity
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="overview" className="m-0 outline-none">
              {stats && <ProfileStats stats={stats} onRefresh={fetchData} />}
            </TabsContent>
            
            <TabsContent value="settings" className="m-0 outline-none">
              <ProfilePreferences user={user} onUpdate={handleUpdateProfile} />
            </TabsContent>

            <TabsContent value="security" className="m-0 outline-none">
              <ProfileSecurity 
                user={user} 
                onUpdatePassword={handleUpdatePassword} 
                onExportData={handleExportData}
                onDeleteAccount={handleDeleteAccount}
              />
            </TabsContent>

            <TabsContent value="achievements" className="m-0 outline-none">
              <ProfileAchievements scanCount={stats?.totalScans || 0} />
            </TabsContent>

            <TabsContent value="activity" className="m-0 outline-none">
              <ProfileActivity activity={activity} />
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  )
}
