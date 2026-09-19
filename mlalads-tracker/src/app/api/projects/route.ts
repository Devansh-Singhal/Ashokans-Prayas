import { NextRequest, NextResponse } from 'next/server';
import rawData from '@/lib/data/ludhiana-dataset.json';
import { Project, FilterState } from '@/lib/types';
import { filterProjects } from '@/lib/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const filters: FilterState = {
    search: searchParams.get('search') || '',
    constituency: searchParams.get('constituency') || 'all',
    status: (searchParams.get('status') as any) || 'all',
    category: searchParams.get('category') || 'all',
    year: searchParams.get('year') || 'all',
    contractor: searchParams.get('contractor') || 'all',
    mla: searchParams.get('mla') || 'all',
    minCost: Number(searchParams.get('minCost')) || 0,
    maxCost: Number(searchParams.get('maxCost')) || 50000000,
  };

  const projects = rawData.projects as unknown as Project[];
  const filtered = filterProjects(projects, filters);

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.max(1, Number(searchParams.get('limit')) || 50);
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return NextResponse.json({
    success: true,
    data: {
      projects: paginated,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filtered.length / limit),
        totalCount: filtered.length,
        limit,
      },
      summary: {
        totalCost: filtered.reduce((acc, p) => acc + (p.sanctionedCost || 0), 0),
        totalWorks: filtered.length,
      }
    }
  });
}
