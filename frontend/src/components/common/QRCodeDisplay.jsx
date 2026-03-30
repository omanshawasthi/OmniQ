import React, { useState, useEffect, useRef } from 'react'
import { QrCode, Download, Printer, Share2, Loader2 } from 'lucide-react'
import qrCodeService from '../../services/qrCodeService.js'

const QRCodeDisplay = ({ 
  data, 
  title = 'QR Code', 
  size = 200, 
  showActions = true, 
  className = '',
  onGenerated = null 
}) => {
  const [qrUrl, setQrUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    generateQRCode()
  }, [data, size])

  const generateQRCode = async () => {
    if (!data) {
      setError('No data provided for QR code generation')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let qrData = data
      
      // If data is a token object, convert to QR data
      if (typeof data === 'object' && data._id) {
        qrData = qrCodeService.generateTokenQRData(data)
      }

      const url = qrCodeService.generateQRCodeURL(qrData, { size })
      setQrUrl(url)
      
      // Also render to canvas if available
      if (canvasRef.current) {
        qrCodeService.createCanvasQRCode(qrData, canvasRef.current, { size })
      }
      
      if (onGenerated) {
        onGenerated(url)
      }
    } catch (err) {
      console.error('Error generating QR code:', err)
      setError('Failed to generate QR code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!qrUrl) return
    
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
    qrCodeService.downloadQRCode(qrUrl, filename)
  }

  const handlePrint = () => {
    if (!qrUrl) return
    
    qrCodeService.printQRCode(qrUrl, title)
  }

  const handleShare = async () => {
    if (!qrUrl) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Scan this QR code for ${title}`,
          url: qrUrl
        })
      } catch (err) {
        console.log('Share cancelled or failed:', err)
        // Fallback to copying URL
        copyToClipboard(qrUrl)
      }
    } else {
      copyToClipboard(qrUrl)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('QR code URL copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Generating QR code...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
        <div className="text-red-500 text-center">
          <QrCode className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* QR Code Image */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        {qrUrl ? (
          <img 
            src={qrUrl} 
            alt={title} 
            className="max-w-full h-auto"
            style={{ width: size, height: size }}
          />
        ) : (
          <div 
            className="bg-gray-100 flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <QrCode className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Hidden canvas for alternative rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Title */}
      {title && (
        <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
          {title}
        </h3>
      )}

      {/* Action Buttons */}
      {showActions && qrUrl && (
        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Download QR Code"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={handlePrint}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Print QR Code"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Share QR Code"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// Token-specific QR code component
export const TokenQRCode = ({ token, size = 200, showActions = true, className = '' }) => {
  const title = `Token ${token?.tokenNumber || 'N/A'}`
  
  return (
    <QRCodeDisplay
      data={token}
      title={title}
      size={size}
      showActions={showActions}
      className={className}
    />
  )
}

// Branch-specific QR code component
export const BranchQRCode = ({ branch, size = 200, showActions = true, className = '' }) => {
  const qrData = qrCodeService.generateBranchQRCode(branch)
  const title = `${branch?.name || 'Branch'} QR Code`
  
  return (
    <QRCodeDisplay
      data={qrData}
      title={title}
      size={size}
      showActions={showActions}
      className={className}
    />
  )
}

// Department-specific QR code component
export const DepartmentQRCode = ({ department, size = 200, showActions = true, className = '' }) => {
  const qrData = qrCodeService.generateDepartmentQRCode(department)
  const title = `${department?.name || 'Department'} QR Code`
  
  return (
    <QRCodeDisplay
      data={qrData}
      title={title}
      size={size}
      showActions={showActions}
      className={className}
    />
  )
}

// QR Code Scanner component (for future use)
export const QRCodeScanner = ({ onScan, className = '' }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)

  const startScanning = () => {
    setIsScanning(true)
    setError(null)
    
    // This would integrate with a QR code scanning library
    // For now, we'll show a placeholder
    alert('QR code scanning feature coming soon!')
    setIsScanning(false)
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onClick={startScanning}
      >
        {isScanning ? (
          <div className="text-blue-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm">Scanning...</p>
          </div>
        ) : (
          <div className="text-gray-600">
            <QrCode className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Click to scan QR code</p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  )
}

export default QRCodeDisplay
