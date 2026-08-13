import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Grid,
  List,
  Calendar,
  Trash2,
  ArrowRight,
  Image as ImageIcon,
  Filter,
  FolderOpen,
} from 'lucide-react'
import { API_BASE_URL as BASE_URL, buildFileUrl as buildImageUrl } from '@/lib/config'

type HistoryResult = {
  _id: string
  image: string
  detections: Array<{ type: string; confidence: number }>
  totalDetections: number
  createdAt: string
}


const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Plastic: 'bg-chart-1/10 text-chart-1 border-chart-1/30',
    Glass: 'bg-chart-2/10 text-chart-2 border-chart-2/30',
    Paper: 'bg-chart-3/10 text-chart-3 border-chart-3/30',
    Cardboard: 'bg-chart-4/10 text-chart-4 border-chart-4/30',
    Metal: 'bg-chart-5/10 text-chart-5 border-chart-5/30',
  }
  return colors[category] || 'bg-muted text-muted-foreground'
}

export default function HistoryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [results, setResults] = useState<HistoryResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('ecoscan_token')
      if (!token) {
        setError('Please login to view history')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${BASE_URL}/api/results/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load history')
        }

        const data = await response.json()
        setResults(Array.isArray(data) ? data : [])
      } catch (fetchError) {
        setError('Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const filteredUploads = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const mapped = results.map((result) => ({
      id: result._id,
      image: result.image,
      detections: result.totalDetections ?? result.detections?.length ?? 0,
      categories: Array.from(
        new Set((result.detections || []).map((detection) => detection.type))
      ),
      createdAt: result.createdAt,
    }))

    const searched = normalizedQuery
      ? mapped.filter((upload) =>
          upload.categories.join(' ').toLowerCase().includes(normalizedQuery)
        )
      : mapped

    return searched.sort((a, b) => {
      if (sortBy === 'detections') return b.detections - a.detections
      if (sortBy === 'name') {
        const aName = a.categories[0] || 'unknown'
        const bName = b.categories[0] || 'unknown'
        return aName.localeCompare(bName)
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [results, searchQuery, sortBy])

  const renderSkeletonCards = () =>
    Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="glass-card overflow-hidden rounded-2xl">
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="space-y-2 p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>
    ))

  return (
    <div className="p-6">
      <PageHeader 
        title="Upload History" 
        subtitle="Browse and manage your previous waste detection analyses."  
      />

      {/* Filters */}
      <motion.div 
        className="glass-card mb-6 rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search uploads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] bg-background/50">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="detections">Detections</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex overflow-hidden rounded-xl border border-border/50 bg-background/50">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-none"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {renderSkeletonCards()}
          </motion.div>
        )}

        {!loading && viewMode === 'grid' && (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredUploads.map((upload, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Link to={`/results/${upload.id}`}>
                  <div className="glass-card group cursor-pointer rounded-2xl transition-all hover:shadow-xl">
                    <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-gradient-to-br from-muted to-muted/50">
                      {upload.image ? (
                        <img
                          src={buildImageUrl(upload.image)}
                          alt="History thumbnail"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary/0 transition-colors group-hover:bg-primary/5" />
                      <div className="absolute right-2 top-2">
                        <Badge className="glass border-0 text-foreground">
                          {upload.detections} {upload.detections === 1 ? 'detection' : 'detections'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                        {upload.categories[0] || 'Waste analysis'}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {upload.categories.slice(0, 3).map((category) => (
                          <Badge
                            key={category}
                            variant="outline"
                            className={`text-xs ${getCategoryColor(category)}`}
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Table View */}
        {!loading && viewMode === 'table' && (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="glass-card overflow-hidden rounded-2xl">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Detections</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUploads.map((upload, index) => (
                    <motion.tr
                      key={upload.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="group border-border/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-muted/50">
                            {upload.image ? (
                              <img
                                src={buildImageUrl(upload.image)}
                                alt="History thumbnail"
                                className="h-full w-full rounded-xl object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="group-hover:text-primary transition-colors">
                            {upload.categories[0] || 'Waste analysis'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(upload.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {upload.detections}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {upload.categories.slice(0, 2).map((category) => (
                            <Badge
                              key={category}
                              variant="outline"
                              className={`text-xs ${getCategoryColor(category)}`}
                            >
                              {category}
                            </Badge>
                          ))}
                          {upload.categories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{upload.categories.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button variant="ghost" size="sm" className="gap-1" asChild>
                              <Link to={`/results/${upload.id}`}>
                                View
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </motion.div>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!loading && filteredUploads.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="glass-card rounded-2xl">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No history found yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload your first image to start detecting waste.
              </p>
              <Button 
                variant="outline" 
                className="mt-4 glass-subtle border-border/50"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
