import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/PageHeader'
import { Upload, Image as ImageIcon, X, Scan, Loader2, CheckCircle2, FileImage, Sparkles } from 'lucide-react'

type UploadState = 'idle' | 'preview' | 'processing' | 'complete'

const processingSteps = [
  { label: 'Preprocessing image', progress: 20 },
  { label: 'Analyzing object', progress: 50 },
  { label: 'Detecting waste types', progress: 75 },
  { label: 'Generating insights', progress: 95 },
]

export default function UploadPage() {
  const navigate = useNavigate()
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
      setUploadState('preview')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
  })

  const handleStartDetection = async () => {
    if (!selectedFile) return;

    const token = localStorage.getItem("ecoscan_token");
    if (!token) {
      alert("Please login first");
      return;
    }

    setUploadState("processing");

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch("http://localhost:5000/api/results/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      const resultId = data?.resultId || data?._id;
      if (!resultId) {
        throw new Error("Result ID missing in upload response");
      }

      setUploadState("complete");

      setTimeout(() => {
        navigate(`/results/${resultId}`);
      }, 1000);

    } catch (err) {
      console.log(err);
      alert("Upload failed");
      setUploadState("preview");
    }
  };

  const handleClear = () => {
    setSelectedFile(null)
    setPreview(null)
    setUploadState('idle')
    setProgress(0)
    setCurrentStep(0)
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <PageHeader 
          title="Upload Image" 
          subtitle="Analyze waste items and detect categories using our advanced AI engine." 
        />

        <AnimatePresence mode="wait">
          {(uploadState === 'idle' || uploadState === 'preview') && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card rounded-2xl p-6">
                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`
                    relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300
                    ${
                      isDragActive
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
                    }
                    ${preview ? 'border-solid border-primary/30 bg-muted/20' : ''}
                  `}
                >
                  <input {...getInputProps()} />

                  {preview ? (
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="relative mx-auto aspect-video max-w-md overflow-hidden rounded-xl bg-muted shadow-lg">
                        <img
                          src={preview}
                          alt="Preview"
                          className="h-full w-full object-contain"
                        />
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute right-2 top-2"
                        >
                          <Button
                            variant="destructive"
                            size="icon"
                            className="shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleClear()
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <FileImage className="h-4 w-4" />
                        <span className="font-medium">{selectedFile?.name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <motion.div 
                        className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-chart-5/20"
                        animate={{ 
                          scale: isDragActive ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <Upload className="h-10 w-10 text-primary" />
                      </motion.div>
                      <div>
                        <p className="text-lg font-medium">
                          {isDragActive ? 'Drop the image here' : 'Drag & drop an image'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          or click to browse from your computer
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 rounded-full bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        <span>PNG, JPG, JPEG, WEBP up to 10MB</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="lg"
                      className="w-full btn-gradient gap-2 border-0 text-white"
                      disabled={!preview}
                      onClick={handleStartDetection}
                    >
                      <Scan className="h-5 w-5" />
                      Start Detection
                    </Button>
                  </motion.div>

                </div>
              </div>
            </motion.div>
          )}

          {uploadState === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card rounded-2xl">
                <div className="flex flex-col items-center justify-center p-12">
                  {/* Animated scanner */}
                  <div className="relative">
                    <motion.div 
                      className="h-32 w-32 rounded-full"
                      style={{
                        background: 'conic-gradient(from 0deg, transparent, var(--primary), transparent)',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="absolute inset-2 rounded-full bg-background" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Scan className="h-12 w-12 text-primary" />
                      </motion.div>
                    </div>
                  </div>
                  
                  <motion.h2 
                    className="mt-8 text-xl font-semibold"
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {processingSteps[currentStep]?.label || 'Finalizing...'}
                  </motion.h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Our AI model is analyzing your image
                  </p>

                  <div className="mt-8 w-full max-w-xs">
                    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-chart-5"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      {progress}% complete
                    </p>
                  </div>

                  {/* Processing steps */}
                  <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                    {processingSteps.map((step, index) => (
                      <motion.div 
                        key={step.label}
                        className={`flex items-center gap-2 ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: index <= currentStep ? 1 : 0.5 }}
                      >
                        {index < currentStep ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : index === currentStep ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                        )}
                        <span>{step.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {uploadState === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card rounded-2xl">
                <div className="flex flex-col items-center justify-center p-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="relative"
                  >
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-chart-5/20">
                      <CheckCircle2 className="h-12 w-12 text-primary" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      initial={{ scale: 0.8, opacity: 1 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </motion.div>
                  <motion.h2 
                    className="mt-6 text-xl font-semibold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Analysis Complete!
                  </motion.h2>
                  <motion.div 
                    className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Redirecting to results...</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
