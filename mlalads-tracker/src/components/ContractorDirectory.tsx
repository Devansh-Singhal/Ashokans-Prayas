'use client';

import React, { useState, useMemo } from 'react';
import { HardHat, MapPin, ChevronRight, Star, CheckCircle, Clock } from 'lucide-react';
import { Dataset, Contractor } from '@/lib/types';
import { formatRupee } from '@/lib/formatters';
import { ContractorModal } from './ContractorModal';

interface ContractorDirectoryProps {
  dataset: Dataset;
}

export const ContractorDirectory: React.FC<ContractorDirectoryProps> = ({ dataset }) => {
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'projects' | 'value' | 'rating'>('projects');
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  const specialties = useMemo(() => {
    return Array.from(new Set(dataset.contractors.map(c => c.specialty))).sort();
  }, [dataset.contractors]);

  const filteredContractors = useMemo(() => {
    return dataset.contractors
      .filter(c => {
        if (specialtyFilter !== 'all' && c.specialty !== specialtyFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return c.name.toLowerCase().includes(q) || c.specialty.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'projects') return b.totalProjects - a.totalProjects;
        if (sortBy === 'value') return b.totalValue - a.totalValue;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0;
      });
  }, [dataset.contractors, search, specialtyFilter, sortBy]);

  const totalContractValue = useMemo(() => {
    return dataset.contractors.reduce((acc, c) => acc + (c.totalValue || 0), 0);
  }, [dataset.contractors]);

  const totalDoneProjects = useMemo(() => {
    return dataset.contractors.reduce((acc, c) => acc + (c.completedProjects || 0), 0);
  }, [dataset.contractors]);

  const handleResetFilters = () => {
    setSearch('');
    setSpecialtyFilter('all');
    setSortBy('projects');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 1. Uniform Header */}
      <div className="track-area-header">
        <div className="header-icon">
          <HardHat size={48} />
        </div>
        <h1>Contractors & Executing Agencies</h1>
        <p>Directory of all {dataset.contractors.length} executing agencies, suppliers, and contractors awarded public infrastructure works in Ludhiana over the past 10 years and upcoming projects</p>
      </div>

      {/* 2. Uniform Search Form */}
      <div className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="contractor-search">Search Contractor or Trade</label>
            <input
              id="contractor-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Mittal Pavers, Dashmesh Tiles, JBBL Solar, Garden Gym..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialty-select">Specialty / Trade</label>
            <select
              id="specialty-select"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            >
              <option value="all">All Specialties ({specialties.length})</option>
              {specialties.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
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

      {/* 3. Uniform Listing Component */}
      <div className="project-listing">
        <div className="project-listing-header">
          <div className="project-tabs">
            <button
              type="button"
              onClick={() => { setSpecialtyFilter('all'); setSortBy('projects'); }}
              className={`tab-btn ${specialtyFilter === 'all' && sortBy === 'projects' ? 'active' : ''}`}
            >
              All Contractors ({dataset.contractors.length})
            </button>
            <button
              type="button"
              onClick={() => { setSortBy('value'); }}
              className={`tab-btn ${sortBy === 'value' ? 'active' : ''}`}
            >
              Highest Value Awarded
            </button>
            <button
              type="button"
              onClick={() => { setSortBy('projects'); }}
              className={`tab-btn ${sortBy === 'projects' ? 'active' : ''}`}
            >
              Most Works Executed
            </button>
            <button
              type="button"
              onClick={() => { setSortBy('rating'); }}
              className={`tab-btn ${sortBy === 'rating' ? 'active' : ''}`}
            >
              Top Rated
            </button>
          </div>

          <div className="project-summary">
            <div className="summary-stat">
              <span className="stat-value">{dataset.contractors.length}</span>
              <span className="stat-label">Contractors</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{totalDoneProjects}</span>
              <span className="stat-label">10-Yr Works Done</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{formatRupee(totalContractValue, { compact: true })}</span>
              <span className="stat-label">Total Awarded</span>
            </div>
          </div>
        </div>

        {/* Contractors Grid */}
        <div className="projects-container">
          {filteredContractors.length === 0 ? (
            <div className="no-projects">
              <p>No contractors found matching your criteria.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {filteredContractors.map((contractor) => (
                <div key={contractor.id} className="project-card">
                  <div>
                    <div className="project-header">
                      <h3 className="project-title line-clamp-1" title={contractor.name}>
                        {contractor.name}
                      </h3>
                      <span className="project-category">
                        {contractor.specialty.split('&')[0]}
                      </span>
                    </div>

                    <div className="project-details">
                      <div className="detail-item">
                        <span className="rupee-icon">₹</span>
                        <span className="font-semibold text-[#0B1B2F]">
                          {formatRupee(contractor.totalValue, { compact: true })}
                        </span>
                        <span className="ml-auto flex items-center space-x-1 text-xs font-semibold text-[#0B1B2F] bg-[#FFC21A]/10 px-2 py-0.5 rounded border border-[#FFC21A]/30">
                          <Star className="w-3 h-3 fill-[#FFC21A] text-[#FFC21A]" />
                          <span>{contractor.rating}</span>
                        </span>
                      </div>

                      <div className="detail-item">
                        <CheckCircle className="w-4 h-4 text-[#1E9E6A] shrink-0" />
                        <span>
                          Completed (10 Yrs): <strong>{contractor.completedProjects} works</strong>
                        </span>
                      </div>

                      <div className="detail-item">
                        <Clock className="w-4 h-4 text-[#0B1B2F]/60 shrink-0" />
                        <span>
                          Active / Planned: <strong>{contractor.ongoingProjects + contractor.plannedProjects} works</strong>
                        </span>
                      </div>

                      <div className="detail-item">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate" title={contractor.constituencies.join(', ')}>
                          Areas: <strong>{contractor.constituencies.slice(0, 2).join(', ')}</strong>
                          {contractor.constituencies.length > 2 && ` +${contractor.constituencies.length - 2} more`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="project-footer">
                    <div className="mp-info">
                      <strong>Total Portfolio: {contractor.totalProjects} Works</strong>
                      <span>Ludhiana, Punjab</span>
                    </div>

                    <div className="project-actions">
                      <button
                        type="button"
                        onClick={() => setSelectedContractor(contractor)}
                        className="payment-details-btn"
                        title="View complete works portfolio"
                      >
                        <span>Portfolio</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedContractor && (
        <ContractorModal
          contractor={selectedContractor}
          projects={dataset.projects}
          onClose={() => setSelectedContractor(null)}
        />
      )}
    </div>
  );
};
