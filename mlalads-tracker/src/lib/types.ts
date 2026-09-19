export interface PaymentInstallment {
  installmentNumber: number;
  date: string;
  amount: number;
  vendor: string;
  status: string;
  executingAgency: string;
}

export interface Project {
  id: string;
  workId: number | string;
  title: string;
  description: string;
  state: string;
  district: string;
  assemblyConstituency: string;
  parliamentaryConstituency: string;
  mla: string;
  mlaParty: string;
  mp: string;
  category: string;
  sanctionedCost: number;
  finalCost: number;
  status: 'Completed' | 'In Progress' | 'Planned' | 'Recommended';
  dateAwarded: string; // The date project was given / awarded / sanctioned
  dateCompleted: string | null; // The date project was completed
  plannedCompletionDate?: string | null; // Expected date for upcoming / planned works
  tenderStage?: string; // e.g., 'DPR Approved', 'Tender Floated', 'Work Order Issued'
  location: string;
  primaryContractor: string;
  contractors: string[];
  totalPaid: number;
  paymentCount: number;
  installments: PaymentInstallment[];
  house: string;
}

export interface MLA {
  id: string;
  name: string;
  party: string;
  constituency: string;
  district: string;
  state: string;
  term: string;
  contact: string;
  totalProjects: number;
  completedProjects: number;
  ongoingProjects: number;
  plannedProjects: number;
  totalSanctionedAmount: number;
  totalExpenditure: number;
  utilizationPercentage: number;
  contractorsCount: number;
  topContractors: string[];
}

export interface Contractor {
  id: string;
  name: string;
  specialty: string;
  totalProjects: number;
  completedProjects: number;
  ongoingProjects: number;
  plannedProjects: number;
  totalValue: number;
  constituencies: string[];
  mlas: string[];
  projectIds: string[];
  rating: number;
  state: string;
  district: string;
}

export interface DatasetMetadata {
  region: string;
  scrapedAt: string;
  totalProjects: number;
  totalCompletedWorks: number;
  totalOngoingWorks: number;
  totalPlannedWorks: number;
  totalSanctionedAmount: number;
  totalExpenditure: number;
  totalContractors: number;
  totalMLAs: number;
  source: string;
}

export interface Dataset {
  metadata: DatasetMetadata;
  parliamentaryRepresentative: {
    name: string;
    party: string;
    role: string;
    constituency: string;
    term: string;
  };
  mlas: MLA[];
  contractors: Contractor[];
  projects: Project[];
  categories: string[];
  constituencies: string[];
}

export interface FilterState {
  search: string;
  constituency: string;
  status: 'all' | 'Completed' | 'In Progress' | 'Planned';
  timeframe?: 'all' | 'past10years' | 'ongoing' | 'nearFuture';
  category: string;
  year: string;
  contractor: string;
  mla: string;
  minCost: number;
  maxCost: number;
}
