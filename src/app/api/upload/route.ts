import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'atp-dev-secret-change-in-production-2024';
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types for security
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/json',
  'text/plain',
  'text/csv',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.json', '.txt', '.csv'];

interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  company?: string;
  plan?: string;
  iat?: number;
  exp?: number;
}

function validateToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomString}${ext}`;
}

function isAllowedFileType(mimeType: string, filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_TYPES.includes(mimeType) && ALLOWED_EXTENSIONS.includes(ext);
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const cookieToken = request.cookies.get('atp_token')?.value;
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      console.log('[UPLOAD] No authentication token provided');
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'No authentication token provided'
        },
        { status: 401 }
      );
    }

    // Validate JWT token
    const user = validateToken(token);

    if (!user) {
      console.log('[UPLOAD] Invalid or expired token');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
          message: 'Your session has expired. Please log in again.'
        },
        { status: 401 }
      );
    }

    console.log('[UPLOAD] Authenticated user:', user.email);

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
          message: 'Please select a file to upload'
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large',
          message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isAllowedFileType(file.type, file.name)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type',
          message: 'This file type is not allowed. Supported types: images, PDF, JSON, TXT, CSV'
        },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const userUploadDir = path.join(UPLOAD_DIR, user.userId);
    if (!existsSync(userUploadDir)) {
      await mkdir(userUploadDir, { recursive: true });
    }

    // Generate secure filename and save file
    const secureFilename = generateSecureFilename(file.name);
    const filePath = path.join(userUploadDir, secureFilename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    console.log('[UPLOAD] File saved successfully:', secureFilename);

    // Generate access URL (relative path for serving)
    const fileUrl = `/api/upload/files/${user.userId}/${secureFilename}`;

    return NextResponse.json({
      success: true,
      file: {
        id: secureFilename,
        originalName: file.name,
        filename: secureFilename,
        mimeType: file.type,
        size: file.size,
        url: fileUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.userId
      }
    });

  } catch (error) {
    console.error('[UPLOAD] Error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('token')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or expired token',
            message: 'Your session has expired. Please log in again.'
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
        message: 'An error occurred while uploading the file. Please try again.'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve upload status or list files
export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('atp_token')?.value;
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    const user = validateToken(token);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token'
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Upload endpoint ready',
      limits: {
        maxFileSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_TYPES,
        allowedExtensions: ALLOWED_EXTENSIONS
      },
      user: {
        id: user.userId,
        email: user.email
      }
    });

  } catch (error) {
    console.error('[UPLOAD] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
