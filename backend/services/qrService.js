import QRCode from 'qrcode';
import crypto from 'crypto';
import logger from '../config/logger.js';

class QRService {
  // Generate QR code for token
  async generateTokenQR(tokenId, tokenNumber) {
    try {
      // Create secure QR payload
      const qrPayload = {
        tokenId: tokenId.toString(),
        tokenNumber: tokenNumber,
        timestamp: Date.now(),
        signature: this.generateSignature(tokenId.toString(), tokenNumber)
      };

      // Convert to JSON string
      const qrData = JSON.stringify(qrPayload);
      
      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return qrCodeDataURL;
    } catch (error) {
      logger.error('Generate QR code error:', error);
      throw error;
    }
  }

  // Generate QR code for check-in
  async generateCheckInQR(tokenId, tokenNumber) {
    try {
      const qrPayload = {
        tokenId: tokenId.toString(),
        tokenNumber: tokenNumber,
        action: 'checkin',
        timestamp: Date.now(),
        signature: this.generateSignature(tokenId.toString(), tokenNumber, 'checkin')
      };

      const qrData = JSON.stringify(qrPayload);
      
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return qrCodeDataURL;
    } catch (error) {
      logger.error('Generate check-in QR code error:', error);
      throw error;
    }
  }

  // Validate QR code
  validateQRCode(qrData) {
    try {
      // Parse QR data
      const payload = JSON.parse(qrData);
      
      // Validate required fields
      if (!payload.tokenId || !payload.tokenNumber || !payload.timestamp || !payload.signature) {
        throw new Error('Invalid QR code format');
      }

      // Check if QR is expired (5 minutes)
      const qrAge = Date.now() - payload.timestamp;
      if (qrAge > 5 * 60 * 1000) {
        throw new Error('QR code has expired');
      }

      // Verify signature
      const expectedSignature = payload.action === 'checkin' 
        ? this.generateSignature(payload.tokenId, payload.tokenNumber, 'checkin')
        : this.generateSignature(payload.tokenId, payload.tokenNumber);
      
      if (payload.signature !== expectedSignature) {
        throw new Error('Invalid QR code signature');
      }

      return {
        tokenId: payload.tokenId,
        tokenNumber: payload.tokenNumber,
        action: payload.action || 'token'
      };
    } catch (error) {
      logger.error('Validate QR code error:', error);
      throw error;
    }
  }

  // Generate signature for QR payload
  generateSignature(tokenId, tokenNumber, action = '') {
    const data = `${tokenId}:${tokenNumber}:${action}:${process.env.JWT_SECRET}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  // Generate QR code for counter display
  async generateCounterQR(counterId, counterName) {
    try {
      const qrPayload = {
        counterId: counterId.toString(),
        counterName: counterName,
        action: 'counter',
        timestamp: Date.now(),
        signature: this.generateCounterSignature(counterId.toString(), counterName)
      };

      const qrData = JSON.stringify(qrPayload);
      
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return qrCodeDataURL;
    } catch (error) {
      logger.error('Generate counter QR code error:', error);
      throw error;
    }
  }

  // Generate signature for counter QR
  generateCounterSignature(counterId, counterName) {
    const data = `${counterId}:${counterName}:counter:${process.env.JWT_SECRET}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  // Validate counter QR code
  validateCounterQR(qrData) {
    try {
      const payload = JSON.parse(qrData);
      
      if (!payload.counterId || !payload.counterName || !payload.timestamp || !payload.signature) {
        throw new Error('Invalid counter QR code format');
      }

      const qrAge = Date.now() - payload.timestamp;
      if (qrAge > 5 * 60 * 1000) {
        throw new Error('Counter QR code has expired');
      }

      const expectedSignature = this.generateCounterSignature(payload.counterId, payload.counterName);
      
      if (payload.signature !== expectedSignature) {
        throw new Error('Invalid counter QR code signature');
      }

      return {
        counterId: payload.counterId,
        counterName: payload.counterName
      };
    } catch (error) {
      logger.error('Validate counter QR code error:', error);
      throw error;
    }
  }

  // Generate QR code for public display
  async generatePublicDisplayQR(branchId, departmentId) {
    try {
      const qrPayload = {
        branchId: branchId.toString(),
        departmentId: departmentId?.toString() || '',
        action: 'public-display',
        timestamp: Date.now(),
        signature: this.generatePublicDisplaySignature(branchId.toString(), departmentId?.toString() || '')
      };

      const qrData = JSON.stringify(qrPayload);
      
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return qrCodeDataURL;
    } catch (error) {
      logger.error('Generate public display QR code error:', error);
      throw error;
    }
  }

  // Generate signature for public display QR
  generatePublicDisplaySignature(branchId, departmentId) {
    const data = `${branchId}:${departmentId}:public-display:${process.env.JWT_SECRET}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  // Validate public display QR code
  validatePublicDisplayQR(qrData) {
    try {
      const payload = JSON.parse(qrData);
      
      if (!payload.branchId || !payload.timestamp || !payload.signature) {
        throw new Error('Invalid public display QR code format');
      }

      const qrAge = Date.now() - payload.timestamp;
      if (qrAge > 5 * 60 * 1000) {
        throw new Error('Public display QR code has expired');
      }

      const expectedSignature = this.generatePublicDisplaySignature(payload.branchId, payload.departmentId || '');
      
      if (payload.signature !== expectedSignature) {
        throw new Error('Invalid public display QR code signature');
      }

      return {
        branchId: payload.branchId,
        departmentId: payload.departmentId
      };
    } catch (error) {
      logger.error('Validate public display QR code error:', error);
      throw error;
    }
  }
}

export default new QRService();
