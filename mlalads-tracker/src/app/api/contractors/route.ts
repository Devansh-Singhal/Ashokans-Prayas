import { NextRequest, NextResponse } from 'next/server';
import rawData from '@/lib/data/ludhiana-dataset.json';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase();
  const specialty = searchParams.get('specialty');

  let contractors = rawData.contractors;

  if (specialty && specialty !== 'all') {
    contractors = contractors.filter(c => c.specialty === specialty);
  }

  if (search) {
    contractors = contractors.filter(c => 
      c.name.toLowerCase().includes(search) || c.specialty.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      contractors,
      totalContractors: contractors.length,
    }
  });
}
