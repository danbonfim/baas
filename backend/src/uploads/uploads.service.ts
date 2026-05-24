import { Injectable, BadRequestException, Logger, ServiceUnavailableException } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'

type UploadKind = 'avatar' | 'photo' | 'kyc_selfie' | 'kyc_document' | 'content' | 'story' | 'message_attachment'

interface UploadConfig {
  folder: string
  maxBytes: number
  allowedFormats: string[]
  transformation?: any[]
  /** If true, never expose the public URL — only signed time-limited URLs */
  privateAsset?: boolean
  /** Tags applied to the asset for organization + moderation */
  tags: string[]
}

const UPLOAD_CONFIGS: Record<UploadKind, UploadConfig> = {
  avatar: {
    folder: 'baas/avatars',
    maxBytes: 5 * 1024 * 1024,
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }],
    tags: ['avatar'],
  },
  photo: {
    folder: 'baas/photos',
    maxBytes: 10 * 1024 * 1024,
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, quality: 'auto:good' }],
    tags: ['photo', 'public'],
  },
  kyc_selfie: {
    folder: 'baas/kyc/selfies',
    maxBytes: 10 * 1024 * 1024,
    allowedFormats: ['jpg', 'jpeg', 'png'],
    privateAsset: true,
    tags: ['kyc', 'selfie', 'private'],
  },
  kyc_document: {
    folder: 'baas/kyc/documents',
    maxBytes: 10 * 1024 * 1024,
    allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    privateAsset: true,
    tags: ['kyc', 'document', 'private'],
  },
  content: {
    folder: 'baas/content',
    maxBytes: 100 * 1024 * 1024,
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mp3', 'm4a'],
    privateAsset: true,
    tags: ['ppv', 'private'],
  },
  story: {
    folder: 'baas/stories',
    maxBytes: 50 * 1024 * 1024,
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'mp4'],
    transformation: [{ width: 1080, quality: 'auto:good' }],
    tags: ['story'],
  },
  message_attachment: {
    folder: 'baas/messages',
    maxBytes: 25 * 1024 * 1024,
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'mp3', 'm4a'],
    privateAsset: true,
    tags: ['message', 'private'],
  },
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name)
  private configured = false

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
      this.configured = true
      this.logger.log(`Cloudinary configured (cloud: ${cloudName})`)
    } else {
      this.logger.warn('Cloudinary not configured — uploads will return 503')
    }
  }

  /**
   * Generate a signed upload payload for the frontend to use with direct upload.
   * Returns timestamp + signature + cloud_name + api_key + folder + preset config.
   * The frontend POSTs the file directly to Cloudinary using these.
   */
  generateUploadSignature(userId: string, kind: UploadKind) {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Upload service not configured. Configure CLOUDINARY_* env vars.',
      )
    }

    const config = UPLOAD_CONFIGS[kind]
    if (!config) throw new BadRequestException('Tipo de upload inválido')

    const timestamp = Math.round(Date.now() / 1000)
    const publicId = `${kind}_${userId}_${timestamp}`
    const tags = [...config.tags, `user:${userId}`].join(',')

    // Params that must be signed (alphabetical order matters)
    const paramsToSign: Record<string, any> = {
      folder: config.folder,
      public_id: publicId,
      tags,
      timestamp,
    }
    if (config.transformation) {
      paramsToSign.transformation = config.transformation
        .map((t) =>
          Object.entries(t)
            .map(([k, v]) => `${k}_${v}`)
            .join(','),
        )
        .join('/')
    }
    if (config.privateAsset) {
      paramsToSign.type = 'authenticated'
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!)

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      publicId,
      folder: config.folder,
      tags,
      transformation: paramsToSign.transformation,
      type: config.privateAsset ? 'authenticated' : 'upload',
      maxBytes: config.maxBytes,
      allowedFormats: config.allowedFormats,
      hint: 'POST as multipart/form-data with fields: file, api_key, timestamp, signature, public_id, folder, tags, transformation (if present), type (if present). Cloudinary returns { secure_url, public_id, ... }.',
    }
  }

  /**
   * Generate a time-limited signed URL for private assets (KYC, PPV content).
   * Default TTL: 5 minutes.
   */
  signPrivateUrl(publicId: string, ttlSeconds = 300, resourceType: 'image' | 'video' | 'raw' = 'image') {
    if (!this.configured) {
      throw new ServiceUnavailableException('Upload service not configured')
    }
    const expiresAt = Math.round(Date.now() / 1000) + ttlSeconds
    return cloudinary.utils.private_download_url(publicId, '', {
      resource_type: resourceType,
      expires_at: expiresAt,
    })
  }

  /**
   * Hard-delete an asset by public_id.
   */
  async deleteAsset(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
    if (!this.configured) {
      throw new ServiceUnavailableException('Upload service not configured')
    }
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true })
  }

  /**
   * Quick health check — useful for the frontend to know if uploads work.
   */
  getStatus() {
    return {
      configured: this.configured,
      cloudName: this.configured ? process.env.CLOUDINARY_CLOUD_NAME : null,
      kinds: Object.keys(UPLOAD_CONFIGS),
    }
  }
}
