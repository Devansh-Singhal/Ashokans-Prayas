'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MLA, Project } from '@/lib/types';
import { formatRupee, formatDate } from '@/lib/formatters';

interface MlaModalProps {
  mla: MLA | null;
  projects: Project[];
  onClose: () => void;
  onSelectProject?: (project: Project) => void;
  onSelectContractorName?: (name: string) => void;
}

export const MlaModal: React.FC<MlaModalProps> = ({
  mla,
  projects,
  onClose,
  onSelectProject,
  onSelectContractorName
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'Planned' | 'In Progress' | 'Completed'>('all');

  if (!mla) return null;

  const mlaProjects = projects.filter(p => p.assemblyConstituency === mla.constituency);
  const filteredProjects = activeTab === 'all' 
    ? mlaProjects 
    : mlaProjects.filter(p => p.status === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#E6EAF0]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#0B1B2F]/60 tracking-wider">
              {mla.constituency} Constituency • {mla.party}
            </span>
            <h3 className="text-lg font-bold text-[#0B1B2F] leading-snug">{mla.name}</h3>
            <p className="text-xs text-[#0B1B2F]/60 mt-0.5">{mla.term} • {mla.contact}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#0B1B2F]/50 hover:text-[#0B1B2F] rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Key Metrics */}
          <div className="border border-[#E6EAF0] rounded p-3 grid grid-cols-5 gap-2 text-left bg-[#FAF7F2]/40">
            <div>
              <span className="block text-[10px] text-[#0B1B2F]/60 uppercase">Total Works</span>
              <span className="text-base font-bold text-[#0B1B2F]">{mla.totalProjects}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#0B1B2F]/60 uppercase">10-Yr Done</span>
              <span className="text-base font-bold text-[#1E9E6A]">{mla.completedProjects}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#0B1B2F]/60 uppercase">Active/Plan</span>
              <span className="text-base font-bold text-[#0B1B2F]">{mla.ongoingProjects + mla.plannedProjects}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#0B1B2F]/60 uppercase">Sanctioned</span>
              <span className="text-base font-bold text-[#0B1B2F]">{formatRupee(mla.totalSanctionedAmount, { compact: true })}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#0B1B2F]/60 uppercase">Utilized</span>
              <span className="text-base font-bold text-[#0B1B2F]">{mla.utilizationPercentage}%</span>
            </div>
          </div>

          {/* Top Contractors */}
          {mla.topContractors && mla.topContractors.length > 0 && (
            <div>
              <span className="block text-[10px] uppercase font-bold text-[#0B1B2F]/60 tracking-wider mb-2">
                Primary Contractors
              </span>
              <div className="flex flex-wrap gap-1.5">
                {mla.topContractors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectContractorName && onSelectContractorName(c)}
                    className="px-2 py-1 bg-white hover:bg-[#FAF7F2] border border-[#E6EAF0] rounded text-[#0B1B2F] text-xs transition-colors cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Project History */}
          <div>
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#E6EAF0]">
              <span className="text-[10px] uppercase font-bold text-[#0B1B2F]/60 tracking-wider">
                Projects ({filteredProjects.length})
              </span>
              <div className="flex space-x-2 text-[11px]">
                {(['all', 'Planned', 'In Progress', 'Completed'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`font-medium transition-colors cursor-pointer ${
                      activeTab === tab ? 'text-[#FF7A00] font-bold underline' : 'text-[#0B1B2F]/50 hover:text-[#0B1B2F]'
                    }`}
                  >
                    {tab === 'all' ? 'All' : tab === 'Completed' ? '10-Yr Done' : tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-[#E6EAF0] rounded divide-y divide-[#E6EAF0] max-h-64 overflow-y-auto">
              {filteredProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelectProject && onSelectProject(p)}
                  className="p-3 hover:bg-[#FAF7F2] cursor-pointer flex items-start justify-between gap-3 transition-colors"
                >
                  <div>
                    <p className="font-medium text-[#0B1B2F] line-clamp-1">{p.title}</p>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span>{p.category}</span> • <span>Contractor: {p.primaryContractor}</span> • <span>Awarded: {formatDate(p.dateAwarded)}</span>
                      {p.status === 'Planned' && p.tenderStage && <span> • <strong className="text-indigo-600">{p.tenderStage}</strong></span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900">{formatRupee(p.sanctionedCost)}</span>
                    <span className={`block text-[10px] font-medium ${
                      p.status === 'Completed' ? 'text-emerald-700' : p.status === 'Planned' ? 'text-indigo-700' : 'text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
