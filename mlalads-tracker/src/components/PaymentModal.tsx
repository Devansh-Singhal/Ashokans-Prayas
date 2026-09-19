'use client';

import React from 'react';
import { X, CheckCircle2, Clock, IndianRupee } from 'lucide-react';
import { Project } from '@/lib/types';
import { formatRupee, formatDate } from '@/lib/formatters';

interface PaymentModalProps {
  project: Project | null;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ project, onClose }) => {
  if (!project) return null;

  const installments = project.installments || [];
  const successfulPayments = installments.filter(i => i.status.toLowerCase().includes('success')).length;
  const pendingPayments = installments.length - successfulPayments;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <h3 className="text-lg font-bold text-slate-900 font-sans">Payment Details</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="payment-modal-body overflow-y-auto">
          {/* Work Info */}
          <div className="work-info">
            <h4>Work Information</h4>
            <p className="work-description">{project.description}</p>
            <div className="work-meta">
              <span><strong>MLA:</strong> {project.mla}</span>
              <span><strong>Constituency:</strong> {project.assemblyConstituency}</span>
              <span><strong>Work ID:</strong> {project.workId}</span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="payment-summary">
            <h4>Payment Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <IndianRupee className="summary-icon" />
                <div>
                  <span className="summary-label">Total Installments</span>
                  <span className="summary-value">{installments.length || 1}</span>
                </div>
              </div>

              <div className="summary-item">
                <CheckCircle2 className="summary-icon success" />
                <div>
                  <span className="summary-label">Total Amount Paid</span>
                  <span className="summary-value">{formatRupee(project.totalPaid || project.finalCost)}</span>
                </div>
              </div>

              <div className="summary-item">
                <CheckCircle2 className="summary-icon success" />
                <div>
                  <span className="summary-label">Successful Payments</span>
                  <span className="summary-value">{successfulPayments || 1}</span>
                </div>
              </div>

              <div className="summary-item">
                <Clock className="summary-icon pending" />
                <div>
                  <span className="summary-label">Sanctioned Amount</span>
                  <span className="summary-value">{formatRupee(project.sanctionedCost)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Timeline */}
          <div className="payment-timeline">
            <h4>Payment Timeline</h4>
            <div className="timeline-container">
              {installments.length > 0 ? (
                installments.map((inst, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-date">
                      <IndianRupee className="w-4 h-4 text-blue-600" />
                      <span>{formatDate(inst.date)}</span>
                    </div>

                    <div className="timeline-content">
                      <div className="timeline-summary">
                        <span className="payment-count">Installment #{inst.installmentNumber || idx + 1}</span>
                        <span className="payment-amount">{formatRupee(inst.amount)}</span>
                      </div>

                      <div className="payment-detail">
                        <div>
                          <span className="text-slate-500 text-xs mr-2">Vendor:</span>
                          <strong className="text-slate-800">{inst.vendor || project.primaryContractor}</strong>
                        </div>
                        <span className="payment-status payment-success">
                          {inst.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1">
                        Agency: {inst.executingAgency}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm">
                  Initial sanctioned funds of {formatRupee(project.sanctionedCost)}. Disbursements pending voucher release.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
