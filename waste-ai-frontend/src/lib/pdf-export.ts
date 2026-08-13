import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/config'

export const waitForImages = async (element: HTMLElement) => {
  const imgs = Array.from(element.querySelectorAll('img'))
  const promises = imgs.map(img => {
    if (img.complete) return Promise.resolve()
    return new Promise(resolve => {
      img.onload = resolve
      img.onerror = resolve
    })
  })
  await Promise.all(promises)
}

export const generatePDFReport = async (
  resultId: string,
  onStart?: () => void,
  onComplete?: () => void,
  onError?: (err: any) => void
) => {
  try {
    if (onStart) onStart()
    
    const token = localStorage.getItem('ecoscan_token')
    if (!token) {
      throw new Error('Authentication required to generate report')
    }

    console.log("Generating report for:", resultId)
    const endpointUrl = `${API_BASE_URL}/api/results/${resultId}/report`
    console.log("Endpoint URL:", endpointUrl)

    const response = await axios.get(endpointUrl, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    console.log("Response status:", response.status)
    console.log("PDF response received")

    // Extract filename from Content-Disposition if possible
    let filename = `EcoScan_Report_${new Date().toISOString().split('T')[0]}.pdf`
    const disposition = response.headers['content-disposition']
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/)
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1]
      }
    }

    const blob = new Blob([response.data], { type: "application/pdf" })
    const url = window.URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    
    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }, 100)

    if (onComplete) onComplete()
  } catch (err: any) {
    console.error("PDF download failed:", err)
    if (err.response) {
      console.error("Backend error response body:", err.response.data)
    }
    if (onError) onError(err)
  }
}

export const shareContent = async (
  title: string,
  text: string,
  url: string,
  onSuccess?: () => void,
  onError?: () => void
) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      })
      if (onSuccess) onSuccess()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // Fallback to clipboard if share fails (but not if user cancelled)
        copyToClipboard(url, onSuccess, onError)
      }
    }
  } else {
    // Fallback for browsers that don't support Web Share API
    copyToClipboard(url, onSuccess, onError)
  }
}

export const copyToClipboard = async (
  text: string,
  onSuccess?: () => void,
  onError?: () => void
) => {
  try {
    await navigator.clipboard.writeText(text)
    if (onSuccess) onSuccess()
  } catch (err) {
    console.error('Clipboard Error:', err)
    if (onError) onError()
  }
}
