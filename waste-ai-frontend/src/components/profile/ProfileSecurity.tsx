import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Lock, Eye, EyeOff, LogOut, Trash2, Download, History, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProfileSecurityProps {
  user: any
  onUpdatePassword: (data: any) => Promise<void>
  onExportData: () => Promise<void>
  onDeleteAccount: () => Promise<void>
}

export function ProfileSecurity({ user, onUpdatePassword, onExportData, onDeleteAccount }: ProfileSecurityProps) {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await onUpdatePassword({ currentPassword: passwords.current, newPassword: passwords.new })
      toast.success('Password updated successfully')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (err) {
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Password Management */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 shadow-xl border-border/50"
      >
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Change Password
        </h3>
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Current Password</Label>
            <div className="relative">
              <Input 
                type={showPass ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                className="glass-input pl-10" 
                required
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
              <Input 
                type={showPass ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                className="glass-input" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm New</Label>
              <Input 
                type={showPass ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                className="glass-input" 
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4">
             <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPass(!showPass)}
                className="text-xs opacity-50"
             >
                {showPass ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPass ? 'Hide' : 'Show'} Passwords
             </Button>
             <Button type="submit" className="btn-gradient border-0 text-white" disabled={loading}>
                Update Security
             </Button>
          </div>
        </form>
      </motion.div>

      {/* Security Status & Sessions */}
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-3xl p-8 shadow-xl border-border/50"
        >
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Security Status
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
               <div className="flex gap-3 items-center">
                 <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                   <Monitor className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-sm font-bold">Current Session</p>
                   <p className="text-[10px] text-muted-foreground uppercase font-black">Active Now • This Device</p>
                 </div>
               </div>
               <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full">Secure</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 opacity-50">
               <div className="flex gap-3 items-center">
                 <div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center">
                   <History className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-sm font-bold">Last Login</p>
                   <p className="text-[10px] text-muted-foreground uppercase font-black">{new Date(user.lastLogin).toLocaleString()}</p>
                 </div>
               </div>
            </div>
          </div>
          <Button 
            onClick={() => toast.success('All other sessions have been logged out')}
            variant="outline" 
            className="w-full mt-6 glass-subtle border-border/50 text-xs py-2 h-fit"
          >
             <LogOut className="h-3 w-3 mr-2" /> Logout all other sessions
          </Button>
        </motion.div>

        {/* Data Control */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 shadow-xl border-border/50 bg-red-500/5 border-red-500/10"
        >
           <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-red-500 opacity-50">Danger Zone</h3>
           <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start glass-subtle border-border/50"
                onClick={onExportData}
              >
                 <Download className="h-4 w-4 mr-3" /> Export My Data (JSON)
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-0">
                    <Trash2 className="h-4 w-4 mr-3" /> Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-card border-border/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="glass-subtle">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDeleteAccount} className="bg-red-500 text-white hover:bg-red-600">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
           </div>
        </motion.div>
      </div>
    </div>
  )
}
