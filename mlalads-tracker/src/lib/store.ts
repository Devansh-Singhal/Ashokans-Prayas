import rawData from './data/ludhiana-dataset.json';
import { Dataset, Project, MLA, Contractor, FilterState } from './types';

const INITIAL_DATA: Dataset = rawData as unknown as Dataset;
const STORAGE_KEY = 'ludhiana_mlalads_custom_data';

export function getDataset(): Dataset {
  if (typeof window === 'undefined') {
    return INITIAL_DATA;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_DATA,
        ...parsed,
        metadata: {
          ...INITIAL_DATA.metadata,
          totalProjects: parsed.projects?.length || INITIAL_DATA.metadata.totalProjects,
          totalContractors: parsed.contractors?.length || INITIAL_DATA.metadata.totalContractors,
          totalMLAs: parsed.mlas?.length || INITIAL_DATA.metadata.totalMLAs,
        }
      };
    }
  } catch (e) {
    console.error('Error loading custom data from localStorage:', e);
  }

  return INITIAL_DATA;
}

export function saveDataset(data: Dataset): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving data to localStorage:', e);
  }
}

export function resetToDefaultDataset(): Dataset {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return INITIAL_DATA;
}

export function filterProjects(projects: Project[], filters: FilterState): Project[] {
  return projects.filter((p) => {
    // Constituency filter
    if (filters.constituency && filters.constituency !== 'all') {
      if (p.assemblyConstituency !== filters.constituency) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (p.status !== filters.status) {
        return false;
      }
    }

    // Timeframe filter
    if (filters.timeframe && filters.timeframe !== 'all') {
      const awardedYear = p.dateAwarded ? parseInt(p.dateAwarded.slice(0, 4), 10) : 0;
      const completedYear = p.dateCompleted ? parseInt(p.dateCompleted.slice(0, 4), 10) : 0;

      if (filters.timeframe === 'past10years') {
        if (p.status !== 'Completed' && !(completedYear >= 2014 && completedYear <= 2024)) {
          return false;
        }
      } else if (filters.timeframe === 'ongoing') {
        if (p.status !== 'In Progress') {
          return false;
        }
      } else if (filters.timeframe === 'nearFuture') {
        if (p.status !== 'Planned' && !(awardedYear >= 2025 || (p.plannedCompletionDate && parseInt(p.plannedCompletionDate.slice(0, 4), 10) >= 2025))) {
          return false;
        }
      }
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      if (p.category !== filters.category) {
        return false;
      }
    }

    // MLA filter
    if (filters.mla && filters.mla !== 'all') {
      if (p.mla !== filters.mla) {
        return false;
      }
    }

    // Contractor filter
    if (filters.contractor && filters.contractor !== 'all') {
      if (!p.contractors.includes(filters.contractor) && p.primaryContractor !== filters.contractor) {
        return false;
      }
    }

    // Year filter (based on dateAwarded)
    if (filters.year && filters.year !== 'all') {
      const awardedYear = p.dateAwarded ? new Date(p.dateAwarded).getFullYear().toString() : '';
      const completedYear = p.dateCompleted ? new Date(p.dateCompleted).getFullYear().toString() : '';
      if (awardedYear !== filters.year && completedYear !== filters.year) {
        return false;
      }
    }

    // Cost range
    if (filters.minCost > 0 && p.sanctionedCost < filters.minCost) {
      return false;
    }
    if (filters.maxCost > 0 && p.sanctionedCost > filters.maxCost) {
      return false;
    }

    // Search query
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      const inTitle = p.title.toLowerCase().includes(q);
      const inDesc = p.description.toLowerCase().includes(q);
      const inContractor = p.primaryContractor.toLowerCase().includes(q) || p.contractors.some(c => c.toLowerCase().includes(q));
      const inMla = p.mla.toLowerCase().includes(q);
      const inLoc = p.location.toLowerCase().includes(q);
      const inId = String(p.workId).toLowerCase().includes(q) || p.id.toLowerCase().includes(q);

      if (!inTitle && !inDesc && !inContractor && !inMla && !inLoc && !inId) {
        return false;
      }
    }

    return true;
  });
}

export function exportProjectsToCSV(projects: Project[]): void {
  const headers = [
    'Work ID',
    'Title',
    'Category',
    'Assembly Constituency',
    'MLA',
    'MLA Party',
    'Contractor',
    'Sanctioned Cost (INR)',
    'Status',
    'Date Awarded',
    'Date Completed',
    'Total Paid (INR)',
    'Location'
  ];

  const rows = projects.map(p => [
    `"${p.workId}"`,
    `"${p.title.replace(/"/g, '""')}"`,
    `"${p.category}"`,
    `"${p.assemblyConstituency}"`,
    `"${p.mla}"`,
    `"${p.mlaParty}"`,
    `"${p.primaryContractor.replace(/"/g, '""')}"`,
    p.sanctionedCost,
    `"${p.status}"`,
    `"${p.dateAwarded ? p.dateAwarded.split('T')[0] : ''}"`,
    `"${p.dateCompleted ? p.dateCompleted.split('T')[0] : ''}"`,
    p.totalPaid,
    `"${p.location.replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ludhiana_projects_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
