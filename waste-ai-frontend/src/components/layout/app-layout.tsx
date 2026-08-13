import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  LayoutDashboard,
  Upload,
  FileSearch,
  History,
  Shield,
  User,
  Bell,
  Leaf,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronRight,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'text-chart-1' },
  { name: 'Upload', href: '/upload', icon: Upload, color: 'text-chart-1' },
  { name: 'Results', href: '/results', icon: FileSearch, color: 'text-chart-2' },
  { name: 'History', href: '/history', icon: History, color: 'text-chart-5' },
]

const adminNavigation = [
  { name: 'Admin', href: '/admin', icon: Shield, color: 'text-chart-3' },
]

const bottomNavigation = [
  { name: 'Profile', href: '/profile', icon: User, color: 'text-muted-foreground' },
]

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { session, logout } = useAuth()
  const isAdmin = true // Simulated admin role
  const initials = session?.email?.slice(0, 2).toUpperCase() || 'US'

  const currentPage = [...navigation, ...adminNavigation, ...bottomNavigation].find(
    (item) => item.href === location.pathname || location.pathname.startsWith(item.href + '/')
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col glass transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border/50 px-6">
          <motion.div 
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-5 shadow-lg shadow-primary/25"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Leaf className="h-5 w-5 text-white" />
          </motion.div>
          <span className="text-xl font-semibold tracking-tight">
            EcoScan
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="group relative block"
                >
                  <motion.div
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-xl bg-primary/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <item.icon className={cn(
                      "h-5 w-5 shrink-0 relative z-10 transition-colors",
                      isActive ? item.color : "group-hover:text-foreground"
                    )} />
                    <span className="relative z-10">{item.name}</span>
                  </motion.div>
                </NavLink>
              )
            })}
          </div>

          {isAdmin && (
            <div className="mt-6">
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                Admin
              </div>
              {adminNavigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="group relative block"
                  >
                    <motion.div
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-xl bg-primary/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0 relative z-10 transition-colors",
                        isActive ? item.color : "group-hover:text-foreground"
                      )} />
                      <span className="relative z-10">{item.name}</span>
                    </motion.div>
                  </NavLink>
                )
              })}
            </div>
          )}
        </nav>

        {/* Bottom navigation */}
        <div className="border-t border-border/50 p-4">
          {bottomNavigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className="group relative block"
              >
                <motion.div
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-xl bg-primary/10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className="h-5 w-5 shrink-0 relative z-10" />
                  <span className="relative z-10">{item.name}</span>
                </motion.div>
              </NavLink>
            )
          })}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 glass border-b border-border/50 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="hidden items-center gap-2 text-sm sm:flex">
            <span className="text-muted-foreground">Home</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="font-medium">{currentPage?.name || 'Page'}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                      <AvatarImage src="/avatar.jpg" alt="User" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-chart-5 text-white font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{session?.email || 'EcoScan User'}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {session?.email || 'user@ecoscan.ai'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content with transitions */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}
              transition={pageTransition.transition}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
