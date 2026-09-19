'use client';

import React from 'react';
import { MapPin, Calendar, CheckCircle2, Receipt } from 'lucide-react';
import { Project } from '@/lib/types';
import { formatDate } from '@/lib/formatters';

interface ProjectCardProps {
  project: Project;
  onOpenPayments: (project: Project) => void;
  onSelectMla: (mlaName: string) => void;
  onSelectContractor: (contractorName: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpenPayments,
  onSelectMla,
  onSelectContractor,
}) => {
  const isCompleted = project.status === 'Completed';
  const isPlanned = project.status === 'Planned';

  return (
    <div className="project-card">
      <div>
        {/* Header: Title and Category */}
        <div className="project-header">
          <h3 className="project-title">
            {project.title}
          </h3>
          <span className="project-category">
            {project.category}
          </span>
        </div>

        {/* Details: Cost, Location, Dates */}
        <div className="project-details">
          <div className="detail-item">
            <span className="rupee-icon">₹</span>
            <span className="font-semibold text-[#0B1B2F]">
              {new Intl.NumberFormat('en-IN').format(project.sanctionedCost)}
            </span>
            <span className={`status-badge ml-auto ${
              isCompleted ? 'status-completed' : isPlanned ? 'status-planned' : 'status-in-progress'
            }`}>
              {project.status}
            </span>
          </div>

          <div className="detail-item">
            <MapPin />
            <span className="truncate" title={project.location}>
              {project.location.split('(')[0] || project.assemblyConstituency}
            </span>
            {isPlanned && project.tenderStage && (
              <span className="ml-auto text-[11px] text-[#0B1B2F] bg-[#0B1B2F]/5 px-2 py-0.5 rounded border border-[#E6EAF0] font-medium">
                {project.tenderStage}
              </span>
            )}
          </div>

          <div className="detail-item">
            <Calendar />
            <span>
              {isPlanned ? 'Sanctioned: ' : 'Awarded: '}
              <strong>{formatDate(project.dateAwarded)}</strong>
            </span>
            {isCompleted && project.dateCompleted && (
              <span className="ml-auto text-xs text-[#1E9E6A] font-semibold">
                Done: {formatDate(project.dateCompleted)}
              </span>
            )}
            {isPlanned && project.plannedCompletionDate && (
              <span className="ml-auto text-xs text-[#0B1B2F]/80 font-medium">
                Target: {formatDate(project.plannedCompletionDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: MLA and Contractor info + Payments button */}
      <div className="project-footer">
        <div className="mp-info">
          <div>
            <span>MLA: </span>
            <button
              onClick={() => onSelectMla(project.mla)}
              className="font-semibold text-[#0B1B2F] hover:text-[#FF7A00] hover:underline text-left cursor-pointer"
            >
              {project.mla}
            </button>
          </div>
          <div>
            <span>Contractor: </span>
            <button
              onClick={() => onSelectContractor(project.primaryContractor)}
              className="text-[#0B1B2F]/80 hover:text-[#FF7A00] hover:underline text-left cursor-pointer font-medium"
            >
              {project.primaryContractor}
            </button>
          </div>
        </div>

        <div className="project-actions">
          <button
            type="button"
            onClick={() => onOpenPayments(project)}
            className="payment-details-btn"
            title="View payment installments"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Payments</span>
          </button>
        </div>
      </div>
    </div>
  );
};
