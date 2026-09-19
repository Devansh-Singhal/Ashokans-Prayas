import { NextResponse } from 'next/server';
import rawData from '@/lib/data/ludhiana-dataset.json';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      metadata: rawData.metadata,
      parliamentaryRepresentative: rawData.parliamentaryRepresentative,
      categoriesCount: rawData.categories.length,
      constituenciesCount: rawData.constituencies.length,
    }
  });
}
