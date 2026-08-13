import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import LandingPage from '@/pages/landing'
import AppLayout from '@/components/layout/app-layout'
import ProtectedRoute from '@/components/auth/protected-route'
import DashboardPage from '@/pages/dashboard'
import UploadPage from '@/pages/upload'
import ResultsPage from '@/pages/results'
import HistoryPage from '@/pages/history'

import AdminPage from '@/pages/admin'
import ProfilePage from '@/pages/profile'
import LoginPage from '@/pages/login'
import SignupPage from '@/pages/signup'

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ecoscan-theme">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/results/:id" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />

            <Route path="/admin" element={<AdminPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </ThemeProvider>
  )
}
