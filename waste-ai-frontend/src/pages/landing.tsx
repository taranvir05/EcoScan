import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Scan,
  BarChart3,
  Bell,
  LayoutDashboard,
  Leaf,
  Recycle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

const features = [
  {
    icon: Scan,
    title: 'AI Waste Detection',
    description: 'Instant category prediction with confidence analysis.',
    color: 'text-chart-1',
    bgColor: 'bg-chart-1/10',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    description: 'Comprehensive insights with charts showing waste distribution and trends.',
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Get notified about critical environmental insights and high-risk waste types.',
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
  },

  {
    icon: LayoutDashboard,
    title: 'Unified Dashboard',
    description: 'Track all your uploads, history, and environmental impact in one place.',
    color: 'text-chart-1',
    bgColor: 'bg-chart-1/10',
  },
  {
    icon: Recycle,
    title: 'Disposal Guide',
    description: 'Receive specific recycling instructions and disposal recommendations.',
    color: 'text-chart-5',
    bgColor: 'bg-chart-5/10',
  },
]

const stats = [
  { value: 'AI-Powered', label: 'Waste Detection', icon: Sparkles },
  { value: 'Real-time', label: 'Sustainability Insights', icon: LayoutDashboard },
  { value: 'Full-Stack', label: 'Modern Architecture', icon: BarChart3 },
  { value: 'Smart', label: 'Recycling Recommendations', icon: Recycle },
]

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <motion.div 
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-5 shadow-lg shadow-primary/25"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Leaf className="h-5 w-5 text-white" />
            </motion.div>
            <span className="text-xl font-semibold tracking-tight">EcoScan</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild className="btn-gradient border-0 text-white">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div 
            className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-chart-2/20 blur-[100px]"
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div 
            className="absolute top-1/2 right-1/3 h-[300px] w-[300px] rounded-full bg-chart-4/20 blur-[90px]"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <motion.div 
              className="mb-6 inline-flex items-center gap-2 rounded-full glass-subtle px-4 py-2 text-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-foreground/80">Built using MERN + YOLOv11 + Flask</span>
            </motion.div>
            
            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              AI-Powered Waste Detection &{' '}
              <span className="gradient-text">Environmental Insights</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              Upload images of waste and let our AI identify, categorize, and provide 
              actionable recycling recommendations. Make smarter environmental decisions.
            </p>
            
            <motion.div 
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button size="lg" className="btn-gradient gap-2 border-0 px-8 text-white shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02]" asChild>
                <Link to="/upload">
                  Try Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="glass-subtle border-border/50 transition-transform hover:scale-[1.02]" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Premium Presentation Cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                variants={fadeInUp}
                className="glass-card flex flex-col items-center justify-center rounded-3xl p-8 text-center transition-shadow hover:shadow-xl hover:shadow-primary/5"
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-transparent text-primary">
                  <stat.icon className="h-7 w-7" />
                </div>
                <div className="text-xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground opacity-70">
              Built with React, Node.js, MongoDB, Flask &amp; YOLOv11
            </p>
          </motion.div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl glass-card p-1"
          >
            <div className="rounded-[22px] bg-gradient-to-br from-muted/80 to-muted/40 p-6 sm:p-10">
              <div className="flex h-full flex-col gap-4 sm:flex-row">
                {/* Image Panel */}
                <motion.div 
                  className="flex-1 overflow-hidden rounded-2xl glass-card p-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-warning/60" />
                    <div className="h-3 w-3 rounded-full bg-success/60" />
                  </div>
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-muted to-muted/50">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Scan className="h-16 w-16 text-muted-foreground/20" />
                    </div>
                    {/* Animated scanning element removed as it is a multi-object detector */}
                  </div>
                </motion.div>
                
                {/* Results Panel */}
                <motion.div 
                  className="flex-1 overflow-hidden rounded-2xl glass-card p-4"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="mb-4 text-sm font-medium">Detection Results</div>
                  <div className="space-y-3">
                    {[
                      { name: 'Plastic Bottle', confidence: 95, color: 'bg-chart-1' },
                      { name: 'Cardboard', confidence: 89, color: 'bg-chart-2' },
                      { name: 'Metal Can', confidence: 92, color: 'bg-chart-3' },
                    ].map((item, i) => (
                      <motion.div 
                        key={i} 
                        className="flex items-center gap-3 rounded-xl bg-background/50 p-3"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{item.name}</span>
                        <div className="ml-auto flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <motion.div 
                              className={`h-full ${item.color}`}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${item.confidence}%` }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{item.confidence}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for{' '}
              <span className="gradient-text">waste management</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Our platform combines cutting-edge AI with intuitive tools to help you 
              understand and reduce environmental impact.
            </p>
          </motion.div>

          <motion.div 
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
              >
                <div className="group h-full glass-card rounded-2xl p-6 transition-all hover:shadow-lg">
                  <motion.div 
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgColor} ${feature.color} transition-all group-hover:scale-110`}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <feature.icon className="h-6 w-6" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-chart-5 px-8 py-16 text-center sm:px-16"
          >
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="absolute top-10 left-10 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-10 right-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            
            <motion.h2 
              className="relative text-3xl font-bold text-white sm:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Start Using EcoScan
            </motion.h2>
            <motion.p 
              className="relative mx-auto mt-4 max-w-xl text-white/80"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Built for sustainable waste awareness with modern MERN + AI architecture.
            </motion.p>
            <motion.div 
              className="relative mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                size="lg" 
                className="gap-2 bg-white text-primary hover:bg-white/90 shadow-xl" 
                asChild
              >
                <Link to="/upload">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-5">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">EcoScan</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">About</a>
              <a href="#" className="transition-colors hover:text-foreground">Features</a>
              <a href="#" className="transition-colors hover:text-foreground">Pricing</a>
              <a href="#" className="transition-colors hover:text-foreground">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 EcoScan. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
