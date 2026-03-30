import QRCode from 'qrcode'
import crypto from 'crypto'
import Token from '../models/Token.js'

export class QRService {
  // Generate QR code for token
  static async generateTokenQR(tokenId) {
    try {
      const token = await Token.findById(tokenId)
      
      if (!token) {
        throw new Error('Token not found')
      }

      // Create QR data with token information
      const qrData = {
        type: 'token',
        id: token._id.toString(),
        tokenNumber: token.tokenNumber,
        branchId: token.branchId.toString(),
        departmentId: token.departmentId.toString(),
        createdAt: token.createdAt.toISOString(),
        checksum: this.generateChecksum(token)
      }

      // Generate QR code as base64
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200
      })

      // Update token with QR code
      token.qrCode = qrCodeDataURL
      await token.save()

      return {
        qrCode: qrCodeDataURL,
        tokenNumber: token.tokenNumber,
        expiresAt: new Date(token.createdAt.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      }
    } catch (error) {
      console.error('Error generating token QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  // Verify QR code data
  static verifyQRCode(qrData) {
    try {
      const parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData
      
      // Check required fields
      if (!parsedData.type || !parsedData.id || !parsedData.checksum) {
        return { valid: false, error: 'Invalid QR code format' }
      }

      // Verify token exists
      const token = Token.findById(parsedData.id)
      if (!token) {
        return { valid: false, error: 'Token not found' }
      }

      // Verify checksum
      const expectedChecksum = this.generateChecksum(token)
      if (parsedData.checksum !== expectedChecksum) {
        return { valid: false, error: 'Invalid QR code checksum' }
      }

      // Check if QR code is expired (24 hours)
      const qrCreatedAt = new Date(parsedData.createdAt)
      const now = new Date()
      const hoursDiff = (now - qrCreatedAt) / (1000 * 60 * 60)
      
      if (hoursDiff > 24) {
        return { valid: false, error: 'QR code has expired' }
      }

      return {
        valid: true,
        token,
        tokenNumber: parsedData.tokenNumber
      }
    } catch (error) {
      console.error('Error verifying QR code:', error)
      return { valid: false, error: 'Failed to verify QR code' }
    }
  }

  // Generate checksum for QR data
  static generateChecksum(token) {
    const data = `${token._id}${token.tokenNumber}${token.createdAt.getTime()}`
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8)
  }

  // Generate QR code for branch display
  static async generateBranchDisplayQR(branchId) {
    try {
      const displayUrl = `${process.env.FRONTEND_URL}/display/${branchId}`
      
      const qrCodeDataURL = await QRCode.toDataURL(displayUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      })

      return {
        qrCode: qrCodeDataURL,
        displayUrl,
        branchId
      }
    } catch (error) {
      console.error('Error generating branch display QR code:', error)
      throw new Error('Failed to generate display QR code')
    }
  }

  // Generate QR code for counter
  static async generateCounterQR(counterId) {
    try {
      const qrData = {
        type: 'counter',
        id: counterId.toString(),
        createdAt: new Date().toISOString(),
        checksum: this.generateCounterChecksum(counterId)
      }

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200
      })

      return {
        qrCode: qrCodeDataURL,
        counterId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    } catch (error) {
      console.error('Error generating counter QR code:', error)
      throw new Error('Failed to generate counter QR code')
    }
  }

  // Generate checksum for counter QR
  static generateCounterChecksum(counterId) {
    const data = `counter_${counterId}_${new Date().toISOString().split('T')[0]}`
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8)
  }

  // Check in token using QR code
  static async checkInToken(qrData, userId = null) {
    try {
      const verification = this.verifyQRCode(qrData)
      
      if (!verification.valid) {
        throw new Error(verification.error)
      }

      const token = verification.token
      
      // Check if token is in correct state for check-in
      if (token.status !== 'waiting') {
        throw new Error('Token cannot be checked in in current state')
      }

      // Update token check-in status
      token.checkedInAt = new Date()
      token.checkedInBy = userId
      await token.save()

      return {
        success: true,
        token,
        message: 'Token checked in successfully'
      }
    } catch (error) {
      console.error('Error checking in token:', error)
      throw error
    }
  }

  // Generate QR code for user profile
  static async generateUserQR(userId) {
    try {
      const qrData = {
        type: 'user',
        id: userId.toString(),
        createdAt: new Date().toISOString(),
        checksum: this.generateUserChecksum(userId)
      }

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 150
      })

      return {
        qrCode: qrCodeDataURL,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    } catch (error) {
      console.error('Error generating user QR code:', error)
      throw new Error('Failed to generate user QR code')
    }
  }

  // Generate checksum for user QR
  static generateUserChecksum(userId) {
    const data = `user_${userId}_${new Date().toISOString().split('T')[0]}`
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8)
  }

  // Generate batch QR codes for multiple tokens
  static async generateBatchTokenQRs(tokenIds) {
    const results = []
    
    for (const tokenId of tokenIds) {
      try {
        const result = await this.generateTokenQR(tokenId)
        results.push({ tokenId, ...result, success: true })
      } catch (error) {
        results.push({ tokenId, error: error.message, success: false })
      }
    }

    return results
  }

  // Validate QR code format
  static validateQRFormat(qrData) {
    try {
      const parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData
      
      const requiredFields = ['type', 'id', 'checksum', 'createdAt']
      const missingFields = requiredFields.filter(field => !parsedData[field])
      
      if (missingFields.length > 0) {
        return {
          valid: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        }
      }

      // Validate type
      const validTypes = ['token', 'counter', 'user', 'branch_display']
      if (!validTypes.includes(parsedData.type)) {
        return {
          valid: false,
          error: `Invalid QR code type: ${parsedData.type}`
        }
      }

      // Validate date format
      const createdAt = new Date(parsedData.createdAt)
      if (isNaN(createdAt.getTime())) {
        return {
          valid: false,
          error: 'Invalid date format'
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid JSON format'
      }
    }
  }

  // Get QR code statistics
  static async getQRCodeStats(startDate, endDate) {
    try {
      const tokens = await Token.find({
        createdAt: { $gte: startDate, $lte: endDate }
      })

      const stats = {
        totalTokens: tokens.length,
        tokensWithQR: tokens.filter(t => t.qrCode).length,
        checkedInTokens: tokens.filter(t => t.checkedInAt).length,
        qrCodeGenerationRate: 0,
        checkInRate: 0
      }

      if (stats.totalTokens > 0) {
        stats.qrCodeGenerationRate = (stats.tokensWithQR / stats.totalTokens) * 100
        stats.checkInRate = (stats.checkedInTokens / stats.totalTokens) * 100
      }

      return stats
    } catch (error) {
      console.error('Error getting QR code stats:', error)
      throw new Error('Failed to get QR code statistics')
    }
  }

  // Clean up expired QR codes
  static async cleanupExpiredQRCodes() {
    try {
      const expiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      
      // This would typically be handled by token expiration logic
      // For now, just return count of potentially expired QR codes
      const expiredTokens = await Token.countDocuments({
        createdAt: { $lt: expiryDate },
        status: { $in: ['waiting', 'serving'] }
      })

      return {
        expiredTokens,
        cleanupDate: new Date()
      }
    } catch (error) {
      console.error('Error cleaning up expired QR codes:', error)
      throw new Error('Failed to cleanup expired QR codes')
    }
  }
}

export default QRService
