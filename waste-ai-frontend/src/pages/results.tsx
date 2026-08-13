import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { generatePDFReport, shareContent } from '@/lib/pdf-export'
import { PageHeader } from '@/components/PageHeader'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import {
  Package,
  Trash2,
  Download,
  Share2,
  Calendar,
  CheckCircle2,
  Loader2,
  Zap,
  BarChart3,
  Scan,
  Maximize2,
  X,
  Image as ImageIcon,
  Cpu,
  Target,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FlaskConical,
  ShieldCheck,
  TrendingUp,
  CircleDot,
  Info,
  ChevronRight,
  Sparkles,
  Layers,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type ApiDetection = {
  type?: string
  label?: string
  confidence: number
  bbox?: {
    x1?: number
    y1?: number
    x2?: number
    y2?: number
  }
}

type ApiResult = {
  image: string
  annotated_image?: string
  annotatedImage?: string
  detections: ApiDetection[]
  totalDetections: number
  createdAt?: string
}

type CategoryData = {
  label: string
  color: string
  bgColor: string
  barColor: string
  hexColor: string
  icon: any
}

// ─── Category Map (UI Color Themes Only) ─────────────────────────────────────
const CATEGORY_MAP: Record<string, CategoryData> = {
  plastic: {
    label: 'Plastic',
    color: 'text-chart-1',
    bgColor: 'bg-chart-1/10',
    barColor: 'bg-chart-1',
    hexColor: 'var(--chart-1)',
    icon: FlaskConical,
  },
  metal: {
    label: 'Metal',
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
    barColor: 'bg-chart-2',
    hexColor: 'var(--chart-2)',
    icon: Zap,
  },
  paper: {
    label: 'Paper',
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
    barColor: 'bg-chart-3',
    hexColor: 'var(--chart-3)',
    icon: Package,
  },
  glass: {
    label: 'Glass',
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
    barColor: 'bg-chart-4',
    hexColor: 'var(--chart-4)',
    icon: Target,
  },
  cardboard: {
    label: 'Cardboard',
    color: 'text-chart-5',
    bgColor: 'bg-chart-5/10',
    barColor: 'bg-chart-5',
    hexColor: 'var(--chart-5)',
    icon: Target,
  },
  trash: {
    label: 'General Trash',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    barColor: 'bg-destructive',
    hexColor: 'var(--destructive)',
    icon: Trash2,
  },
}

// ─── Animation Presets ────────────────────────────────────────────────────────
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const containerVariants = staggerContainer
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 20 } },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:5000'
const buildImageUrl = (p?: string) => {
  if (!p) return ''
  return `${BASE_URL}/${p.replace(/\\/g, '/').replace(/^\/+/, '')}`
}
const getDetectionLabel = (d?: ApiDetection | null) => d?.label || d?.type || 'Unknown'
const normalizeCategoryKey = (v?: string) => (v ?? '').trim().toLowerCase()
const getCategoryTheme = (label: string) => CATEGORY_MAP[normalizeCategoryKey(label)] ?? CATEGORY_MAP.trash

// ─── Animated SVG Confidence Ring ─────────────────────────────────────────────
function ConfidenceRing({ value, size = 130, stroke = 8 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  const cx = size / 2
  const cy = size / 2

  const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor"
          strokeWidth={stroke} className="text-muted/20" />
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black leading-none">{value}%</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Avg Confidence</span>
      </div>
    </div>
  )
}

// ─── Lightbox Component ───────────────────────────────────────────────────────
interface LightboxProps {
  src: string;
  onClose: () => void;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  pos: { x: number; y: number };
  setPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  lightboxImgSize: { width: number; height: number; naturalWidth: number; naturalHeight: number };
  setLightboxImgSize: React.Dispatch<React.SetStateAction<{ width: number; height: number; naturalWidth: number; naturalHeight: number }>>;
  selectedBoxIndex: number | null;
  setSelectedBoxIndex: (idx: number | null) => void;
  normalizedDetections: any[];
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
  handleBoxClick: (idx: number) => void;
}

function Lightbox({
  src,
  onClose,
  scale,
  setScale,
  pos,
  setPos,
  lightboxImgSize,
  setLightboxImgSize,
  selectedBoxIndex,
  setSelectedBoxIndex,
  normalizedDetections,
  hoveredIndex,
  setHoveredIndex,
  handleBoxClick,
}: LightboxProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const posRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setScale(prev => Math.min(5, Math.max(0.5, prev - e.deltaY * 0.002)))
  }, [setScale])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const newPos = { x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }
    posRef.current = newPos
    setPos(newPos)
  }, [isDragging, setPos])

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  const reset = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
    posRef.current = { x: 0, y: 0 };
    setSelectedBoxIndex(null);
  }

  const handleLightboxImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    setLightboxImgSize({
      width: target.clientWidth,
      height: target.clientHeight,
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onWheel={handleWheel}
    >
      {/* Controls toolbar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10 flex-wrap justify-end">
        {selectedBoxIndex !== null && normalizedDetections[selectedBoxIndex] && (
          <div className="flex items-center gap-3 bg-black/50 px-4 py-2 rounded-xl border border-white/10 text-white text-xs font-semibold backdrop-blur-md">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-black">
              #{selectedBoxIndex + 1}
            </span>
            <span className="font-bold capitalize" style={{ color: getCategoryTheme(normalizedDetections[selectedBoxIndex].label).hexColor }}>
              {normalizedDetections[selectedBoxIndex].label}
            </span>
            <span className="opacity-80">
              {normalizedDetections[selectedBoxIndex].confidence.toFixed(1)}%
            </span>
            {normalizedDetections[selectedBoxIndex].bbox && (
              <span className="font-mono opacity-60 text-[10px]">
                [{normalizedDetections[selectedBoxIndex].bbox.x1}, {normalizedDetections[selectedBoxIndex].bbox.y1}, {normalizedDetections[selectedBoxIndex].bbox.x2}, {normalizedDetections[selectedBoxIndex].bbox.y2}]
              </span>
            )}
          </div>
        )}
        
        <button onClick={reset}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"
          title="Reset zoom">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button onClick={() => setScale(s => Math.min(5, s + 0.5))}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"
          title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.5))}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"
          title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-red-500/80 transition-colors border border-white/10"
          title="Close (ESC)">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-xs font-bold text-white/70 backdrop-blur-md">
        {Math.round(scale * 100)}% — scroll to zoom · drag to pan · click boxes to select
      </div>

      {/* Zoomable image container */}
      <motion.div
        style={{
          scale,
          x: pos.x,
          y: pos.y,
          cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default',
        }}
        animate={{ scale, x: pos.x, y: pos.y }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative inline-block select-none"
      >
        <img
          src={src}
          alt="Detection result fullscreen"
          onLoad={handleLightboxImageLoad}
          className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain select-none pointer-events-none"
          draggable={false}
        />

        {/* Fullscreen Interactive Bounding Boxes */}
        {lightboxImgSize.naturalWidth > 1 && (
          <div className="absolute inset-0 pointer-events-none">
            {normalizedDetections.map((item, idx) => {
              if (!item.bbox) return null;
              const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = item.bbox;
              const left = (x1 / lightboxImgSize.naturalWidth) * 100;
              const top = (y1 / lightboxImgSize.naturalHeight) * 100;
              const width = ((x2 - x1) / lightboxImgSize.naturalWidth) * 100;
              const height = ((y2 - y1) / lightboxImgSize.naturalHeight) * 100;
              
              const theme = getCategoryTheme(item.label);
              const isSelected = selectedBoxIndex === idx;
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={idx}
                  className="absolute border-2 pointer-events-auto cursor-pointer transition-all duration-200"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                    borderColor: isSelected || isHovered ? theme.hexColor : `${theme.hexColor}aa`,
                    borderWidth: isSelected || isHovered ? '3.5px' : '1.5px',
                    boxShadow: isSelected || isHovered ? `0 0 16px ${theme.hexColor}` : 'none',
                    opacity: selectedBoxIndex !== null ? (isSelected ? 1.0 : 0.2) : (hoveredIndex !== null ? (isHovered ? 1.0 : 0.2) : 0.8),
                    backgroundColor: isSelected || isHovered ? `${theme.hexColor}15` : 'transparent',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBoxClick(idx);
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')
  const [result, setResult] = useState<ApiResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Interactive states
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number | null>(null)
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Lightbox view state held at parent level to animate zoom/center
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [lightboxImgSize, setLightboxImgSize] = useState({ width: 0, height: 0, naturalWidth: 1, naturalHeight: 1 })
  const [mainImgSize, setMainImgSize] = useState({ width: 0, height: 0, naturalWidth: 1, naturalHeight: 1 })

  const loadingMessages = [
    'Initializing YOLO11 AI detector...',
    'Processing image tensors...',
    'Extracting object bounding boxes...',
    'Computing class confidence distribution...',
    'Finalizing detection report...',
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => prev < loadingMessages.length - 1 ? prev + 1 : prev)
      }, 800)
    }
    return () => clearInterval(interval)
  }, [loading])

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) { setError('No result ID provided'); setLoading(false); return }
      const token = localStorage.getItem('ecoscan_token')
      if (!token) { setError('Please login to view results'); setLoading(false); return }
      try {
        setLoading(true); setError(null)
        const response = await fetch(`${BASE_URL}/api/results/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error('Failed to load results')
        const data: ApiResult = await response.json()
        setTimeout(() => { setResult(data); setLoading(false) }, 1500)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load results')
        setLoading(false)
      }
    }
    fetchResult()
  }, [id])

  // Center & zoom calculations for selected boxes in the Lightbox
  useEffect(() => {
    if (selectedBoxIndex === null || lightboxImgSize.naturalWidth === 1) return;
    const item = result?.detections[selectedBoxIndex];
    if (!item || !item.bbox) return;

    const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = item.bbox;
    const boxCenterX = (x1 + x2) / 2;
    const boxCenterY = (y1 + y2) / 2;
    const imgCenterX = lightboxImgSize.naturalWidth / 2;
    const imgCenterY = lightboxImgSize.naturalHeight / 2;

    const boxW = x2 - x1;
    const boxH = y2 - y1;

    const scaleX = lightboxImgSize.width / lightboxImgSize.naturalWidth;
    const scaleY = lightboxImgSize.height / lightboxImgSize.naturalHeight;

    const renderedBoxW = boxW * scaleX;
    const renderedBoxH = boxH * scaleY;

    // Zoom level calculation (target box fills ~45% of the viewport dimensions)
    const targetZoom = Math.min(4.5, Math.max(1.8, Math.min(window.innerWidth / renderedBoxW, window.innerHeight / renderedBoxH) * 0.45));

    const dx = - (boxCenterX - imgCenterX) * scaleX * targetZoom;
    const dy = - (boxCenterY - imgCenterY) * scaleY * targetZoom;

    setScale(targetZoom);
    setPos({ x: dx, y: dy });
  }, [selectedBoxIndex, lightboxImgSize, result]);

  // ─── Derived data (must be before any early returns — Rules of Hooks) ────────
  const normalizedDetections = useMemo(() => {
    return (result?.detections ?? []).map(item => ({
      ...item,
      label: getDetectionLabel(item),
      type: item.type || item.label || '',
    }))
  }, [result?.detections])

  const groupedDetections = useMemo(() => {
    const map: Record<string, { type: string; items: Array<{ item: typeof normalizedDetections[0]; originalIndex: number }>; totalConf: number; maxConf: number }> = {}
    normalizedDetections.forEach((item, idx) => {
      const type = item.label || item.type || 'Unknown'
      if (!map[type]) {
        map[type] = { type, items: [], totalConf: 0, maxConf: 0 }
      }
      map[type].items.push({ item, originalIndex: idx })
      map[type].totalConf += item.confidence || 0
      map[type].maxConf = Math.max(map[type].maxConf, item.confidence || 0)
    })
    return Object.values(map)
  }, [normalizedDetections])

  // Strictly dynamic computer-vision summary metrics
  const totalDetectionsCount = result?.totalDetections || normalizedDetections.length

  const averageConfidence = useMemo(() => {
    if (normalizedDetections.length === 0) return 0
    const sum = normalizedDetections.reduce((acc, item) => acc + (item.confidence || 0), 0)
    return Math.round(sum / normalizedDetections.length)
  }, [normalizedDetections])

  const highestConfidence = useMemo(() => {
    if (normalizedDetections.length === 0) return 0
    return Math.round(Math.max(...normalizedDetections.map(item => item.confidence || 0)))
  }, [normalizedDetections])

  const numMaterialClasses = groupedDetections.length

  // Strictly dynamic detection quality breakdown
  const detectionQuality = useMemo(() => {
    let high = 0
    let moderate = 0
    let low = 0

    normalizedDetections.forEach(item => {
      const conf = item.confidence || 0
      if (conf >= 80) high++
      else if (conf >= 50) moderate++
      else low++
    })

    return { high, moderate, low }
  }, [normalizedDetections])

  const handleExport = async () => {
    if (!id) return
    await generatePDFReport(id,
      () => { setIsExporting(true); toast.info('Generating your PDF detection report...') },
      () => { setIsExporting(false); toast.success('Report downloaded successfully!') },
      (err) => { console.error('PDF Export Error:', err); setIsExporting(false); toast.error('Failed to generate report. Please try again.') }
    )
  }

  const handleShare = async () => {
    if (!result) return
    await shareContent(
      'EcoScan AI Detection Result',
      `I just detected ${totalDetectionsCount} waste objects across ${numMaterialClasses} material classes with EcoScan YOLO11!`,
      window.location.href,
      () => toast.success('Link shared successfully!'),
      () => toast.error('Failed to share. Link copied to clipboard instead.')
    )
  }

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6">
        <motion.div
          className="glass-card flex max-w-sm flex-col items-center rounded-3xl p-10 text-center shadow-2xl w-full"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative mb-8">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-chart-5/20">
              <Scan className="h-10 w-10 animate-pulse text-primary" />
            </div>
          </div>
          <h3 className="mb-1 text-xl font-bold">YOLO11 Detector Active</h3>
          <AnimatePresence mode="wait">
            <motion.p key={loadingStep} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              className="text-sm font-medium text-muted-foreground mt-1">
              {loadingMessages[loadingStep]}
            </motion.p>
          </AnimatePresence>
          <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-chart-5"
              initial={{ width: '0%' }}
              animate={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
              transition={{ duration: 0.5 }} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Step {loadingStep + 1} of {loadingMessages.length}
          </p>
        </motion.div>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error || !result || !result.detections || result.detections.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center p-6">
        <div className="glass-card max-w-md rounded-3xl p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Detection Failed</h2>
          <p className="mb-8 text-muted-foreground">{error || 'Could not find detection data for this image.'}</p>
          <Button asChild className="btn-gradient w-full border-0 text-white shadow-lg">
            <Link to="/upload">Try Another Image</Link>
          </Button>
        </div>
      </div>
    )
  }

  const primaryDetection = normalizedDetections[0]
  const categoryKey = normalizeCategoryKey(getDetectionLabel(primaryDetection))
  const details = CATEGORY_MAP[categoryKey] ?? CATEGORY_MAP.trash
  const displayLabel = getDetectionLabel(primaryDetection) || details.label
  
  // Clean original image path for bounding-box overlay
  const cleanOriginalImageSrc = buildImageUrl(result.image)

  const chartData = [
    { name: 'Average Confidence', value: averageConfidence, fill: 'var(--primary)' },
    { name: 'Uncertainty Threshold', value: Math.max(0, 100 - averageConfidence), fill: 'rgba(255,255,255,0.05)' },
  ]

  // Format detection time
  const detectedAt = result.createdAt
    ? new Date(result.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'Just now'

  const handleBoxClick = (idx: number) => {
    setActiveHighlightIndex(idx);
    
    const cardEl = document.getElementById(`detection-card-${idx}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    if (lightboxOpen) {
      setSelectedBoxIndex(idx);
    }
    
    setTimeout(() => {
      setActiveHighlightIndex(null);
    }, 1500);
  };

  const handleMainImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    setMainImgSize({
      width: target.clientWidth,
      height: target.clientHeight,
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight
    });
    setImageLoaded(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxOpen && cleanOriginalImageSrc && (
          <Lightbox
            src={cleanOriginalImageSrc}
            onClose={() => {
              setLightboxOpen(false);
              setSelectedBoxIndex(null);
            }}
            scale={scale}
            setScale={setScale}
            pos={pos}
            setPos={setPos}
            lightboxImgSize={lightboxImgSize}
            setLightboxImgSize={setLightboxImgSize}
            selectedBoxIndex={selectedBoxIndex}
            setSelectedBoxIndex={setSelectedBoxIndex}
            normalizedDetections={normalizedDetections}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            handleBoxClick={handleBoxClick}
          />
        )}
      </AnimatePresence>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <motion.div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Detection Results"
          subtitle="YOLOv11 multi-object detection, material classification and confidence analysis."
          breadcrumb={[{ label: 'History', href: '/history' }, { label: 'Detection Result' }]}
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm"
            className="glass-card gap-2 border-border/50 shadow-sm text-sm"
            onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button variant="outline" size="sm"
            className="glass-card gap-2 border-border/50 shadow-sm text-sm"
            onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </motion.div>

      {/* ── Main Grid: 8 + 4 columns ────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* ── LEFT: Hero Image + Detection Cards ─────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-col gap-6 lg:col-span-8">

          {/* ── Hero Image Card ─────────────────────────────────────────── */}
          <div className="glass-card overflow-hidden rounded-3xl shadow-2xl border border-border/40">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-border/20 bg-muted/5 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
                </div>
                <span className="ml-2 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Interactive Multi-Object Detection Viewport
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="gap-1 text-[10px] px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
                  <Cpu className="h-2.5 w-2.5" /> YOLOv11
                </Badge>
                <button
                  title="Fullscreen lightbox"
                  onClick={() => {
                    setSelectedBoxIndex(null);
                    setLightboxOpen(true);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground border border-border/30"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Image viewport container */}
            <div
              className="relative flex min-h-[480px] max-h-[560px] w-full cursor-zoom-in items-center justify-center bg-slate-950 overflow-hidden py-4"
              onClick={() => {
                setSelectedBoxIndex(null);
                setLightboxOpen(true);
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_60%,_rgba(0,0,0,0.5)_100%)]" />

              {cleanOriginalImageSrc ? (
                <div className="relative inline-block max-h-full max-w-full">
                  <motion.img
                    id="result-image"
                    src={cleanOriginalImageSrc}
                    alt="Detected waste scan"
                    crossOrigin="anonymous"
                    className="max-h-[480px] max-w-full object-contain select-none rounded-xl"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: imageLoaded ? 1 : 0, scale: imageLoaded ? 1 : 0.97 }}
                    transition={{ duration: 0.4 }}
                    onLoad={handleMainImageLoad}
                    onError={() => setImageLoaded(false)}
                    draggable={false}
                  />

                  {/* Absolute positioned interactive bounding boxes */}
                  {imageLoaded && mainImgSize.naturalWidth > 1 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {normalizedDetections.map((item, idx) => {
                        if (!item.bbox) return null;
                        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = item.bbox;
                        const left = (x1 / mainImgSize.naturalWidth) * 100;
                        const top = (y1 / mainImgSize.naturalHeight) * 100;
                        const width = ((x2 - x1) / mainImgSize.naturalWidth) * 100;
                        const height = ((y2 - y1) / mainImgSize.naturalHeight) * 100;
                        
                        const theme = getCategoryTheme(item.label);
                        const isHovered = hoveredIndex === idx;
                        const isAnyHovered = hoveredIndex !== null;
                        const isHighlighted = activeHighlightIndex === idx;
                        const confRounded = Math.round(item.confidence || 0);

                        return (
                          <div
                            key={idx}
                            className="absolute border-2 pointer-events-auto cursor-pointer transition-all duration-200"
                            style={{
                              left: `${left}%`,
                              top: `${top}%`,
                              width: `${width}%`,
                              height: `${height}%`,
                              borderColor: isHovered || isHighlighted ? theme.hexColor : `${theme.hexColor}aa`,
                              borderWidth: isHovered || isHighlighted ? '3px' : '1.5px',
                              boxShadow: isHovered || isHighlighted ? `0 0 12px ${theme.hexColor}` : 'none',
                              opacity: isAnyHovered ? (isHovered ? 1.0 : 0.3) : 0.85,
                              backgroundColor: isHovered || isHighlighted ? `${theme.hexColor}15` : 'transparent',
                            }}
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBoxClick(idx);
                            }}
                          >
                            <span
                              className="absolute -top-6 left-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md pointer-events-none whitespace-nowrap"
                              style={{ backgroundColor: theme.hexColor }}
                            >
                              {item.label} {confRounded}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground/40">
                  <ImageIcon className="h-12 w-12" />
                  <p className="text-sm font-medium">No image available</p>
                </div>
              )}

              {!imageLoaded && cleanOriginalImageSrc && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                </div>
              )}

              {/* Bottom-left: object count pill */}
              <motion.div
                className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-md px-3 py-1.5 text-xs font-bold border border-border/30 shadow-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: imageLoaded ? 1 : 0, y: imageLoaded ? 0 : 10 }}
                transition={{ delay: 0.5 }}
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {totalDetectionsCount} Object{totalDetectionsCount !== 1 ? 's' : ''} Detected
              </motion.div>

              {/* Top-right: AI Detected pill */}
              <motion.div
                className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-md px-3 py-1.5 text-xs font-semibold border border-border/30 shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: imageLoaded ? 1 : 0, scale: imageLoaded ? 1 : 0.8 }}
                transition={{ delay: 0.4 }}
              >
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                YOLO11 Detected
              </motion.div>

              {imageLoaded && (
                <motion.div
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-background/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-medium text-muted-foreground border border-border/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <ZoomIn className="h-3 w-3" /> Click image to zoom
                </motion.div>
              )}
            </div>
          </div>

          {/* ── Detection Results (Grouped by Material) ────────────────────────── */}
          <div className="glass-card rounded-3xl overflow-hidden border border-border/40 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/20 bg-muted/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Detection Results</h3>
                  <p className="text-xs text-muted-foreground">Click a material group to inspect bounding boxes and confidence scores</p>
                </div>
              </div>
              <Badge variant="secondary" className="font-bold text-sm px-3">
                {groupedDetections.length} material class{groupedDetections.length !== 1 ? 'es' : ''} ({totalDetectionsCount} objects)
              </Badge>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="p-4 space-y-3"
            >
              {groupedDetections.map((group, i) => {
                const theme = getCategoryTheme(group.type)
                const GroupIcon = theme.icon
                const avgConf = Math.round(group.totalConf / group.items.length)
                const maxConf = Math.round(group.maxConf)
                const isGroupExpanded = expandedGroups[group.type] ?? true

                return (
                  <div
                    key={group.type || String(i)}
                    className="rounded-2xl border bg-background/40 overflow-hidden transition-all border-border/30"
                    style={{ borderLeftWidth: 4, borderLeftColor: theme.hexColor }}
                  >
                    {/* Group Header Bar */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/10 transition-colors"
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [group.type]: !(prev[group.type] ?? true) }))}
                      onMouseEnter={() => {
                        if (group.items.length > 0) setHoveredIndex(group.items[0].originalIndex)
                      }}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.bgColor}`}>
                          <GroupIcon className={`h-5 w-5 ${theme.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-foreground capitalize">{group.type}</h4>
                            <Badge className={`text-xs font-bold px-2 py-0.5 ${theme.bgColor} ${theme.color} border-0`}>
                              {group.items.length} detection{group.items.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Average confidence: <strong className="text-foreground">{avgConf}%</strong> · Highest: <strong className="text-foreground">{maxConf}%</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isGroupExpanded ? 'rotate-90 text-foreground' : ''}`} />
                      </div>
                    </div>

                    {/* Group Expanded Items List */}
                    <AnimatePresence>
                      {isGroupExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-border/15 bg-muted/5"
                        >
                          <div className="grid gap-2.5 p-3 sm:grid-cols-2">
                            {group.items.map(({ item, originalIndex }) => {
                              const conf = Math.round(item.confidence || 0)
                              const bboxStr = item.bbox
                                ? `[${Math.round(item.bbox.x1 ?? 0)}, ${Math.round(item.bbox.y1 ?? 0)}, ${Math.round(item.bbox.x2 ?? 0)}, ${Math.round(item.bbox.y2 ?? 0)}]`
                                : '—'

                              return (
                                <motion.div
                                  key={`item-${originalIndex}`}
                                  id={`detection-card-${originalIndex}`}
                                  whileHover={{ scale: 1.01 }}
                                  onClick={() => {
                                    setSelectedBoxIndex(originalIndex);
                                    setLightboxOpen(true);
                                  }}
                                  onMouseEnter={() => setHoveredIndex(originalIndex)}
                                  onMouseLeave={() => setHoveredIndex(null)}
                                  className={`rounded-xl border p-3 cursor-pointer transition-all ${
                                    activeHighlightIndex === originalIndex
                                      ? 'border-primary ring-2 ring-primary/40 bg-primary/10'
                                      : 'border-border/30 bg-background/60 hover:border-border/60 hover:bg-background/80'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-foreground">Object #{originalIndex + 1}</span>
                                    <span className={`text-xs font-black ${theme.color}`}>{conf}%</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mb-2">
                                    <div className={`h-full rounded-full ${theme.barColor}`} style={{ width: `${conf}%` }} />
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                                    <CircleDot className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                                    <span className="truncate">BBox: {bboxStr}</span>
                                  </div>
                                </motion.div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </motion.div>
          </div>

        </motion.div>

        {/* ── RIGHT: Summary + Tabs ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-col gap-6 lg:col-span-4">

          {/* ── Computer Vision Detection Summary Card ──────────────────── */}
          <div className="glass-card rounded-3xl overflow-hidden shadow-xl border border-border/40">
            <div className="bg-gradient-to-r from-primary/10 via-chart-5/5 to-transparent px-6 py-4 border-b border-border/20">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Detection Summary</span>
              </div>
              <p className="text-xs text-muted-foreground">Dynamic model prediction metrics</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Confidence ring */}
              <div className="flex flex-col items-center gap-3">
                <ConfidenceRing value={averageConfidence} size={130} stroke={8} />
                <div className="text-center">
                  <p className={`text-2xl font-black capitalize ${details.color}`}>{displayLabel}</p>
                  <Badge className={`mt-1 border-0 font-semibold ${details.bgColor} ${details.color}`}>
                    Primary Class Detection
                  </Badge>
                </div>
              </div>

              {/* Dynamic Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Objects Detected', value: String(totalDetectionsCount), color: 'text-chart-1' },
                  { label: 'Material Classes', value: String(numMaterialClasses), color: 'text-chart-2' },
                  { label: 'Average Confidence', value: `${averageConfidence}%`, color: 'text-emerald-400' },
                  { label: 'Highest Confidence', value: `${highestConfidence}%`, color: 'text-chart-3' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border border-border/30 bg-background/40 p-3 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                    <p className={`text-xl font-black ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Model & resolution badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-1.5 rounded-full bg-muted/40 border border-border/30 px-2.5 py-1">
                  <Cpu className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground">YOLOv11 Model</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-muted/40 border border-border/30 px-2.5 py-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground">{detectedAt}</span>
                </div>
                {mainImgSize.naturalWidth > 1 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/40 border border-border/30 px-2.5 py-1">
                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground">{mainImgSize.naturalWidth} × {mainImgSize.naturalHeight} px</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── Tabs Card: Overview, Quality, Analytics ────────────────── */}
          <div className="glass-card flex flex-col rounded-3xl shadow-xl overflow-hidden border border-border/40">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              {/* Tab nav */}
              <div className="border-b border-border/30 bg-muted/5 px-5 pt-4">
                <TabsList className="w-full justify-start gap-1 bg-transparent p-0">
                  {[
                    { value: 'overview', label: 'Overview' },
                    { value: 'quality', label: 'Detection Quality' },
                    { value: 'analytics', label: 'Analytics' },
                  ].map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}
                      className="relative rounded-t-xl rounded-b-none px-4 py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                      {activeTab === tab.value && (
                        <motion.div layoutId="activeResultTab"
                          className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        {tab.label}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <AnimatePresence mode="wait">

                  {/* OVERVIEW TAB */}
                  <TabsContent value="overview" className="mt-0">
                    <motion.div key="overview" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}
                      className="space-y-4">

                      {/* Computer Vision Scope Statement */}
                      <motion.div variants={fadeUp}
                        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
                        <div className="flex items-start gap-3 relative z-10">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                            <Cpu className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-primary text-sm mb-1">Multi-Object Detection Model</h4>
                            <p className="text-xs leading-relaxed text-foreground/90">
                              EcoScan uses YOLO11 for multi-object detection and classifies detected waste objects into material categories while reporting bounding boxes and confidence scores.
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Material Class Breakdown */}
                      <motion.div variants={fadeUp} className="rounded-2xl border border-border/30 bg-background/30 overflow-hidden">
                        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20 bg-muted/5">
                          <Layers className="h-4 w-4 text-primary" />
                          <p className="text-xs font-bold uppercase tracking-wider">Class Distribution</p>
                        </div>
                        <div className="p-3 space-y-2">
                          {groupedDetections.map((grp) => {
                            const theme = getCategoryTheme(grp.type)
                            const avgConf = Math.round(grp.totalConf / grp.items.length)
                            const pct = Math.round((grp.items.length / totalDetectionsCount) * 100)

                            return (
                              <div key={grp.type} className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2.5 border border-border/20">
                                <div className="flex items-center gap-2.5">
                                  <div className={`h-2.5 w-2.5 rounded-full ${theme.barColor}`} />
                                  <span className="text-xs font-bold capitalize">{grp.type}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="font-bold text-muted-foreground">{grp.items.length} ({pct}%)</span>
                                  <span className="font-mono font-bold text-foreground bg-muted/40 px-2 py-0.5 rounded-md text-[11px]">{avgConf}% avg</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>

                      {/* Model metadata */}
                      <motion.div variants={fadeUp} className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Inference scan completed
                        </span>
                        <span>{detectedAt}</span>
                      </motion.div>
                    </motion.div>
                  </TabsContent>

                  {/* DETECTION QUALITY TAB */}
                  <TabsContent value="quality" className="mt-0">
                    <motion.div key="quality" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}
                      className="space-y-4">

                      <motion.div variants={fadeUp} className="rounded-xl border border-border/30 bg-muted/5 p-3.5">
                        <div className="flex items-center gap-2 text-xs font-bold mb-1 text-foreground">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span>Prediction Confidence Analysis</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Categorization of model predictions based on confidence thresholds across all {totalDetectionsCount} detected bounding box predictions.
                        </p>
                      </motion.div>

                      <div className="space-y-3">
                        {/* High Confidence */}
                        <motion.div variants={fadeUp}
                          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4"
                          style={{ borderLeftWidth: 3, borderLeftColor: '#10b981' }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full p-1.5 bg-emerald-500/15 text-emerald-500">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-bold text-foreground">High Confidence (≥ 80%)</h4>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 font-black text-xs">
                                  {detectionQuality.high} object{detectionQuality.high !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                High probability detection with distinct visual feature alignment.
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        {/* Moderate Confidence */}
                        <motion.div variants={fadeUp}
                          className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
                          style={{ borderLeftWidth: 3, borderLeftColor: '#f59e0b' }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full p-1.5 bg-amber-500/15 text-amber-500">
                              <AlertCircle className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-bold text-foreground">Moderate Confidence (50–79%)</h4>
                                <Badge className="bg-amber-500/20 text-amber-400 border-0 font-black text-xs">
                                  {detectionQuality.moderate} object{detectionQuality.moderate !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Acceptable detection certainty; may exhibit partial occlusion or overlapping boundaries.
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        {/* Low Confidence */}
                        <motion.div variants={fadeUp}
                          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4"
                          style={{ borderLeftWidth: 3, borderLeftColor: 'var(--destructive)' }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full p-1.5 bg-destructive/15 text-destructive">
                              <HelpCircle className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-bold text-foreground">Low Confidence (&lt; 50%)</h4>
                                <Badge className="bg-destructive/20 text-destructive border-0 font-black text-xs">
                                  {detectionQuality.low} object{detectionQuality.low !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Borderline prediction near the model threshold cutoff ({25}%).
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                    </motion.div>
                  </TabsContent>

                  {/* ANALYTICS TAB */}
                  <TabsContent value="analytics" className="mt-0">
                    <motion.div key="analytics" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}
                      className="space-y-5">

                      {/* Confidence donut */}
                      <motion.div variants={fadeUp}>
                        <div className="relative h-44 w-full flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={68} paddingAngle={4} dataKey="value" stroke="none">
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', backgroundColor: 'hsl(var(--background))', fontSize: '12px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black">{averageConfidence}%</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Avg Conf</span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Progress bars per class */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Class Confidence Scores</p>
                        {groupedDetections.map((grp, i) => {
                          const theme = getCategoryTheme(grp.type)
                          const avgConf = Math.round(grp.totalConf / grp.items.length)
                          return (
                            <motion.div key={grp.type} variants={fadeUp} className="space-y-1.5">
                              <div className="flex justify-between text-[11px] font-bold capitalize">
                                <span>{grp.type} ({grp.items.length})</span>
                                <span className="text-muted-foreground">{avgConf}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                                <motion.div className={`h-full rounded-full ${theme.barColor}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${avgConf}%` }}
                                  transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }} />
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>

                      <motion.div variants={fadeUp}
                        className="rounded-xl border border-border/30 bg-muted/5 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold mb-1">
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Evaluation Metric Note</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Individual result confidence scores reflect class probability estimated by the YOLO11 output layer for detected region proposals. Dataset-wide performance metrics (mAP@50, precision, recall) are evaluated in the offline model report.
                        </p>
                      </motion.div>
                    </motion.div>
                  </TabsContent>

                </AnimatePresence>
              </div>
            </Tabs>
          </div>
        </motion.div>
      </div>

    </div>
  )
}
