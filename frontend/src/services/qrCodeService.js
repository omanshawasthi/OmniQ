// QR Code generation service
class QRCodeService {
  constructor() {
    // Use window.location.origin for browser environment
    this.baseUrl = import.meta.env?.VITE_BASE_URL || window.location.origin
  }

  // Generate QR code data for a token
  generateTokenQRData(token) {
    if (!token) return null

    const qrData = {
      type: 'token',
      id: token._id,
      tokenNumber: token.tokenNumber,
      branch: token.branch?.name,
      department: token.department?.name,
      scheduledTime: token.scheduledTime,
      status: token.status,
      user: {
        name: token.user?.name,
        email: token.user?.email
      },
      timestamp: new Date().toISOString(),
      url: `${this.baseUrl}/user/token/${token._id}`
    }

    return JSON.stringify(qrData)
  }

  // Generate QR code URL using an external service
  generateQRCodeURL(data, options = {}) {
    const defaultOptions = {
      size: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      format: 'png'
    }

    const mergedOptions = { ...defaultOptions, ...options }

    // Using QR Server API (free service)
    const qrServerUrl = 'https://api.qrserver.com/v1/create-qr-code/'
    const params = new URLSearchParams({
      size: `${mergedOptions.size}x${mergedOptions.size}`,
      margin: mergedOptions.margin,
      data: data,
      format: mergedOptions.format,
      color: mergedOptions.color.dark,
      bgcolor: mergedOptions.color.light
    })

    return `${qrServerUrl}?${params.toString()}`
  }

  // Generate QR code for token
  generateTokenQRCode(token, options = {}) {
    const qrData = this.generateTokenQRData(token)
    if (!qrData) return null

    return this.generateQRCodeURL(qrData, options)
  }

  // Generate QR code for branch
  generateBranchQRCode(branch, options = {}) {
    const qrData = JSON.stringify({
      type: 'branch',
      id: branch._id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      url: `${this.baseUrl}/branches/${branch._id}`
    })

    return this.generateQRCodeURL(qrData, options)
  }

  // Generate QR code for department
  generateDepartmentQRCode(department, options = {}) {
    const qrData = JSON.stringify({
      type: 'department',
      id: department._id,
      name: department.name,
      branch: department.branch?.name,
      url: `${this.baseUrl}/departments/${department._id}`
    })

    return this.generateQRCodeURL(qrData, options)
  }

  // Download QR code as image
  downloadQRCode(qrUrl, filename = 'qrcode.png') {
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print QR code
  printQRCode(qrUrl, title = 'QR Code') {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 2px solid #ddd;
              border-radius: 8px;
            }
            .qr-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .qr-image {
              max-width: 300px;
              height: auto;
            }
            .qr-footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-title">${title}</div>
            <img src="${qrUrl}" alt="QR Code" class="qr-image" />
            <div class="qr-footer">
              Generated on ${new Date().toLocaleString()}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Validate QR code data
  validateQRData(qrData) {
    try {
      const parsed = JSON.parse(qrData)
      
      // Check if it's a valid token QR code
      if (parsed.type === 'token' && parsed.id && parsed.tokenNumber) {
        return {
          isValid: true,
          type: 'token',
          data: parsed
        }
      }
      
      // Check if it's a valid branch QR code
      if (parsed.type === 'branch' && parsed.id && parsed.name) {
        return {
          isValid: true,
          type: 'branch',
          data: parsed
        }
      }
      
      // Check if it's a valid department QR code
      if (parsed.type === 'department' && parsed.id && parsed.name) {
        return {
          isValid: true,
          type: 'department',
          data: parsed
        }
      }
      
      return { isValid: false, error: 'Invalid QR code format' }
    } catch (error) {
      return { isValid: false, error: 'Invalid JSON format' }
    }
  }

  // Create canvas-based QR code (alternative method)
  createCanvasQRCode(data, canvas, options = {}) {
    // This would require a QR code library like qrcode.js
    // For now, we'll use the external service
    const qrUrl = this.generateQRCodeURL(data, options)
    
    const img = new Image()
    img.onload = () => {
      const ctx = canvas.getContext('2d')
      canvas.width = options.size || 200
      canvas.height = options.size || 200
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = qrUrl
  }
}

// Create singleton instance
const qrCodeService = new QRCodeService()

export default qrCodeService
