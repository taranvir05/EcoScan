import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Upload, Trash2, Shield, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/context/auth-context'
import { getAdminStats } from '@/services/api'

type RecentUpload = {
  _id: string
  userEmail: string
  image: string
  totalDetections: number
  createdAt: string
}

type AdminStats = {
  totalUsers: number
  totalUploads: number
  totalDetections: number
  recentUploads: RecentUpload[]
}

const BASE_URL = 'http://localhost:5000'

export default function AdminDashboardPage() {
  const { session } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.role !== 'admin') return

    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAdminStats()
        setStats(data)
      } catch {
        setError('Failed to load admin analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [session?.role])

  const kpis = useMemo(
    () => [
      { title: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users },
      { title: 'Total Uploads', value: stats?.totalUploads ?? 0, icon: Upload },
      { title: 'Total Detections', value: stats?.totalDetections ?? 0, icon: Trash2 },
    ],
    [stats]
  )

  if (session?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="p-6">
      <motion.div
        className="mb-6 flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-chart-3/20 to-chart-3/5">
          <Shield className="h-5 w-5 text-chart-3" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform analytics and recent activity</p>
        </div>
      </motion.div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((item) => (
          <Card key={item.title} className="glass-card border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-3xl font-bold">{item.value.toLocaleString()}</div>
                )}
                <item.icon className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card mt-6 border-border/40">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Email</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Detection Count</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats?.recentUploads || []).map((upload) => (
                    <TableRow key={upload._id}>
                      <TableCell>{upload.userEmail}</TableCell>
                      <TableCell>
                        <div className="h-12 w-16 overflow-hidden rounded-md bg-muted">
                          {upload.image ? (
                            <img
                              src={`${BASE_URL}${upload.image}`}
                              alt="upload"
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{upload.totalDetections}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(upload.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && (stats?.recentUploads?.length || 0) === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No recent uploads found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
