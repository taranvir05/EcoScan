import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, RotateCcw, User, Mail, Globe, Layout, Palette, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'

interface ProfilePreferencesProps {
  user: any
  onUpdate: (data: any) => Promise<void>
}

export function ProfilePreferences({ user, onUpdate }: ProfilePreferencesProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    language: user.language || 'English',
    preferredDashboard: user.preferredDashboard || 'Default',
    layoutDensity: user.layoutDensity || 'Spacious',
    themePreference: user.themePreference || 'Dark',
    avatarColor: user.avatarColor || 'bg-primary',
    notifications: user.notifications || { email: true, push: true }
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await onUpdate(formData)
      toast.success('Preferences updated successfully!')
    } catch (err) {
      toast.error('Failed to update preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Account Details */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-2 space-y-6"
      >
        <div className="glass-card rounded-3xl p-8 shadow-xl border-border/50">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Account Information
          </h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
              <div className="relative">
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="glass-input pl-10" 
                  placeholder="Enter your name" 
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="glass-input pl-10" 
                  placeholder="name@example.com" 
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Preferred Language</Label>
              <Select value={formData.language} onValueChange={(val) => setFormData({...formData, language: val})}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/50">
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Default Dashboard</Label>
              <Select value={formData.preferredDashboard} onValueChange={(val) => setFormData({...formData, preferredDashboard: val})}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select Layout" />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/50">
                  <SelectItem value="Default">Default View</SelectItem>
                  <SelectItem value="Compact">Compact View</SelectItem>
                  <SelectItem value="Analytics">Analytics Focused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-xl border-border/50">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Appearance & UI
          </h3>
          
          <div className="grid gap-8 md:grid-cols-2">
             <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Layout className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Layout Density</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Spacious / Compact</p>
                  </div>
                </div>
                <Select value={formData.layoutDensity} onValueChange={(val) => setFormData({...formData, layoutDensity: val})}>
                  <SelectTrigger className="w-32 glass-subtle h-8 text-xs border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50">
                    <SelectItem value="Spacious">Spacious</SelectItem>
                    <SelectItem value="Compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-xl bg-chart-4/10 flex items-center justify-center text-chart-4">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Theme Mode</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">System Default</p>
                  </div>
                </div>
                <Select value={formData.themePreference} onValueChange={(val) => setFormData({...formData, themePreference: val})}>
                  <SelectTrigger className="w-32 glass-subtle h-8 text-xs border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50">
                    <SelectItem value="Light">Light</SelectItem>
                    <SelectItem value="Dark">Dark</SelectItem>
                    <SelectItem value="System">System</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
           <Button variant="outline" className="glass-subtle border-border/50" onClick={() => window.location.reload()}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
           </Button>
           <Button className="btn-gradient border-0 text-white shadow-lg" onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" /> {loading ? 'Saving...' : 'Save Changes'}
           </Button>
        </div>
      </motion.div>

      {/* Sidebar Settings */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <div className="glass-card rounded-3xl p-8 shadow-xl border-border/50">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Email Alerts</p>
                <p className="text-[10px] text-muted-foreground">New scan reports & weekly digests</p>
              </div>
              <Switch 
                checked={formData.notifications.email} 
                onCheckedChange={(val) => setFormData({...formData, notifications: {...formData.notifications, email: val}})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Push Notifications</p>
                <p className="text-[10px] text-muted-foreground">Real-time AI analysis updates</p>
              </div>
              <Switch 
                checked={formData.notifications.push} 
                onCheckedChange={(val) => setFormData({...formData, notifications: {...formData.notifications, push: val}})}
              />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-xl border-border/50 bg-primary/5">
           <h3 className="text-sm font-black uppercase tracking-widest mb-4 opacity-50">Platform Identity</h3>
           <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Choose your avatar accent color to personalize your profile globally.</p>
              <div className="flex flex-wrap gap-3">
                 {['bg-primary', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'].map(color => (
                    <button 
                      key={color}
                      onClick={() => setFormData({...formData, avatarColor: color})}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${color} ${formData.avatarColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50'}`} 
                    />
                 ))}
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  )
}
