'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Dataset, Project, MLA, Contractor } from '@/lib/types';
import { saveDataset } from '@/lib/store';

interface AddRecordModalProps {
  dataset: Dataset;
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated: (newDataset: Dataset) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  dataset,
  isOpen,
  onClose,
  onDataUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'contractor' | 'mla'>('project');

  // New Project State
  const [projectForm, setProjectForm] = useState({
    title: '',
    category: 'Roads & Pathways',
    assemblyConstituency: dataset.constituencies[0] || 'Ludhiana East',
    sanctionedCost: 500000,
    status: 'In Progress' as 'Completed' | 'In Progress' | 'Planned',
    contractorName: dataset.contractors[0]?.name || 'MITTAL PAVERS',
    dateAwarded: new Date().toISOString().split('T')[0],
    location: 'Ludhiana City',
  });

  // New Contractor State
  const [contractorForm, setContractorForm] = useState({
    name: '',
    specialty: 'Civil Works & Road Construction',
    district: 'Ludhiana',
    state: 'Punjab',
  });

  // New MLA State
  const [mlaForm, setMlaForm] = useState({
    name: '',
    party: 'Aam Aadmi Party (AAP)',
    constituency: '',
    contact: '',
  });

  if (!isOpen) return null;

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;

    const matchedMla = dataset.mlas.find(m => m.constituency === projectForm.assemblyConstituency);
    const mlaName = matchedMla ? matchedMla.name : 'Daljit Singh Grewal (Bhola)';
    const mlaParty = matchedMla ? matchedMla.party : 'AAP';

    const newProject: Project = {
      id: `LUD-CUSTOM-${Date.now()}`,
      workId: Math.floor(100000 + Math.random() * 900000),
      title: projectForm.title,
      description: projectForm.title,
      state: 'Punjab',
      district: 'Ludhiana',
      assemblyConstituency: projectForm.assemblyConstituency,
      parliamentaryConstituency: 'Ludhiana',
      mla: mlaName,
      mlaParty: mlaParty,
      mp: dataset.parliamentaryRepresentative.name,
      category: projectForm.category,
      sanctionedCost: Number(projectForm.sanctionedCost),
      finalCost: Number(projectForm.sanctionedCost),
      status: projectForm.status,
      dateAwarded: `${projectForm.dateAwarded}T00:00:00.000Z`,
      dateCompleted: projectForm.status === 'Completed' ? `${projectForm.dateAwarded}T00:00:00.000Z` : null,
      location: projectForm.location,
      primaryContractor: projectForm.contractorName,
      contractors: [projectForm.contractorName],
      totalPaid: projectForm.status === 'Completed' ? Number(projectForm.sanctionedCost) : 0,
      paymentCount: projectForm.status === 'Completed' ? 1 : 0,
      installments: projectForm.status === 'Completed' ? [{
        installmentNumber: 1,
        date: projectForm.dateAwarded,
        amount: Number(projectForm.sanctionedCost),
        vendor: projectForm.contractorName,
        status: 'Payment Success',
        executingAgency: projectForm.location
      }] : [],
      house: 'Punjab Vidhan Sabha / Lok Sabha'
    };

    const updatedProjects = [newProject, ...dataset.projects];

    const updatedContractors = dataset.contractors.map(c => {
      if (c.name === projectForm.contractorName) {
        return {
          ...c,
          totalProjects: c.totalProjects + 1,
          completedProjects: projectForm.status === 'Completed' ? c.completedProjects + 1 : c.completedProjects,
          ongoingProjects: projectForm.status === 'In Progress' ? c.ongoingProjects + 1 : c.ongoingProjects,
          plannedProjects: projectForm.status === 'Planned' ? c.plannedProjects + 1 : c.plannedProjects,
          totalValue: c.totalValue + Number(projectForm.sanctionedCost),
          projectIds: [newProject.id, ...c.projectIds]
        };
      }
      return c;
    });

    const updatedMlas = dataset.mlas.map(m => {
      if (m.constituency === projectForm.assemblyConstituency) {
        return {
          ...m,
          totalProjects: m.totalProjects + 1,
          completedProjects: projectForm.status === 'Completed' ? m.completedProjects + 1 : m.completedProjects,
          ongoingProjects: projectForm.status === 'In Progress' ? m.ongoingProjects + 1 : m.ongoingProjects,
          plannedProjects: projectForm.status === 'Planned' ? m.plannedProjects + 1 : m.plannedProjects,
          totalSanctionedAmount: m.totalSanctionedAmount + Number(projectForm.sanctionedCost),
          totalExpenditure: projectForm.status === 'Completed' ? m.totalExpenditure + Number(projectForm.sanctionedCost) : m.totalExpenditure,
        };
      }
      return m;
    });

    const newDataset: Dataset = {
      ...dataset,
      projects: updatedProjects,
      contractors: updatedContractors,
      mlas: updatedMlas,
      metadata: {
        ...dataset.metadata,
        totalProjects: updatedProjects.length,
        totalSanctionedAmount: dataset.metadata.totalSanctionedAmount + Number(projectForm.sanctionedCost),
      }
    };

    saveDataset(newDataset);
    onDataUpdated(newDataset);
    onClose();
  };

  const handleAddContractor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorForm.name.trim()) return;

    const newContractor: Contractor = {
      id: contractorForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: contractorForm.name,
      specialty: contractorForm.specialty,
      totalProjects: 0,
      completedProjects: 0,
      ongoingProjects: 0,
      plannedProjects: 0,
      totalValue: 0,
      constituencies: [],
      mlas: [],
      projectIds: [],
      rating: 4.5,
      state: contractorForm.state,
      district: contractorForm.district,
    };

    const newDataset: Dataset = {
      ...dataset,
      contractors: [newContractor, ...dataset.contractors],
      metadata: {
        ...dataset.metadata,
        totalContractors: dataset.contractors.length + 1
      }
    };

    saveDataset(newDataset);
    onDataUpdated(newDataset);
    onClose();
  };

  const handleAddMla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mlaForm.name.trim() || !mlaForm.constituency.trim()) return;

    const newMla: MLA = {
      id: mlaForm.constituency.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: mlaForm.name,
      party: mlaForm.party,
      constituency: mlaForm.constituency,
      district: 'Ludhiana',
      state: 'Punjab',
      term: '16th Punjab Assembly (2022-2027)',
      contact: mlaForm.contact || `mla.${mlaForm.constituency.toLowerCase().replace(/\s+/g, '')}@punjab.gov.in`,
      totalProjects: 0,
      completedProjects: 0,
      ongoingProjects: 0,
      plannedProjects: 0,
      totalSanctionedAmount: 0,
      totalExpenditure: 0,
      utilizationPercentage: 0,
      contractorsCount: 0,
      topContractors: []
    };

    const newDataset: Dataset = {
      ...dataset,
      mlas: [newMla, ...dataset.mlas],
      constituencies: Array.from(new Set([...dataset.constituencies, mlaForm.constituency])),
      metadata: {
        ...dataset.metadata,
        totalMLAs: dataset.mlas.length + 1
      }
    };

    saveDataset(newDataset);
    onDataUpdated(newDataset);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6EAF0]">
          <div>
            <h3 className="text-base font-bold text-[#0B1B2F]">Add to Database</h3>
            <p className="text-xs text-[#0B1B2F]/60">Record a project, contractor, or MLA</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#0B1B2F]/50 hover:text-[#0B1B2F] rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E6EAF0] px-5 text-xs">
          <button
            onClick={() => setActiveTab('project')}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'project'
                ? 'border-[#FF7A00] text-[#0B1B2F] font-bold -mb-[1px]'
                : 'border-transparent text-[#0B1B2F]/60 hover:text-[#0B1B2F]'
            }`}
          >
            New Project
          </button>
          <button
            onClick={() => setActiveTab('contractor')}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'contractor'
                ? 'border-[#FF7A00] text-[#0B1B2F] font-bold -mb-[1px]'
                : 'border-transparent text-[#0B1B2F]/60 hover:text-[#0B1B2F]'
            }`}
          >
            New Contractor
          </button>
          <button
            onClick={() => setActiveTab('mla')}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'mla'
                ? 'border-[#FF7A00] text-[#0B1B2F] font-bold -mb-[1px]'
                : 'border-transparent text-[#0B1B2F]/60 hover:text-[#0B1B2F]'
            }`}
          >
            New MLA
          </button>
        </div>

        {/* Form */}
        <div className="p-5 overflow-y-auto text-xs">
          {activeTab === 'project' && (
            <form onSubmit={handleAddProject} className="space-y-3">
              <div>
                <label className="block font-medium text-[#0B1B2F] mb-1">Title / Description *</label>
                <textarea
                  required
                  rows={2}
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="e.g. Construction of Interlocking Street, Ward 41"
                  className="w-full text-xs p-2 border border-[#E6EAF0] rounded focus:border-[#0B1B2F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#0B1B2F] mb-1">Constituency *</label>
                  <select
                    value={projectForm.assemblyConstituency}
                    onChange={(e) => setProjectForm({ ...projectForm, assemblyConstituency: e.target.value })}
                    className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                  >
                    {dataset.constituencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#0B1B2F] mb-1">Category *</label>
                  <select
                    value={projectForm.category}
                    onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                    className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                  >
                    {dataset.categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#0B1B2F] mb-1">Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={10000}
                    value={projectForm.sanctionedCost}
                    onChange={(e) => setProjectForm({ ...projectForm, sanctionedCost: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#0B1B2F] mb-1">Status *</label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as any })}
                    className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#0B1B2F] mb-1">Contractor *</label>
                  <select
                    value={projectForm.contractorName}
                    onChange={(e) => setProjectForm({ ...projectForm, contractorName: e.target.value })}
                    className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                  >
                    {dataset.contractors.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#0B1B2F] mb-1">Awarded Date *</label>
                  <input
                    type="date"
                    required
                    value={projectForm.dateAwarded}
                    onChange={(e) => setProjectForm({ ...projectForm, dateAwarded: e.target.value })}
                    className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#0B1B2F] mb-1">Location / Ward</label>
                <input
                  type="text"
                  value={projectForm.location}
                  onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                  placeholder="e.g. Ward 41, Ludhiana"
                  className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#FF7A00] hover:bg-[#e66e00] text-[#0B1B2F] font-semibold rounded transition-colors text-xs mt-2 shadow-xs cursor-pointer"
              >
                Save Project
              </button>
            </form>
          )}

          {activeTab === 'contractor' && (
            <form onSubmit={handleAddContractor} className="space-y-3">
              <div>
                <label className="block font-medium text-[#0B1B2F] mb-1">Firm Name *</label>
                <input
                  type="text"
                  required
                  value={contractorForm.name}
                  onChange={(e) => setContractorForm({ ...contractorForm, name: e.target.value })}
                  placeholder="e.g. Punjab Civil Infrastructure"
                  className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-[#0B1B2F] mb-1">Specialty *</label>
                <input
                  type="text"
                  required
                  value={contractorForm.specialty}
                  onChange={(e) => setContractorForm({ ...contractorForm, specialty: e.target.value })}
                  placeholder="e.g. Interlocking Pavers & Road Construction"
                  className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#FF7A00] hover:bg-[#e66e00] text-[#0B1B2F] font-semibold rounded transition-colors text-xs mt-2 shadow-xs cursor-pointer"
              >
                Add Contractor
              </button>
            </form>
          )}

          {activeTab === 'mla' && (
            <form onSubmit={handleAddMla} className="space-y-3">
              <div>
                <label className="block font-medium text-[#0B1B2F] mb-1">MLA Name *</label>
                <input
                  type="text"
                  required
                  value={mlaForm.name}
                  onChange={(e) => setMlaForm({ ...mlaForm, name: e.target.value })}
                  placeholder="e.g. S. Harinder Singh"
                  className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#0B1B2F] mb-1">Constituency *</label>
                  <input
                    type="text"
                    required
                    value={mlaForm.constituency}
                    onChange={(e) => setMlaForm({ ...mlaForm, constituency: e.target.value })}
                    placeholder="e.g. Ludhiana West"
                    className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#0B1B2F] mb-1">Party *</label>
                  <input
                    type="text"
                    required
                    value={mlaForm.party}
                    onChange={(e) => setMlaForm({ ...mlaForm, party: e.target.value })}
                    className="w-full text-xs p-2 border border-[#E6EAF0] rounded"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#FF7A00] hover:bg-[#e66e00] text-[#0B1B2F] font-semibold rounded transition-colors text-xs mt-2 shadow-xs cursor-pointer"
              >
                Add MLA
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
