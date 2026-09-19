'use client';

import React, { useState, useMemo } from 'react';
import { Users, MapPin, ChevronRight, Briefcase, HardHat } from 'lucide-react';
import { Dataset, MLA } from '@/lib/types';
import { formatRupee } from '@/lib/formatters';
import { MlaModal } from './MlaModal';

interface MlaDirectoryProps {
  dataset: Dataset;
}

export const MlaDirectory: React.FC<MlaDirectoryProps> = ({ dataset }) => {
  const [search, setSearch] = useState('');
  const [partyFilter, setPartyFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'projects' | 'budget' | 'utilization'>('projects');
  const [selectedMla, setSelectedMla] = useState<MLA | null>(null);

  const parties = useMemo(() => {
    return Array.from(new Set(dataset.mlas.map(m => m.party))).sort();
  }, [dataset.mlas]);

  const filteredMlas = useMemo(() => {
    return dataset.mlas
      .filter(m => {
        if (partyFilter !== 'all' && m.party !== partyFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return m.name.toLowerCase().includes(q) || m.constituency.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'projects') return b.totalProjects - a.totalProjects;
        if (sortBy === 'budget') return b.totalSanctionedAmount - a.totalSanctionedAmount;
        if (sortBy === 'utilization') return b.utilizationPercentage - a.utilizationPercentage;
        return 0;
      });
  }, [dataset.mlas, search, partyFilter, sortBy]);

  const totalSanctioned = useMemo(() => {
    return dataset.mlas.reduce((acc, m) => acc + (m.totalSanctionedAmount || 0), 0);
  }, [dataset.mlas]);

  const avgUtilization = useMemo(() => {
    if (!dataset.mlas.length) return 0;
    const total = dataset.mlas.reduce((acc, m) => acc + (m.utilizationPercentage || 0), 0);
    return Math.round(total / dataset.mlas.length);
  }, [dataset.mlas]);

  const aapCount = useMemo(() => {
    return dataset.mlas.filter(m => m.party.includes('AAP')).length;
  }, [dataset.mlas]);

  const handleResetFilters = () => {
    setSearch('');
    setPartyFilter('all');
    setSortBy('projects');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 1. Uniform Header */}
      <div className="track-area-header">
        <div className="header-icon">
          <Users size={48} />
        </div>
        <h1>Members of Legislative Assembly (MLAs)</h1>
        <p>Track project allocations, fund utilization, contractor engagements, and public works portfolio across all 14 constituencies of Ludhiana</p>
      </div>

      {/* 2. Uniform Search Form */}
      <div className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mla-search">Search MLA or Constituency</label>
            <input
              id="mla-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Gurpreet Bassi Gogi, Ludhiana West, Atam Nagar..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="party-select">Political Party</label>
            <select
              id="party-select"
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
            >
              <option value="all">All Political Parties</option>
              {parties.map(p => (
                <option key={p} value={p}>{p}</option>
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
              onClick={() => { setPartyFilter('all'); setSortBy('projects'); }}
              className={`tab-btn ${partyFilter === 'all' && sortBy === 'projects' ? 'active' : ''}`}
            >
              All MLAs ({dataset.mlas.length})
            </button>
            <button
              type="button"
              onClick={() => { setPartyFilter('Aam Aadmi Party (AAP)'); }}
              className={`tab-btn ${partyFilter === 'Aam Aadmi Party (AAP)' ? 'active' : ''}`}
            >
              Ruling Party AAP ({aapCount})
            </button>
            <button
              type="button"
              onClick={() => { setSortBy('utilization'); }}
              className={`tab-btn ${sortBy === 'utilization' ? 'active' : ''}`}
            >
              Highest Utilization
            </button>
            <button
              type="button"
              onClick={() => { setSortBy('budget'); }}
              className={`tab-btn ${sortBy === 'budget' ? 'active' : ''}`}
            >
              Highest Budget
            </button>
          </div>

          <div className="project-summary">
            <div className="summary-stat">
              <span className="stat-value">{dataset.mlas.length}</span>
              <span className="stat-label">Total MLAs</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{formatRupee(totalSanctioned, { compact: true })}</span>
              <span className="stat-label">Total Sanctioned</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{avgUtilization}%</span>
              <span className="stat-label">Avg Utilization</span>
            </div>
          </div>
        </div>

        {/* MLAs Grid */}
        <div className="projects-container">
          {filteredMlas.length === 0 ? (
            <div className="no-projects">
              <p>No MLAs found matching your criteria.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {filteredMlas.map((mla) => (
                <div key={mla.id} className="project-card">
                  <div>
                    <div className="project-header">
                      <h3 className="project-title">{mla.name}</h3>
                      <span className="project-category">
                        {mla.party.split('(')[1]?.replace(')', '') || mla.party}
                      </span>
                    </div>

                    <div className="project-details">
                      <div className="detail-item">
                        <MapPin />
                        <span className="font-semibold text-[#0B1B2F]">
                          {mla.constituency} (Ludhiana)
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="rupee-icon">₹</span>
                        <span>Sanctioned: <strong>{formatRupee(mla.totalSanctionedAmount, { compact: true })}</strong></span>
                        <span className="ml-auto text-xs text-[#0B1B2F]/70">
                          Utilized: <strong className="text-[#1E9E6A] font-semibold">{mla.utilizationPercentage}%</strong>
                        </span>
                      </div>

                      <div className="detail-item">
                        <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          Works: <strong>{mla.totalProjects} total</strong> ({mla.completedProjects} done, {mla.ongoingProjects} active, {mla.plannedProjects} planned)
                        </span>
                      </div>

                      <div className="detail-item">
                        <HardHat className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Contractors: <strong>{mla.contractorsCount} firms</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="project-footer">
                    <div className="mp-info">
                      <strong>{mla.term.split('(')[0]}</strong>
                      <span>{mla.contact}</span>
                    </div>

                    <div className="project-actions">
                      <button
                        type="button"
                        onClick={() => setSelectedMla(mla)}
                        className="payment-details-btn"
                        title="View complete project portfolio"
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

      {selectedMla && (
        <MlaModal
          mla={selectedMla}
          projects={dataset.projects}
          onClose={() => setSelectedMla(null)}
        />
      )}
    </div>
  );
};
