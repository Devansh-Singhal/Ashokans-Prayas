import { NextResponse } from 'next/server';
import rawData from '@/lib/data/ludhiana-dataset.json';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      mlas: rawData.mlas,
      totalMLAs: rawData.mlas.length,
      parliamentaryRepresentative: rawData.parliamentaryRepresentative,
    }
  });
}
