import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import path from 'path';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'atp-dev-secret-change-in-production-2024';
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  company?: string;
  plan?: string;
}

function validateToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Map file extensions to MIME types
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; filename: string }> }
) {
  try {
    const { userId, filename } = await params;

    // Validate path components to prevent directory traversal
    if (userId.includes('..') || filename.includes('..') ||
        userId.includes('/') || filename.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Get token from cookie or Authorization header
    const cookieToken = request.cookies.get('atp_token')?.value;
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = validateToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Users can only access their own files
    if (user.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Construct file path and verify it exists
    const filePath = path.join(UPLOAD_DIR, userId, filename);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file and return with appropriate headers
    const fileBuffer = await readFile(filePath);
    const fileStat = await stat(filePath);
    const mimeType = getMimeType(filename);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileStat.size.toString(),
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('[FILE SERVE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; filename: string }> }
) {
  try {
    const { userId, filename } = await params;

    // Validate path components
    if (userId.includes('..') || filename.includes('..') ||
        userId.includes('/') || filename.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const cookieToken = request.cookies.get('atp_token')?.value;
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = validateToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (user.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const filePath = path.join(UPLOAD_DIR, userId, filename);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const { unlink } = await import('fs/promises');
    await unlink(filePath);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('[FILE DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
