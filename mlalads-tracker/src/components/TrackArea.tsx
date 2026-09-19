'use client';

import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  Layers
} from 'lucide-react';
import { Dataset, Project, MLA, Contractor, FilterState } from '@/lib/types';
import { filterProjects } from '@/lib/store';
import { formatRupee } from '@/lib/formatters';
import { ProjectCard } from './ProjectCard';
import { PaymentModal } from './PaymentModal';
import { MlaModal } from './MlaModal';
import { ContractorModal } from './ContractorModal';

interface TrackAreaProps {
  dataset: Dataset;
}

const ITEMS_PER_PAGE = 20;

export const TrackArea: React.FC<TrackAreaProps> = ({ dataset }) => {
  const maxProjectCost = useMemo(() => {
    const maxVal = Math.max(...dataset.projects.map(p => p.sanctionedCost || 0), 50000000);
    return Math.ceil(maxVal / 10000000) * 10000000;
  }, [dataset.projects]);

  const [filters, setFilters] = useState<FilterState>(() => {
    const maxVal = Math.max(...dataset.projects.map(p => p.sanctionedCost || 0), 50000000);
    const ceiling = Math.ceil(maxVal / 10000000) * 10000000;
    return {
      search: '',
      constituency: 'all',
      status: 'all',
      category: 'all',
      year: 'all',
      contractor: 'all',
      mla: 'all',
      minCost: 0,
      maxCost: ceiling,
    };
  });

  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals
  const [selectedPaymentProject, setSelectedPaymentProject] = useState<Project | null>(null);
  const [selectedMla, setSelectedMla] = useState<MLA | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return filterProjects(dataset.projects, filters);
  }, [dataset.projects, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  // Counts by status
  const completedCount = useMemo(() => {
    return dataset.projects.filter(p => {
      if (filters.constituency !== 'all' && p.assemblyConstituency !== filters.constituency) return false;
      return p.status === 'Completed';
    }).length;
  }, [dataset.projects, filters.constituency]);

  const ongoingCount = useMemo(() => {
    return dataset.projects.filter(p => {
      if (filters.constituency !== 'all' && p.assemblyConstituency !== filters.constituency) return false;
      return p.status === 'In Progress';
    }).length;
  }, [dataset.projects, filters.constituency]);

  const plannedCount = useMemo(() => {
    return dataset.projects.filter(p => {
      if (filters.constituency !== 'all' && p.assemblyConstituency !== filters.constituency) return false;
      return p.status === 'Planned';
    }).length;
  }, [dataset.projects, filters.constituency]);

  // Aggregated summary stats
  const summary = useMemo(() => {
    const totalCost = filteredProjects.reduce((acc, p) => acc + (p.sanctionedCost || 0), 0);
    const uniqueContractors = new Set(filteredProjects.map(p => p.primaryContractor)).size;
    const currentMla = filters.constituency !== 'all' 
      ? dataset.mlas.find(m => m.constituency === filters.constituency)
      : null;

    return {
      totalProjects: filteredProjects.length,
      totalCost,
      uniqueContractors,
      currentMla,
    };
  }, [filteredProjects, filters.constituency, dataset.mlas]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      constituency: 'all',
      status: 'all',
      category: 'all',
      year: 'all',
      contractor: 'all',
      mla: 'all',
      minCost: 0,
      maxCost: maxProjectCost,
    });
    setCurrentPage(1);
  };

  const handleSelectMlaByName = (name: string) => {
    const mlaObj = dataset.mlas.find(m => m.name.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(m.name.toLowerCase()));
    if (mlaObj) {
      setSelectedMla(mlaObj);
    }
  };

  const handleSelectContractorByName = (name: string) => {
    const contractorObj = dataset.contractors.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (contractorObj) {
      setSelectedContractor(contractorObj);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    dataset.projects.forEach(p => {
      if (p.dateAwarded) years.add(new Date(p.dateAwarded).getFullYear().toString());
      if (p.dateCompleted) years.add(new Date(p.dateCompleted).getFullYear().toString());
      if (p.plannedCompletionDate) years.add(new Date(p.plannedCompletionDate).getFullYear().toString());
    });
    return Array.from(years).sort().reverse();
  }, [dataset.projects]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* 1. Track Area Header (Original Empowered Indian Style) */}
      <div className="track-area-header">
        <div className="header-icon">
          <MapPin size={48} />
        </div>
        <h1>Find Projects in My Constituency</h1>
        <p>Search and explore MLALADS and public infrastructure works in your area across past 10 years, ongoing projects, and planned future works</p>
      </div>

      {/* 2. Search Form (Original Empowered Indian Style) */}
      <div className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="state">State (Optional)</label>
            <select id="state" disabled value="Punjab">
              <option value="Punjab">Punjab</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="constituency">Constituency *</label>
            <select 
              id="constituency"
              value={filters.constituency}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, constituency: e.target.value }));
                setCurrentPage(1);
              }}
              required
            >
              <option value="all">All Ludhiana Constituencies ({dataset.projects.length} works)</option>
              {dataset.constituencies.map(c => {
                const count = dataset.projects.filter(p => p.assemblyConstituency === c).length;
                return (
                  <option key={c} value={c}>
                    {c} (Punjab) - {count} works
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleResetFilters} 
            className="btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* 3. Project Listing Component (Original Empowered Indian Layout) */}
      <div className="project-listing">
        {/* Listing Header: Tabs & Summary Stats */}
        <div className="project-listing-header">
          <div className="project-tabs">
            <button
              type="button"
              onClick={() => {
                setFilters(prev => ({ ...prev, status: 'all' }));
                setCurrentPage(1);
              }}
              className={`tab-btn ${filters.status === 'all' ? 'active' : ''}`}
            >
              All Works ({completedCount + ongoingCount + plannedCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilters(prev => ({ ...prev, status: 'Planned' }));
                setCurrentPage(1);
              }}
              className={`tab-btn ${filters.status === 'Planned' ? 'active' : ''}`}
            >
              Planned / Upcoming ({plannedCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilters(prev => ({ ...prev, status: 'In Progress' }));
                setCurrentPage(1);
              }}
              className={`tab-btn ${filters.status === 'In Progress' ? 'active' : ''}`}
            >
              Ongoing Works ({ongoingCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilters(prev => ({ ...prev, status: 'Completed' }));
                setCurrentPage(1);
              }}
              className={`tab-btn ${filters.status === 'Completed' ? 'active' : ''}`}
            >
              Completed (Past 10 Yrs) ({completedCount})
            </button>
          </div>

          <div className="project-summary">
            <div className="summary-stat">
              <span className="stat-value">{summary.totalProjects}</span>
              <span className="stat-label">Total Projects</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{formatRupee(summary.totalCost, { compact: true })}</span>
              <span className="stat-label">
                {filters.status === 'Completed' ? 'Total Cost (10 Yrs)' : filters.status === 'Planned' ? 'Planned Budget' : 'Sanctioned Cost'}
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{summary.uniqueContractors}</span>
              <span className="stat-label">Contractors</span>
            </div>
            {summary.currentMla && (
              <div 
                className="summary-stat cursor-pointer group"
                onClick={() => setSelectedMla(summary.currentMla || null)}
                title="Click to view MLA profile"
              >
                <span className="stat-value text-[#0B1B2F] group-hover:text-[#FF7A00] group-hover:underline text-base font-bold">
                  {summary.currentMla.name}
                </span>
                <span className="stat-label text-[11px]">MLA ({summary.currentMla.party})</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="project-filters">
          <div className="filters-header">
            <button
              type="button"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="filters-toggle"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <div className="search-box">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects, wards, contractors..."
                value={filters.search}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, search: e.target.value }));
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {showFiltersPanel && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, category: e.target.value }));
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Categories</option>
                  {dataset.categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, year: e.target.value }));
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Years</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Contractor</label>
                <select
                  value={filters.contractor}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, contractor: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="max-w-xs truncate"
                >
                  <option value="all">All Contractors ({dataset.contractors.length})</option>
                  {dataset.contractors.map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.totalProjects})</option>
                  ))}
                </select>
              </div>

              <div className="filter-group cost-range-group">
                <label>
                  <span>Max Project Cost</span>
                  <strong className="text-[#0B1B2F] font-bold tabular-nums">
                    {filters.maxCost >= maxProjectCost ? 'All Costs' : formatRupee(filters.maxCost, { compact: true })}
                  </strong>
                </label>
                <input
                  type="range"
                  min={500000}
                  max={maxProjectCost}
                  step={500000}
                  value={filters.maxCost}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, maxCost: Number(e.target.value) }));
                    setCurrentPage(1);
                  }}
                  className="w-full"
                />
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="clear-filters-btn"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Projects Grid */}
        <div className="projects-container">
          {paginatedProjects.length === 0 ? (
            <div className="no-projects">
              <p>No projects found for the selected filters.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {paginatedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpenPayments={(p) => setSelectedPaymentProject(p)}
                  onSelectMla={(mlaName) => handleSelectMlaByName(mlaName)}
                  onSelectContractor={(conName) => handleSelectContractorByName(conName)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="project-pagination">
            <div className="pagination-info">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of{' '}
              {filteredProjects.length} projects
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => {
                  setCurrentPage(1);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                title="First page"
              >
                ««
              </button>
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => {
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                title="Previous page"
              >
                ‹
              </button>

              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setCurrentPage(prev => Math.min(prev + 1, totalPages));
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                title="Next page"
              >
                ›
              </button>
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setCurrentPage(totalPages);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                title="Last page"
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedPaymentProject && (
        <PaymentModal
          project={selectedPaymentProject}
          onClose={() => setSelectedPaymentProject(null)}
        />
      )}

      {selectedMla && (
        <MlaModal
          mla={selectedMla}
          projects={dataset.projects}
          onClose={() => setSelectedMla(null)}
          onSelectProject={(p) => {
            setSelectedMla(null);
            setSelectedPaymentProject(p);
          }}
          onSelectContractorName={(conName) => {
            setSelectedMla(null);
            handleSelectContractorByName(conName);
          }}
        />
      )}

      {selectedContractor && (
        <ContractorModal
          contractor={selectedContractor}
          projects={dataset.projects}
          onClose={() => setSelectedContractor(null)}
          onSelectProject={(p) => {
            setSelectedContractor(null);
            setSelectedPaymentProject(p);
          }}
          onSelectMlaName={(mlaName) => {
            setSelectedContractor(null);
            handleSelectMlaByName(mlaName);
          }}
        />
      )}
    </div>
  );
};
