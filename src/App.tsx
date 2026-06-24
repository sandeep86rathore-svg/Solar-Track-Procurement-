import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Table,
  FileText,
  Users,
  FolderOpen,
  History,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Wrench,
  ShieldCheck,
  Download,
  ChevronRight,
  Sparkles,
  DollarSign,
  Building2,
  X,
  UploadCloud,
  AlertCircle,
  FileSpreadsheet,
  Check,
  RefreshCw,
  Printer,
  Mail,
  Send
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// --- TYPES & INTERFACES ---
type MaterialCategory = 'Modules' | 'Inverters' | 'Structures' | 'Cables' | 'Transformers' | 'SCADA' | 'BOS Equipment';
type WorkflowStage = 'RFQ' | 'Quotation' | 'PO Issued' | 'Manufacturing' | 'Dispatch' | 'In Transit' | 'Delivered' | 'Installed';
type Role = 'Admin' | 'Procurement Manager' | 'Project Manager' | 'Viewer';

interface Doc {
  id: string;
  name: string;
  type: 'RFQ' | 'Quotation' | 'PO' | 'Invoice' | 'Challan';
  uploadDate: string;
  size: string;
}

interface ProcurementItem {
  id: string; // PO Number
  package: string;
  category: MaterialCategory;
  vendorId: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  status: WorkflowStage;
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string | null;
  project: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskNotes: string;
  isDelayed: boolean;
  pendingApproval: boolean;
  approvedBy: string | null;
  documents: Doc[];
  lastStatusChangeDate: string;
}

interface Vendor {
  id: string;
  name: string;
  category: MaterialCategory;
  score: number;
  deliveryRating: number;
  qualityRating: number;
  onTimeDeliveryRate: number;
  completedPOs: number;
  activePOs: number;
  contactName: string;
  contactEmail: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  action: string;
  details: string;
}

// --- CONSTANTS ---
const CATEGORIES: MaterialCategory[] = ['Modules', 'Inverters', 'Structures', 'Cables', 'Transformers', 'SCADA', 'BOS Equipment'];
const STAGES: WorkflowStage[] = ['RFQ', 'Quotation', 'PO Issued', 'Manufacturing', 'Dispatch', 'In Transit', 'Delivered', 'Installed'];
const STAGE_PROGRESS: Record<WorkflowStage, number> = {
  'RFQ': 12, 'Quotation': 25, 'PO Issued': 45, 'Manufacturing': 60, 'Dispatch': 72, 'In Transit': 85, 'Delivered': 92, 'Installed': 100
};

const STAGE_COLORS: Record<WorkflowStage, string> = {
  'RFQ': 'bg-gray-100 text-gray-700 border-gray-300',
  'Quotation': 'bg-purple-100 text-purple-700 border-purple-300',
  'PO Issued': 'bg-teal-100 text-teal-700 border-teal-300',
  'Manufacturing': 'bg-amber-100 text-amber-700 border-amber-300',
  'Dispatch': 'bg-blue-50 text-blue-700 border-blue-200',
  'In Transit': 'bg-blue-100 text-blue-700 border-blue-300',
  'Delivered': 'bg-green-100 text-green-700 border-green-300',
  'Installed': 'bg-emerald-600 text-white border-emerald-700'
};

const ROLE_USERS: Record<Role, { name: string; email: string; avatar: string }> = {
  'Admin': { name: 'Sandeep Kumar Rathore', email: 'sandeep86rathore@gmail.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop' },
  'Procurement Manager': { name: 'Sarah Connor', email: 's.connor@helios.energy', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop' },
  'Project Manager': { name: 'Marcus Wright', email: 'm.wright@helios.energy', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&fit=crop' },
  'Viewer': { name: 'Kate Brewster', email: 'k.brewster@helios.energy', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop' }
};

// --- INITIAL MOCK DATA ---
const INITIAL_VENDORS: Vendor[] = [
  { id: 'V-01', name: 'Jinko Solar Co. Ltd', category: 'Modules', score: 95, deliveryRating: 4.8, qualityRating: 4.9, onTimeDeliveryRate: 98, completedPOs: 12, activePOs: 2, contactName: 'Wang Wei', contactEmail: 'w.wei@jinkosolar.com' },
  { id: 'V-02', name: 'Sungrow Power Supply', category: 'Inverters', score: 91, deliveryRating: 4.5, qualityRating: 4.6, onTimeDeliveryRate: 92, completedPOs: 8, activePOs: 1, contactName: 'Hans Schneider', contactEmail: 'h.schneider@sungrow.ca' },
  { id: 'V-03', name: 'NextTracker Inc.', category: 'Structures', score: 97, deliveryRating: 4.9, qualityRating: 4.8, onTimeDeliveryRate: 99, completedPOs: 15, activePOs: 1, contactName: 'Arjun Mehta', contactEmail: 'a.mehta@nexttracker.com' },
  { id: 'V-04', name: 'Polycab Cables Ltd', category: 'Cables', score: 89, deliveryRating: 4.3, qualityRating: 4.4, onTimeDeliveryRate: 90, completedPOs: 20, activePOs: 2, contactName: 'Rajesh Patel', contactEmail: 'r.patel@polycab.co.in' },
  { id: 'V-05', name: 'Siemens Energy', category: 'Transformers', score: 84, deliveryRating: 4.0, qualityRating: 4.5, onTimeDeliveryRate: 85, completedPOs: 6, activePOs: 1, contactName: 'Erika Müller', contactEmail: 'erika.mueller@siemens.com' },
  { id: 'V-06', name: 'ABB Solutions', category: 'SCADA', score: 93, deliveryRating: 4.7, qualityRating: 4.6, onTimeDeliveryRate: 95, completedPOs: 9, activePOs: 1, contactName: 'Marcus Aurelius', contactEmail: 'm.aurelius@abb.com' },
  { id: 'V-07', name: 'L&T Electrical', category: 'BOS Equipment', score: 88, deliveryRating: 4.4, qualityRating: 4.4, onTimeDeliveryRate: 91, completedPOs: 18, activePOs: 3, contactName: 'Sanjay Sharma', contactEmail: 's.sharma@lntecc.com' }
];

const INITIAL_ITEMS: ProcurementItem[] = [
  {
    id: 'PO-2026-001', package: 'Bifacial Solar Modules 550Wp', category: 'Modules', vendorId: 'V-01', quantity: 181818, unit: 'Nos', unitCost: 66.00, totalCost: 12000000, status: 'In Transit', orderDate: '2026-03-10', expectedDeliveryDate: '2026-07-15', actualDeliveryDate: null, project: 'Helios One - Phase 1 (60MW)', riskLevel: 'Low', riskNotes: 'Custom clearance completed. Dispatched via multi-modal transport.', isDelayed: false, pendingApproval: false, approvedBy: 'Sandeep Kumar Rathore', lastStatusChangeDate: '2026-06-05',
    documents: [
      { id: 'D-01', name: 'RFQ-Modules-550Wp.pdf', type: 'RFQ', uploadDate: '2026-02-15', size: '2.4 MB' },
      { id: 'D-02', name: 'QUO-Jinko-Modules-v2.pdf', type: 'Quotation', uploadDate: '2026-02-28', size: '3.1 MB' },
      { id: 'D-03', name: 'PO_10294_Modules.pdf', type: 'PO', uploadDate: '2026-03-10', size: '1.8 MB' }
    ]
  },
  {
    id: 'PO-2026-002', package: '3.125MW Central Inverters', category: 'Inverters', vendorId: 'V-02', quantity: 32, unit: 'Sets', unitCost: 56250.00, totalCost: 1800000, status: 'Manufacturing', orderDate: '2026-04-05', expectedDeliveryDate: '2026-08-10', actualDeliveryDate: null, project: 'Helios One - Phase 1 (60MW)', riskLevel: 'Medium', riskNotes: 'Minor sub-component delay, manufacturer is recovering assembly schedule.', isDelayed: false, pendingApproval: false, approvedBy: 'Sandeep Kumar Rathore', lastStatusChangeDate: '2026-06-18',
    documents: [
      { id: 'D-04', name: 'RFQ-Central-Inverters.pdf', type: 'RFQ', uploadDate: '2026-03-01', size: '1.5 MB' },
      { id: 'D-05', name: 'Sungrow-3MW-Quotation.pdf', type: 'Quotation', uploadDate: '2026-03-20', size: '4.2 MB' },
      { id: 'D-06', name: 'PO_10295_Inverters.pdf', type: 'PO', uploadDate: '2026-04-05', size: '1.6 MB' }
    ]
  },
  {
    id: 'PO-2026-003', package: 'Single-Axis Tracker Structure', category: 'Structures', vendorId: 'V-03', quantity: 3000, unit: 'Rows', unitCost: 833.33, totalCost: 2500000, status: 'Delivered', orderDate: '2026-01-15', expectedDeliveryDate: '2026-05-20', actualDeliveryDate: '2026-05-18', project: 'Helios One - Phase 1 (60MW)', riskLevel: 'Low', riskNotes: 'Material arrived at site laydown area in pristine condition.', isDelayed: false, pendingApproval: false, approvedBy: 'Sandeep Kumar Rathore', lastStatusChangeDate: '2026-05-18',
    documents: [
      { id: 'D-07', name: 'PO_10291_Trackers.pdf', type: 'PO', uploadDate: '2026-01-15', size: '2.1 MB' },
      { id: 'D-08', name: 'NextTracker_Challan_Signed.pdf', type: 'Challan', uploadDate: '2026-05-18', size: '1.2 MB' }
    ]
  },
  {
    id: 'PO-2026-004', package: '33/220kV Main Power Transformer', category: 'Transformers', vendorId: 'V-05', quantity: 1, unit: 'Nos', unitCost: 1200000.00, totalCost: 1200000, status: 'In Transit', orderDate: '2026-02-01', expectedDeliveryDate: '2026-06-15', actualDeliveryDate: null, project: 'Helios One - Phase 1 (60MW)', riskLevel: 'High', riskNotes: 'Port congestion and heavy haulage permit delays in transit. Active tracking initiated.', isDelayed: true, pendingApproval: false, approvedBy: 'Sandeep Kumar Rathore', lastStatusChangeDate: '2026-06-02',
    documents: [
      { id: 'D-09', name: 'Siemens_Transformer_RFQ.pdf', type: 'RFQ', uploadDate: '2026-01-05', size: '3.2 MB' },
      { id: 'D-10', name: 'PO_10292_Transformer.pdf', type: 'PO', uploadDate: '2026-02-01', size: '2.5 MB' }
    ]
  },
  {
    id: 'PO-2026-005', package: 'DC Solar Cables 4sqmm & 6sqmm', category: 'Cables', vendorId: 'V-04', quantity: 250000, unit: 'Meters', unitCost: 3.20, totalCost: 800000, status: 'Installed', orderDate: '2026-01-20', expectedDeliveryDate: '2026-05-10', actualDeliveryDate: '2026-05-08', project: 'Helios One - Phase 1 (60MW)', riskLevel: 'Low', riskNotes: 'Installation complete in Blocks 1-15. Megger test reports verified.', isDelayed: false, pendingApproval: false, approvedBy: 'Sandeep Kumar Rathore', lastStatusChangeDate: '2026-05-08',
    documents: [
      { id: 'D-11', name: 'PO_10293_Cables.pdf', type: 'PO', uploadDate: '2026-01-20', size: '1.7 MB' },
      { id: 'D-12', name: 'Polycab_Invoice_Signed.pdf', type: 'Invoice', uploadDate: '2026-05-12', size: '1.4 MB' }
    ]
  },
  {
    id: 'PO-2026-006', package: 'SCADA Panel & Substation Automation', category: 'SCADA', vendorId: 'V-06', quantity: 1, unit: 'Set', unitCost: 400000.00, totalCost: 400000, status: 'PO Issued', orderDate: '2026-05-10', expectedDeliveryDate: '2026-09-01', actualDeliveryDate: null, project: 'Helios One - Phase 2 (40MW)', riskLevel: 'Low', riskNotes: 'Technical specifications approved. Production scheduled.', isDelayed: false, pendingApproval: false, approvedBy: 'Sandeep Kumar Rathore', lastStatusChangeDate: '2026-05-10',
    documents: [
      { id: 'D-13', name: 'ABB_SCADA_Proposal.pdf', type: 'Quotation', uploadDate: '2026-04-20', size: '3.6 MB' },
      { id: 'D-14', name: 'PO_10296_SCADA.pdf', type: 'PO', uploadDate: '2026-05-10', size: '1.9 MB' }
    ]
  },
  {
    id: 'PO-2026-007', package: '33kV Medium Voltage AC Cables', category: 'Cables', vendorId: 'V-04', quantity: 15000, unit: 'Meters', unitCost: 26.66, totalCost: 400000, status: 'Dispatch', orderDate: '2026-04-10', expectedDeliveryDate: '2026-07-25', actualDeliveryDate: null, project: 'Helios One - Phase 1 (60MW)', riskLevel: 'Medium', riskNotes: 'Dispatched from factory. Truck is at transit checkpoint.', isDelayed: false, pendingApproval: false, approvedBy: 'Sandeep Kumar Rathore', lastStatusChangeDate: '2026-06-20',
    documents: [
      { id: 'D-15', name: 'PO_10297_ACCables.pdf', type: 'PO', uploadDate: '2026-04-10', size: '1.3 MB' }
    ]
  },
  {
    id: 'PO-2026-008', package: 'Auxiliary Lightning Protection Systems', category: 'BOS Equipment', vendorId: 'V-07', quantity: 15, unit: 'Nos', unitCost: 10000.00, totalCost: 150000, status: 'Quotation', orderDate: '2026-06-01', expectedDeliveryDate: '2026-08-30', actualDeliveryDate: null, project: 'Helios One - Phase 2 (40MW)', riskLevel: 'Low', riskNotes: 'Quotation under review by Engineering Team.', isDelayed: false, pendingApproval: false, approvedBy: null, lastStatusChangeDate: '2026-06-01',
    documents: [
      { id: 'D-16', name: 'RFQ_Lightning.pdf', type: 'RFQ', uploadDate: '2026-05-15', size: '1.2 MB' },
      { id: 'D-17', name: 'LT_Quotation_Signed.pdf', type: 'Quotation', uploadDate: '2026-06-01', size: '1.5 MB' }
    ]
  },
  {
    id: 'PO-2026-009', package: 'Main Substation Earthing Materials', category: 'BOS Equipment', vendorId: 'V-07', quantity: 500, unit: 'Kits', unitCost: 300.00, totalCost: 150000, status: 'RFQ', orderDate: '2026-06-15', expectedDeliveryDate: '2026-09-15', actualDeliveryDate: null, project: 'Helios One - Phase 2 (40MW)', riskLevel: 'Low', riskNotes: 'RFQ floated to multiple qualified manufacturers.', isDelayed: false, pendingApproval: false, approvedBy: null, lastStatusChangeDate: '2026-06-15',
    documents: [
      { id: 'D-18', name: 'RFQ_Earthing_Materials.pdf', type: 'RFQ', uploadDate: '2026-06-15', size: '1.0 MB' }
    ]
  },
  {
    id: 'PO-2026-010', package: 'Outdoor Main Switchgear Panels 33kV', category: 'BOS Equipment', vendorId: 'V-07', quantity: 8, unit: 'Nos', unitCost: 50000.00, totalCost: 400000, status: 'Quotation', orderDate: '2026-06-20', expectedDeliveryDate: '2026-09-20', actualDeliveryDate: null, project: 'Helios One - Phase 2 (40MW)', riskLevel: 'Low', riskNotes: 'Quotation submitted. Awaiting commercial approval.', isDelayed: false, pendingApproval: true, approvedBy: null, lastStatusChangeDate: '2026-06-20',
    documents: [
      { id: 'D-19', name: 'RFQ_Switchgear.pdf', type: 'RFQ', uploadDate: '2026-06-10', size: '2.1 MB' },
      { id: 'D-20', name: 'LT_Switchgear_Quotation.pdf', type: 'Quotation', uploadDate: '2026-06-20', size: '2.3 MB' }
    ]
  }
];

const INITIAL_LOGS: AuditLog[] = [
  { id: 'L-01', timestamp: '2026-06-24 09:15:22', user: 'Sarah Connor', role: 'Procurement Manager', action: 'Create RFQ', details: 'Floated earthing materials RFQ #PO-2026-009 to Larsen & Toubro' },
  { id: 'L-02', timestamp: '2026-06-24 10:30:11', user: 'Sandeep Kumar Rathore', role: 'Admin', action: 'Approve PO', details: 'Approved budget utilization of $1.8M for PO-2026-002 (Central Inverters)' },
  { id: 'L-03', timestamp: '2026-06-24 11:45:00', user: 'Marcus Wright', role: 'Project Manager', action: 'Update Risk', details: 'Flagged PO-2026-004 (Main Transformer) as DELAYED due to heavy permits at Mundra port' }
];

export default function App() {
  // --- PERSISTED STATES ---
  const [items, setItems] = useState<ProcurementItem[]>(() => {
    const saved = localStorage.getItem('solartrack_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          lastStatusChangeDate: item.lastStatusChangeDate || item.orderDate || new Date().toISOString().substring(0, 10)
        }));
      } catch (e) {
        return INITIAL_ITEMS;
      }
    }
    return INITIAL_ITEMS;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('solartrack_vendors');
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('solartrack_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  useEffect(() => {
    localStorage.setItem('solartrack_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('solartrack_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('solartrack_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    // Automatically trigger risk check for stagnant packages on application mount
    const timer = setTimeout(() => {
      runStagnancyAudit(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // --- APP STATE CONTROLS ---
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Tracker' | 'Vendors' | 'Documents' | 'AuditLogs'>('Dashboard');
  const [selectedRole, setSelectedRole] = useState<Role>('Procurement Manager');

  // --- SEARCH & FILTERS ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docPOSearchQuery, setDocPOSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('All');

  // --- ACTIVE/SELECTED ITEM DRAWER STATE ---
  const [activeItem, setActiveItem] = useState<ProcurementItem | null>(null);

  // --- MODAL CONTROLS ---
  const [isAddPOOpen, setIsAddPOOpen] = useState(false);
  const [isNewVendorOpen, setIsNewVendorOpen] = useState(false);
  const [isPDFReportOpen, setIsPDFReportOpen] = useState(false);

  // --- EMAIL CLIENT SIMULATION STATE ---
  interface EmailDraft {
    docId: string;
    docName: string;
    docType: string;
    poId: string;
    poPackage: string;
    toName: string;
    toEmail: string;
    subject: string;
    body: string;
  }
  const [activeEmailDraft, setActiveEmailDraft] = useState<EmailDraft | null>(null);

  // --- FORM STATES ---
  const [newPO, setNewPO] = useState({
    package: '',
    category: 'Modules' as MaterialCategory,
    vendorId: 'V-01',
    quantity: 1,
    unit: 'Nos',
    unitCost: 0,
    expectedDeliveryDate: '',
    project: 'Helios One - Phase 1 (60MW)',
    riskLevel: 'Low' as const,
    riskNotes: ''
  });

  const [newVendor, setNewVendor] = useState({
    name: '',
    category: 'Modules' as MaterialCategory,
    contactName: '',
    contactEmail: ''
  });

  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- HEAVY METRIC CALCULATIONS ---
  const totalItems = items.length;
  const orderedCount = items.filter(i => !['RFQ', 'Quotation'].includes(i.status)).length;
  const inTransitCount = items.filter(i => i.status === 'In Transit').length;
  const deliveredCount = items.filter(i => ['Delivered', 'Installed'].includes(i.status)).length;
  const delayedCount = items.filter(i => i.isDelayed).length;
  const pendingApprovalCount = items.filter(i => i.pendingApproval).length;

  const totalCostBudget = items.reduce((sum, item) => sum + item.totalCost, 0);
  const spentCost = items
    .filter(i => !['RFQ', 'Quotation'].includes(i.status))
    .reduce((sum, item) => sum + item.totalCost, 0);

  // Weighted overall EPC procurement progress percentage
  // Total progress = Sum(item.weight * item.progress_percentage) / Sum(item.weights)
  const weightedProgressTotal = items.reduce((sum, i) => sum + (i.totalCost * STAGE_PROGRESS[i.status]), 0);
  const epcProgressPct = totalCostBudget > 0 ? Math.round(weightedProgressTotal / totalCostBudget) : 0;

  // Computed lists for Documents tab with filters
  const allDocs = items.flatMap(item => 
    item.documents.map(doc => ({ ...doc, poId: item.id, poPackage: item.package }))
  );

  const filteredDocs = allDocs.filter(doc => {
    const matchesDocName = doc.name.toLowerCase().includes(docSearchQuery.toLowerCase());
    const matchesPO = doc.poId.toLowerCase().includes(docPOSearchQuery.toLowerCase());
    const matchesType = docTypeFilter === 'All' || doc.type === docTypeFilter;
    return matchesDocName && matchesPO && matchesType;
  });

  // Audit Log helper
  const addLog = (action: string, details: string) => {
    const userObj = ROLE_USERS[selectedRole];
    const newLog: AuditLog = {
      id: `L-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: userObj.name,
      role: selectedRole,
      action,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const triggerAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // --- ACTIONS ---
  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'Viewer' || selectedRole === 'Project Manager') {
      triggerAlert('Permission Denied: Your role is not authorized to create POs.', 'error');
      return;
    }

    const cost = newPO.quantity * newPO.unitCost;
    const poId = `PO-2026-0${items.length + 1}`;
    
    const itemToAdd: ProcurementItem = {
      id: poId,
      package: newPO.package,
      category: newPO.category,
      vendorId: newPO.vendorId,
      quantity: newPO.quantity,
      unit: newPO.unit,
      unitCost: newPO.unitCost,
      totalCost: cost,
      status: 'RFQ',
      orderDate: new Date().toISOString().substring(0, 10),
      expectedDeliveryDate: newPO.expectedDeliveryDate || '2026-10-01',
      actualDeliveryDate: null,
      project: newPO.project,
      riskLevel: newPO.riskLevel,
      riskNotes: newPO.riskNotes || 'RFQ Floated.',
      isDelayed: false,
      pendingApproval: false,
      approvedBy: null,
      documents: [
        { id: `D-${Date.now()}`, name: `RFQ_${newPO.package.replace(/\s+/g, '_')}.pdf`, type: 'RFQ', uploadDate: new Date().toISOString().substring(0,10), size: '1.2 MB' }
      ],
      lastStatusChangeDate: new Date().toISOString().substring(0, 10)
    };

    setItems(prev => [itemToAdd, ...prev]);
    addLog('Create PO Package', `Floated new procurement package ${poId} (${newPO.package}) for $${cost.toLocaleString()}`);
    triggerAlert(`Successfully created procurement package ${poId}!`);
    setIsAddPOOpen(false);
    
    // reset form
    setNewPO({
      package: '',
      category: 'Modules',
      vendorId: 'V-01',
      quantity: 1,
      unit: 'Nos',
      unitCost: 0,
      expectedDeliveryDate: '',
      project: 'Helios One - Phase 1 (60MW)',
      riskLevel: 'Low',
      riskNotes: ''
    });
  };

  const runStagnancyAudit = (isAutoOnMount = false) => {
    // Local date context is 2026-06-24
    const today = new Date('2026-06-24');
    let flaggedCount = 0;
    const newLogs: AuditLog[] = [];

    const updatedItems = items.map(item => {
      if (['Delivered', 'Installed'].includes(item.status)) {
        return item;
      }

      const lastUpdate = new Date(item.lastStatusChangeDate || item.orderDate);
      const diffTime = today.getTime() - lastUpdate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 14) {
        // If already flagged, don't double-flag or log again
        if (item.riskLevel === 'High' && item.riskNotes.includes('Stagnant')) {
          return item;
        }

        flaggedCount++;
        newLogs.push({
          id: `L-STAG-${Date.now()}-${item.id}`,
          timestamp: '2026-06-24 12:00:00',
          user: 'SolarTrack System',
          role: 'Admin',
          action: 'Risk Escalation',
          details: `System Flag: Package ${item.id} (${item.package}) stage "${item.status}" stagnant for ${diffDays} days (Threshold: 14 days). Risk escalated to HIGH.`
        });

        return {
          ...item,
          isDelayed: true,
          riskLevel: 'High',
          riskNotes: `[Stagnant] Status unchanged for ${diffDays} days in "${item.status}" stage. Escalated by system audit.`
        };
      }
      return item;
    });

    if (flaggedCount > 0) {
      setItems(updatedItems);
      setLogs(prev => [...newLogs, ...prev]);
      if (!isAutoOnMount) {
        triggerAlert(`Stagnancy Audit completed: Automatically flagged ${flaggedCount} stagnant packages & updated audit logs!`, 'error');
      } else {
        triggerAlert(`System Check: ${flaggedCount} packages flagged for stagnancy risk (>14 days unchanged). Check Audit Log.`, 'error');
      }
    } else {
      if (!isAutoOnMount) {
        triggerAlert('Stagnancy Audit completed: All packages are active and updated within the 14-day window.', 'success');
      }
    }
  };

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole !== 'Admin' && selectedRole !== 'Procurement Manager') {
      triggerAlert('Permission Denied: Your role is not authorized to create vendors.', 'error');
      return;
    }

    const vendorId = `V-0${vendors.length + 1}`;
    const itemToAdd: Vendor = {
      id: vendorId,
      name: newVendor.name,
      category: newVendor.category,
      score: 90,
      deliveryRating: 4.5,
      qualityRating: 4.5,
      onTimeDeliveryRate: 95,
      completedPOs: 0,
      activePOs: 0,
      contactName: newVendor.contactName,
      contactEmail: newVendor.contactEmail
    };

    setVendors(prev => [...prev, itemToAdd]);
    addLog('Add Vendor', `Onboarded new solar component vendor: ${newVendor.name}`);
    triggerAlert(`Successfully onboarded vendor: ${newVendor.name}`);
    setIsNewVendorOpen(false);
    setNewVendor({ name: '', category: 'Modules', contactName: '', contactEmail: '' });
  };

  const handleApprovePO = (itemId: string) => {
    if (selectedRole !== 'Admin') {
      triggerAlert('Permission Denied: Only Admins can approve PO budgets.', 'error');
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          pendingApproval: false,
          status: 'PO Issued',
          approvedBy: ROLE_USERS['Admin'].name
        };
      }
      return item;
    }));

    addLog('Approve PO', `Approved budget and issued PO for package ${itemId}`);
    triggerAlert(`PO ${itemId} is approved and PO Issued status is locked!`);
    if (activeItem?.id === itemId) {
      setActiveItem(prev => prev ? { ...prev, pendingApproval: false, status: 'PO Issued', approvedBy: ROLE_USERS['Admin'].name } : null);
    }
  };

  const handleTransitionStatus = (itemId: string, nextStatus: WorkflowStage) => {
    // Role-based state validation:
    // - PMgr cannot transition items once they hit 'Delivered' or 'Installed'.
    // - ProjMgr cannot transition items during RFQ/Quotation/PO Issued phase.
    if (selectedRole === 'Viewer') {
      triggerAlert('Permission Denied: Viewers cannot change item stages.', 'error');
      return;
    }

    if (selectedRole === 'Procurement Manager' && ['Delivered', 'Installed'].includes(nextStatus)) {
      triggerAlert('Role Boundary: Delivery and On-Site Installation stages must be verified by the Project Manager.', 'error');
      return;
    }

    if (selectedRole === 'Project Manager' && ['Quotation', 'PO Issued', 'Manufacturing'].includes(nextStatus)) {
      triggerAlert('Role Boundary: Upstream procurement stages must be coordinated by the Procurement Manager.', 'error');
      return;
    }

    const isDelivered = nextStatus === 'Delivered';
    const isInstalled = nextStatus === 'Installed';
    const today = new Date().toISOString().substring(0, 10);

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          status: nextStatus,
          lastStatusChangeDate: today,
          actualDeliveryDate: isDelivered || isInstalled ? today : item.actualDeliveryDate,
          isDelayed: nextStatus === 'Delivered' ? false : item.isDelayed // clear delay status automatically upon delivery
        };
      }
      return item;
    }));

    addLog('Transition Stage', `Advanced package ${itemId} status to ${nextStatus.toUpperCase()}`);
    triggerAlert(`Package ${itemId} progressed to ${nextStatus}`);
    
    if (activeItem?.id === itemId) {
      setActiveItem(prev => prev ? { ...prev, status: nextStatus, lastStatusChangeDate: today, actualDeliveryDate: isDelivered || isInstalled ? today : prev.actualDeliveryDate, isDelayed: nextStatus === 'Delivered' ? false : prev.isDelayed } : null);
    }
  };

  const handleToggleDelay = (itemId: string, notes: string) => {
    if (selectedRole !== 'Project Manager' && selectedRole !== 'Admin') {
      triggerAlert('Permission Denied: Delay flagging and site risk analysis is reserved for Project Managers or Admins.', 'error');
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const nextDelayed = !item.isDelayed;
        return {
          ...item,
          isDelayed: nextDelayed,
          riskLevel: nextDelayed ? 'High' : 'Low',
          riskNotes: notes || (nextDelayed ? 'Unscheduled hold in shipment.' : 'Issue resolved. Tracking normally.')
        };
      }
      return item;
    }));

    const currentItem = items.find(i => i.id === itemId);
    const wasDelayed = currentItem?.isDelayed;
    
    addLog('Update Risk Status', `${wasDelayed ? 'Cleared' : 'Flagged'} delay and updated risks on package ${itemId}`);
    triggerAlert(`Package ${itemId} delay risk updated!`);
    
    if (activeItem?.id === itemId) {
      setActiveItem(prev => prev ? { ...prev, isDelayed: !prev.isDelayed, riskLevel: !prev.isDelayed ? 'High' : 'Low', riskNotes: notes || (!prev.isDelayed ? 'Unscheduled hold in shipment.' : 'Issue resolved. Tracking normally.') } : null);
    }
  };

  const handleMockUploadDoc = (itemId: string, docType: 'RFQ' | 'Quotation' | 'PO' | 'Invoice' | 'Challan', docName: string) => {
    if (selectedRole === 'Viewer') {
      triggerAlert('Permission Denied: Read-only access.', 'error');
      return;
    }

    const newDoc: Doc = {
      id: `D-${Date.now()}`,
      name: docName || `Uploaded_${docType}_Document.pdf`,
      type: docType,
      uploadDate: new Date().toISOString().substring(0, 10),
      size: '1.4 MB'
    };

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          documents: [...item.documents, newDoc]
        };
      }
      return item;
    }));

    addLog('Upload Document', `Uploaded ${docType} document (${newDoc.name}) for package ${itemId}`);
    triggerAlert(`Successfully attached ${docType} invoice/challan to ${itemId}!`);

    if (activeItem?.id === itemId) {
      setActiveItem(prev => prev ? { ...prev, documents: [...prev.documents, newDoc] } : null);
    }
  };

  // --- INITIATE EMAIL SENDING SIMULATION ---
  const handleInitiateSendEmail = (doc: { id: string; name: string; type: string; poId: string; poPackage: string }) => {
    const linkedItem = items.find(item => item.id === doc.poId);
    const linkedVendor = vendors.find(v => v.id === linkedItem?.vendorId);
    
    const toName = linkedVendor?.contactName || 'Procurement Coordinator';
    const toEmail = linkedVendor?.contactEmail || 'procurement@helios.energy';
    const currentUser = ROLE_USERS[selectedRole];
    const senderName = currentUser ? currentUser.name : 'Procurement Manager';

    let subject = `[SolarTrack] ${doc.type} Document attached - PO: ${doc.poId}`;
    let body = `Dear ${toName},\n\n`;

    if (doc.type === 'RFQ') {
      subject = `[RFQ] Inquiry for Procurement - PO: ${doc.poId} (${doc.poPackage})`;
      body += `Please find attached the Request for Quotation (RFQ) document "${doc.name}" for the package "${doc.poPackage}" associated with PO Reference: ${doc.poId}.\n\nKindly review the attached requirements and submit your quotation by the requested deadline.\n\nThank you for your prompt cooperation.`;
    } else if (doc.type === 'Quotation') {
      subject = `[Quotation] Revised Procurement Offer - PO: ${doc.poId} (${doc.poPackage})`;
      body += `We have registered the revised Quotation document "${doc.name}" for PO Reference: ${doc.poId}.\n\nOur engineering and commercial teams are currently evaluating the proposed specifications. We will contact you if any further clarifications are needed.`;
    } else if (doc.type === 'PO') {
      subject = `[PO Issued] Official Purchase Order - PO: ${doc.poId} (${doc.poPackage})`;
      body += `Please find attached the finalized, signed Purchase Order document "${doc.name}" for the package "${doc.poPackage}" (PO Reference: ${doc.poId}).\n\nKindly acknowledge receipt of this PO and confirm your planned manufacturing timeline and delivery schedule at your earliest convenience.`;
    } else if (doc.type === 'Invoice') {
      subject = `[Invoice Notification] Registered Invoice for PO: ${doc.poId} (${doc.poPackage})`;
      body += `We have registered your commercial Invoice document "${doc.name}" against PO Reference: ${doc.poId}.\n\nThis invoice has been uploaded to our digital vault and routed to our central accounts department for verification and payment queue processing.`;
    } else {
      subject = `[Delivery Challan] Delivery documentation filed for PO: ${doc.poId}`;
      body += `We have successfully uploaded the delivery challan documentation "${doc.name}" for PO Reference: ${doc.poId} in our digital document ledger.\n\nThe site management team has been notified to align incoming inspection and inventory counting with this documentation.`;
    }

    body += `\n\nBest regards,\n\n${senderName}\nCommercial Procurement Division\nHelios Solar Energy EPC Project`;

    setActiveEmailDraft({
      docId: doc.id,
      docName: doc.name,
      docType: doc.type,
      poId: doc.poId,
      poPackage: doc.poPackage,
      toName,
      toEmail,
      subject,
      body
    });
  };

  // --- CONFIRM EMAIL DISPATCH ---
  const handleSendEmailSimulated = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmailDraft) return;

    // Log the transaction
    addLog('Email Sent', `Dispatched ${activeEmailDraft.docType} document ("${activeEmailDraft.docName}") via email to ${activeEmailDraft.toName} (${activeEmailDraft.toEmail}) for PO ${activeEmailDraft.poId}`);
    
    // Trigger success notification
    triggerAlert(`Successfully dispatched email to ${activeEmailDraft.toEmail} with "${activeEmailDraft.docName}"!`);

    // Trigger native email client popup
    const mailtoUrl = `mailto:${encodeURIComponent(activeEmailDraft.toEmail)}?subject=${encodeURIComponent(activeEmailDraft.subject)}&body=${encodeURIComponent(activeEmailDraft.body)}`;
    window.location.href = mailtoUrl;

    // Close Modal
    setActiveEmailDraft(null);
  };

  // --- EXPORT TO EXCEL (CSV) ---
  const handleExportCSV = () => {
    const headers = 'PO Number,Package,Category,Project,Vendor,Quantity,Unit,Unit Cost ($),Total Cost ($),Status,ETA,Risk Level,Delayed\n';
    const rows = items.map(item => {
      const vendorName = vendors.find(v => v.id === item.vendorId)?.name || 'Unknown';
      return `"${item.id}","${item.package}","${item.category}","${item.project}","${vendorName}",${item.quantity},"${item.unit}",${item.unitCost},${item.totalCost},"${item.status}","${item.expectedDeliveryDate}","${item.riskLevel}","${item.isDelayed ? 'YES' : 'NO'}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SolarTrack_100MW_Procurement_BOM_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('Export CSV', 'Exported full BOM procurement tracker matrix to Excel CSV.');
    triggerAlert('BOM spreadsheet download triggered!');
  };

  // --- ANALYTICS CHART DATA PROCESSING ---
  const costByCategoryData = CATEGORIES.map(category => {
    const catItems = items.filter(item => item.category === category);
    const totalAllocated = catItems.reduce((sum, item) => sum + item.totalCost, 0);
    const totalSpent = catItems
      .filter(i => !['RFQ', 'Quotation'].includes(i.status))
      .reduce((sum, i) => sum + i.totalCost, 0);
    return {
      name: category,
      Allocated: Math.round(totalAllocated / 1000) / 1000, // in Millions
      Spent: Math.round(totalSpent / 1000) / 1000 // in Millions
    };
  });

  const statusDistributionData = STAGES.map(stage => {
    const count = items.filter(i => i.status === stage).length;
    return { name: stage, value: count };
  }).filter(d => d.value > 0);

  const PIE_COLORS = ['#A0AEC0', '#D6BCFA', '#4FD1C5', '#F6AD55', '#4299E1', '#3182CE', '#48BB78', '#059669'];

  // --- FILTER ENGINE ---
  const filteredItems = items.filter(item => {
    const matchesSearch = item.package.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (vendors.find(v => v.id === item.vendorId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    const matchesProject = selectedProject === 'All' || item.project === selectedProject;
    const matchesRisk = selectedRisk === 'All' || item.riskLevel === selectedRisk;

    return matchesSearch && matchesCategory && matchesStatus && matchesProject && matchesRisk;
  });

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] font-sans text-slate-800 overflow-hidden">
      
      {/* --- SIDEBAR PANEL --- */}
      <aside className="w-64 bg-[#0B3C5D] flex flex-col flex-shrink-0 border-r border-slate-700/50 shadow-xl select-none">
        
        {/* Brand Banner */}
        <div className="p-6 flex items-center gap-3 border-b border-[#154c73]/50 bg-[#072a42]">
          <div className="w-9 h-9 bg-[#FDB813] rounded-lg shadow-inner flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-[#0B3C5D]" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-extrabold tracking-tight text-lg leading-tight">SolarTrack <span className="text-[#FDB813]">Pro</span></span>
            <span className="text-[10px] text-slate-300 tracking-wider uppercase font-semibold">100MW EPC Suite</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-6 flex-1 px-3 space-y-1">
          <button
            onClick={() => setActiveTab('Dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'Dashboard' 
                ? 'bg-[#154c73] text-white border-l-4 border-[#FDB813] shadow-md' 
                : 'text-slate-300 hover:bg-[#154c73]/40 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#FDB813]" />
            Dashboard Control
          </button>

          <button
            onClick={() => setActiveTab('Tracker')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'Tracker' 
                ? 'bg-[#154c73] text-white border-l-4 border-[#FDB813] shadow-md' 
                : 'text-slate-300 hover:bg-[#154c73]/40 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4 text-[#FDB813]" />
            Procurement Tracker
          </button>

          <button
            onClick={() => setActiveTab('Vendors')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'Vendors' 
                ? 'bg-[#154c73] text-white border-l-4 border-[#FDB813] shadow-md' 
                : 'text-slate-300 hover:bg-[#154c73]/40 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-[#FDB813]" />
            Vendor Scorecards
          </button>

          <button
            onClick={() => setActiveTab('Documents')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'Documents' 
                ? 'bg-[#154c73] text-white border-l-4 border-[#FDB813] shadow-md' 
                : 'text-slate-300 hover:bg-[#154c73]/40 hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-[#FDB813]" />
            Documents Vault
          </button>

          <button
            onClick={() => setActiveTab('AuditLogs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'AuditLogs' 
                ? 'bg-[#154c73] text-white border-l-4 border-[#FDB813] shadow-md' 
                : 'text-slate-300 hover:bg-[#154c73]/40 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 text-[#FDB813]" />
            Audit System Logs
          </button>
        </nav>

        {/* Bottom Role Swapper Panel */}
        <div className="p-4 border-t border-[#154c73]/50 bg-[#072a42] m-2 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <img 
              src={ROLE_USERS[selectedRole].avatar} 
              alt={selectedRole} 
              className="w-10 h-10 rounded-full border-2 border-[#FDB813] object-cover" 
            />
            <div className="text-xs">
              <p className="font-bold text-white text-[13px]">{ROLE_USERS[selectedRole].name}</p>
              <p className="text-[#FDB813] uppercase tracking-tighter text-[10px] font-bold">{selectedRole}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-slate-300 uppercase tracking-widest block font-semibold mb-1">
              Switch Sandbox Role:
            </label>
            <select 
              value={selectedRole}
              onChange={(e) => {
                const nextRole = e.target.value as Role;
                setSelectedRole(nextRole);
                triggerAlert(`Switched view to standard ${nextRole} perspective.`);
              }}
              className="w-full text-xs bg-[#0B3C5D] border border-[#154c73] text-white rounded p-2 focus:ring-1 focus:ring-[#FDB813] focus:outline-none font-medium cursor-pointer"
            >
              <option value="Admin">Sandeep Kumar Rathore (Admin)</option>
              <option value="Procurement Manager">Sarah Connor (Procurement Mgr)</option>
              <option value="Project Manager">Marcus Wright (Project Mgr)</option>
              <option value="Viewer">Kate Brewster (Viewer)</option>
            </select>
          </div>
        </div>
      </aside>

      {/* --- MAIN PAGE AREA --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Ribbon */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm select-none z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Helios One Solar Field</h1>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200 shadow-sm flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              100MW Active EPC
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Status Bar */}
            <div className="hidden lg:flex items-center gap-6 text-xs text-slate-500 font-semibold mr-4 border-r pr-6 border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Total BOM Cost:</span>
                <span className="text-[#0B3C5D] font-bold font-mono">${(totalCostBudget / 1000000).toFixed(2)}M</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Spent Status:</span>
                <span className="text-green-600 font-bold font-mono">${(spentCost / 1000000).toFixed(2)}M</span>
              </div>
            </div>

            <button
              onClick={() => setIsPDFReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print PDF
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0B3C5D] text-white text-xs font-bold rounded-lg hover:bg-[#154c73] transition-colors shadow-md shadow-[#0B3C5D]/10 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#FDB813]" />
              Export BOM Spreadsheet
            </button>
          </div>
        </header>

        {/* Notification Banner */}
        {alertMsg && (
          <div className={`px-8 py-2.5 flex items-center justify-between text-xs font-bold shadow-inner border-b transition-all duration-300 z-20 ${
            alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-4 h-4 ${alertMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)} className="hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Contents Frame */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ========================================================================= */}
          {/* 1. DASHBOARD CONTROL TAB */}
          {/* ========================================================================= */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6">
              
              {/* Overall Project Progress Hero Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* EPC Progress Meter */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#FDB813]/10 rounded-bl-full pointer-events-none"></div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-extrabold block mb-1">Procurement Velocity Index</span>
                    <h2 className="text-3xl font-extrabold text-slate-800">Helios One EPC</h2>
                    <p className="text-xs text-slate-500 mt-1">Weighted total completion rate across overall engineering material catalog.</p>
                  </div>
                  <div className="my-5">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-2xl font-black text-[#0B3C5D] font-mono">{epcProgressPct}%</span>
                      <span className="text-xs font-bold text-slate-400">Target Complete</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${epcProgressPct}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 border-t pt-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Real-time milestones aligned to plant COD (Dec 2026).</span>
                  </div>
                </div>

                {/* Cost Allocation Widget */}
                <div className="bg-[#0B3C5D] p-6 rounded-2xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#154c73]/30 rounded-tl-full pointer-events-none"></div>
                  <div>
                    <span className="text-xs text-slate-300 uppercase tracking-widest font-bold block mb-1">Procurement Capital Spend</span>
                    <h2 className="text-2xl font-black text-white flex items-baseline gap-1 font-mono">
                      ${(spentCost / 1000000).toFixed(2)}M <span className="text-xs text-slate-300 font-normal ml-1">/ ${(totalCostBudget / 1000000).toFixed(2)}M allocated</span>
                    </h2>
                  </div>
                  <div className="my-5">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span>Capital Utilization Rate</span>
                      <span className="font-bold">{Math.round((spentCost / totalCostBudget) * 100)}% Spent</span>
                    </div>
                    <div className="w-full bg-white/15 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#FDB813] h-2.5 rounded-full" 
                        style={{ width: `${(spentCost / totalCostBudget) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5 border-t border-white/10 pt-3">
                    <DollarSign className="w-3.5 h-3.5 text-[#FDB813]" />
                    <span>Cost buffers include custom import excise.</span>
                  </div>
                </div>

                {/* Fast Action Board */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 mb-2 uppercase tracking-wider">Fast-Track Controls</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setIsAddPOOpen(true)}
                      className="p-2.5 bg-[#FDB813] hover:bg-[#FDB813]/90 text-[#0B3C5D] font-bold text-[11px] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm border border-amber-300 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Issue PO</span>
                    </button>
                    <button
                      onClick={() => setIsNewVendorOpen(true)}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border border-slate-200 shadow-sm cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span>Onboard</span>
                    </button>
                    <button
                      onClick={() => runStagnancyAudit(false)}
                      className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border border-rose-200 shadow-sm cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Audit Risks</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 text-center">Actions are restricted by role. Change roles in the sidebar to simulate approval chains.</p>
                </div>

              </div>

              {/* KPI Cards Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">BOM Items</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-[#0B3C5D] font-mono">{totalItems}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Total Packages</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">POs Issued</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-teal-600 font-mono">{orderedCount}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{Math.round((orderedCount/totalItems)*100)}% Float</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">In Transit</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-blue-600 font-mono">{inTransitCount}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">On Water/Road</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Delivered</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-green-600 font-mono">{deliveredCount}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Recd at site</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-rose-200/80 bg-rose-50/20 flex flex-col justify-between">
                  <span className="text-xs text-rose-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-500" /> Delayed
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-rose-600 font-mono">{delayedCount}</span>
                    <span className="text-[10px] text-rose-500 font-bold">Risk Level High</span>
                  </div>
                </div>
                <div className="bg-amber-100 p-4 rounded-xl shadow-sm border border-amber-300 flex flex-col justify-between">
                  <span className="text-xs text-amber-800 font-extrabold uppercase tracking-wider">Pending Appr.</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-amber-800 font-mono">{pendingApprovalCount}</span>
                    <span className="text-[10px] text-amber-700 font-bold">Admin Gated</span>
                  </div>
                </div>
              </div>

              {/* Chart & Analytic Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Cost vs Spent Chart */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Material Cost Breakdown ($ Millions)</h3>
                    <div className="flex gap-4 text-xs font-bold">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#0B3C5D] rounded-sm"></span>Allocated Cost</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#48BB78] rounded-sm"></span>Committed / Spent</span>
                    </div>
                  </div>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costByCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#4A5568' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#4A5568' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          formatter={(value) => [`$${Number(value).toFixed(2)}M`]} 
                          contentStyle={{ background: '#FFFFFF', border: '1px solid #CBD5E0', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }} 
                        />
                        <Bar dataKey="Allocated" fill="#0B3C5D" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Spent" fill="#48BB78" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Breakdown Circle */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Workflow Stages Dispersion</h3>
                  <div className="relative w-full h-44 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistributionData}
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center">
                      <p className="text-2xl font-black text-[#0B3C5D] font-mono">{totalItems}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">Active POs</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-t pt-3 border-slate-100">
                    {statusDistributionData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-slate-600 truncate">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                        <span className="truncate">{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Delay Alerts Panel & Top Vendors */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Delay Alerts Panel */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                      <AlertCircle className="w-4 h-4 text-rose-500" /> Critical Logistics & Delay Risks
                    </h3>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md">Action Required</span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-64">
                    {items.filter(item => item.isDelayed || item.riskLevel === 'High' || item.riskLevel === 'Critical').map(item => (
                      <div key={item.id} className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#0B3C5D]">{item.id}</span>
                            <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded">{item.riskLevel.toUpperCase()} RISK</span>
                            <span className="text-slate-400">| Category: <strong className="text-slate-600">{item.category}</strong></span>
                          </div>
                          <p className="font-semibold text-slate-800">{item.package}</p>
                          <p className="text-slate-500 italic text-[11px]">"{item.riskNotes}"</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right text-[11px] font-bold mr-2">
                            <p className="text-slate-400">ETA Date</p>
                            <p className="text-slate-700 font-mono">{item.expectedDeliveryDate}</p>
                          </div>
                          {(selectedRole === 'Project Manager' || selectedRole === 'Admin') ? (
                            <button
                              onClick={() => handleToggleDelay(item.id, 'Issue resolved. Clearance confirmed.')}
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-[10px] rounded shadow-sm transition-colors cursor-pointer"
                            >
                              Resolve Hold
                            </button>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-400 border border-slate-200 text-[10px] font-semibold rounded cursor-not-allowed">
                              Gated to PM/Admin
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {items.filter(item => item.isDelayed).length === 0 && (
                      <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                        <Check className="w-8 h-8 text-green-500 bg-green-50 p-1.5 rounded-full" />
                        <p className="font-bold text-xs text-slate-600">All shipments clearing ports smoothly. Zero logistics delays logged!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Vendors Leaderboard */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <ShieldCheck className="w-4.5 h-4.5 text-[#FDB813]" /> Top Vendor Leaderboard
                    </h3>
                    <div className="space-y-2.5">
                      {vendors.slice(0, 4).map((vendor, index) => (
                        <div key={vendor.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px]">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-extrabold text-slate-800 text-xs">{vendor.name}</p>
                              <p className="text-[10px] text-slate-400">Class: {vendor.category}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            vendor.score >= 95 ? 'bg-green-100 text-green-700' :
                            vendor.score >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {vendor.score}% Performance
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('Vendors')}
                    className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    View Supplier Quality Matrix <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. PROCUREMENT TRACKER TAB */}
          {/* ========================================================================= */}
          {activeTab === 'Tracker' && (
            <div className="space-y-6">
              
              {/* Table Filters Panel */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-[#0B3C5D]" /> Global Filtration Controls
                  </h3>
                  <button 
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedStatus('All');
                      setSelectedProject('All');
                      setSelectedRisk('All');
                      setSearchQuery('');
                    }}
                    className="text-xs font-extrabold text-[#0B3C5D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Clear All Filters
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  
                  {/* Search bar */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Items/POs</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search spec, PO#, vendor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-[#0B3C5D] focus:border-[#0B3C5D] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Material Group</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:border-[#0B3C5D] focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Workflow Stage</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:border-[#0B3C5D] focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Stages</option>
                      {STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                    </select>
                  </div>

                  {/* Project Phase Filter */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sub-Project / Block</label>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:border-[#0B3C5D] focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Project Phases</option>
                      <option value="Helios One - Phase 1 (60MW)">Phase 1 (60MW)</option>
                      <option value="Helios One - Phase 2 (40MW)">Phase 2 (40MW)</option>
                    </select>
                  </div>

                  {/* Risk Profile Filter */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Profile</label>
                    <select
                      value={selectedRisk}
                      onChange={(e) => setSelectedRisk(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:border-[#0B3C5D] focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Risk Profiles</option>
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                      <option value="Critical">Critical Risk</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Main Table Panel */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Filtered Rows: {filteredItems.length} of {totalItems} total packages
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsAddPOOpen(true)}
                      className="px-3 py-1.5 bg-[#FDB813] hover:bg-[#FDB813]/90 text-[#0B3C5D] font-extrabold text-xs rounded shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add New Package
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 text-xs font-extrabold text-slate-500 uppercase border-b border-slate-200 select-none">
                        <th className="px-5 py-4">PO Number</th>
                        <th className="px-5 py-4">Package Specification</th>
                        <th className="px-5 py-4">Vendor & Sub-Phase</th>
                        <th className="px-5 py-4 text-right">Value (USD)</th>
                        <th className="px-5 py-4 text-center">Workflow Status</th>
                        <th className="px-5 py-4">ETA (Target)</th>
                        <th className="px-5 py-4 text-center">Risk Level</th>
                        <th className="px-5 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-100">
                      {filteredItems.map(item => {
                        const vObj = vendors.find(v => v.id === item.vendorId);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* PO Number */}
                            <td className="px-5 py-4 font-mono font-black text-[#0B3C5D] whitespace-nowrap">
                              {item.id}
                              {item.pendingApproval && (
                                <span className="block text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded px-1 mt-1 text-center w-max animate-pulse">
                                  Awaiting Approval
                                </span>
                              )}
                            </td>

                            {/* Package Spec */}
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-800 text-[13px]">{item.package}</p>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase block mt-0.5">
                                Cat: <strong className="text-slate-500">{item.category}</strong>
                              </span>
                            </td>

                            {/* Vendor & Project */}
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-700">{vObj?.name || 'Awaiting Selection'}</p>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{item.project}</span>
                            </td>

                            {/* Value */}
                            <td className="px-5 py-4 text-right font-bold font-mono text-slate-800 text-[13px]">
                              ${item.totalCost.toLocaleString()}
                              <span className="block text-[9px] text-slate-400 font-medium font-sans mt-0.5">
                                {item.quantity.toLocaleString()} {item.unit} @ ${item.unitCost}/unit
                              </span>
                            </td>

                            {/* Status Workflow */}
                            <td className="px-5 py-4 text-center whitespace-nowrap">
                              <span className={`px-3 py-1 border rounded-full text-[10px] font-bold uppercase ${STAGE_COLORS[item.status]}`}>
                                {item.status}
                              </span>
                              <div className="w-20 bg-slate-100 h-1 rounded-full overflow-hidden mx-auto mt-2.5">
                                <div className="bg-emerald-500 h-1" style={{ width: `${STAGE_PROGRESS[item.status]}%` }}></div>
                              </div>
                            </td>

                            {/* ETA */}
                            <td className="px-5 py-4 font-mono font-semibold text-slate-600 whitespace-nowrap">
                              {item.isDelayed ? (
                                <div className="space-y-0.5">
                                  <span className="text-rose-600 font-bold underline decoration-rose-500 flex items-center gap-0.5">
                                    <AlertTriangle className="w-3.5 h-3.5" /> DELAYED
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">Original: {item.expectedDeliveryDate}</span>
                                </div>
                              ) : (
                                <span>{item.expectedDeliveryDate}</span>
                              )}
                            </td>

                            {/* Risk Level */}
                            <td className="px-5 py-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                item.riskLevel === 'Low' ? 'bg-green-50 text-green-700 border border-green-200' :
                                item.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-rose-50 text-rose-700 border border-rose-200 font-black'
                              }`}>
                                {item.riskLevel}
                              </span>
                            </td>

                            {/* Actions Trigger */}
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => setActiveItem(item)}
                                className="px-2.5 py-1.5 bg-[#0B3C5D] hover:bg-[#154c73] text-white font-extrabold text-[11px] rounded transition-colors shadow-sm cursor-pointer"
                              >
                                Manage Workflow
                              </button>
                            </td>

                          </tr>
                        );
                      })}

                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-400">
                            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="font-bold text-sm text-slate-600">No active procurement matches your filters.</p>
                            <button 
                              onClick={() => {
                                setSelectedCategory('All');
                                setSelectedStatus('All');
                                setSelectedProject('All');
                                setSelectedRisk('All');
                                setSearchQuery('');
                              }}
                              className="text-xs text-[#0B3C5D] font-bold mt-2 hover:underline"
                            >
                              Reset filter query
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. VENDOR SCORECARDS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'Vendors' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">EPC Approved Suppliers & Vendor Scorecards</h2>
                  <p className="text-xs text-slate-500">Quality, on-time delivery ratings, and current active PO loads for contractors.</p>
                </div>
                <button
                  onClick={() => setIsNewVendorOpen(true)}
                  className="px-4 py-2 bg-[#0B3C5D] hover:bg-[#154c73] text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Onboard Supplier Contract
                </button>
              </div>

              {/* Vendors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {vendors.map(vendor => {
                  const vendorItems = items.filter(i => i.vendorId === vendor.id);
                  const activePOsCount = vendorItems.filter(i => !['RFQ', 'Quotation', 'Delivered', 'Installed'].includes(i.status)).length;
                  const completedCount = vendorItems.filter(i => ['Delivered', 'Installed'].includes(i.status)).length;

                  return (
                    <div key={vendor.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        {/* Header card */}
                        <div className="flex items-start justify-between border-b pb-3 mb-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {vendor.category} Vendor
                            </span>
                            <h3 className="font-extrabold text-slate-800 text-sm mt-1">{vendor.name}</h3>
                          </div>
                          <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center font-black text-xs ${
                            vendor.score >= 95 ? 'bg-green-50 text-green-700 border border-green-200' :
                            vendor.score >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <span className="text-[14px] leading-none">{vendor.score}</span>
                            <span className="text-[8px] uppercase">Score</span>
                          </div>
                        </div>

                        {/* Ratings section */}
                        <div className="space-y-3 mb-4 text-xs font-semibold text-slate-600">
                          <div className="flex justify-between items-center">
                            <span>On-Time Delivery Rate:</span>
                            <span className="font-bold font-mono text-slate-800">{vendor.onTimeDeliveryRate}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Material Quality Quality:</span>
                            <span className="font-bold font-mono text-slate-800">{vendor.qualityRating} / 5.0</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Service & Logistics Responsiveness:</span>
                            <span className="font-bold font-mono text-[#0B3C5D]">{vendor.deliveryRating} / 5.0</span>
                          </div>
                        </div>

                        {/* Active workloads */}
                        <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-bold bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-4">
                          <div>
                            <p className="text-[#0B3C5D] font-mono text-base">{activePOsCount}</p>
                            <p className="text-slate-400 uppercase text-[9px]">Active POs</p>
                          </div>
                          <div>
                            <p className="text-green-600 font-mono text-base">{completedCount}</p>
                            <p className="text-slate-400 uppercase text-[9px]">Fulfilled POs</p>
                          </div>
                        </div>
                      </div>

                      {/* Contact person info */}
                      <div className="border-t pt-3 text-[10px] font-bold text-slate-500">
                        <p className="uppercase text-slate-400 tracking-wider">Commercial Contact:</p>
                        <p className="text-slate-700 mt-0.5">{vendor.contactName}</p>
                        <p className="text-[#0B3C5D] lowercase">{vendor.contactEmail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. DOCUMENTS VAULT TAB */}
          {/* ========================================================================= */}
          {activeTab === 'Documents' && (
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Solar EPC Document Desk</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Regulatory clearance files, RFQs, vendor quotations, verified POs, transport challans, and commercial invoices.
                </p>

                {/* Simulated file upload drag & drop zone */}
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Drag & drop document here or click to browse</p>
                  <p className="text-[10px] text-slate-400 mt-1">Acceptable formats: PDF, XLSX, DOCX (Max size 10MB)</p>
                  
                  <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                    <select 
                      id="uploadPOSelect"
                      className="text-xs bg-white border border-slate-300 rounded p-1.5 focus:outline-none"
                    >
                      {items.map(item => (
                        <option key={item.id} value={item.id}>{item.id} - {item.package.substring(0, 25)}...</option>
                      ))}
                    </select>

                    <select 
                      id="uploadTypeSelect"
                      className="text-xs bg-white border border-slate-300 rounded p-1.5 focus:outline-none"
                    >
                      <option value="RFQ">RFQ</option>
                      <option value="Quotation">Quotation</option>
                      <option value="PO">Purchase Order</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Challan">Delivery Challan</option>
                    </select>

                    <button
                      onClick={() => {
                        const poEl = document.getElementById('uploadPOSelect') as HTMLSelectElement;
                        const typeEl = document.getElementById('uploadTypeSelect') as HTMLSelectElement;
                        if (poEl && typeEl) {
                          handleMockUploadDoc(
                            poEl.value,
                            typeEl.value as any,
                            `${typeEl.value}_Attached_Document_${poEl.value}.pdf`
                          );
                        }
                      }}
                      className="px-4 py-1.5 bg-[#0B3C5D] text-white hover:bg-[#154c73] text-xs font-bold rounded shadow-sm cursor-pointer"
                    >
                      Simulate Upload File
                    </button>
                  </div>
                </div>
              </div>

              {/* Master Documents Ledger */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                    Consolidated Project Documents List ({filteredDocs.length} of {allDocs.length} files)
                  </span>
                  
                  {(docSearchQuery || docPOSearchQuery || docTypeFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setDocSearchQuery('');
                        setDocPOSearchQuery('');
                        setDocTypeFilter('All');
                      }}
                      className="text-xs font-bold text-[#0B3C5D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset Document Filters
                    </button>
                  )}
                </div>

                {/* Filter Controls Bar */}
                <div className="p-4 bg-slate-50/50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search Document Name */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Document Name</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search file name (e.g., Siemens)..."
                        value={docSearchQuery}
                        onChange={(e) => setDocSearchQuery(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-[#0B3C5D] focus:border-[#0B3C5D] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Filter by PO number */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Associated PO Number</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter by PO (e.g. PO-2026-004)..."
                        value={docPOSearchQuery}
                        onChange={(e) => setDocPOSearchQuery(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-[#0B3C5D] focus:border-[#0B3C5D] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Filter by Type */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Document Type</label>
                    <select
                      value={docTypeFilter}
                      onChange={(e) => setDocTypeFilter(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:border-[#0B3C5D] focus:outline-none cursor-pointer h-[34px]"
                    >
                      <option value="All">All Types</option>
                      <option value="RFQ">RFQ</option>
                      <option value="Quotation">Quotation</option>
                      <option value="PO">Purchase Order</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Challan">Delivery Challan</option>
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {filteredDocs.map(doc => (
                    <div key={doc.id} className="p-4 hover:bg-slate-50 flex items-center justify-between text-xs gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-[10px] ${
                          doc.type === 'RFQ' ? 'bg-gray-100 text-gray-700' :
                          doc.type === 'Quotation' ? 'bg-purple-100 text-purple-700' :
                          doc.type === 'PO' ? 'bg-teal-100 text-teal-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {doc.type}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            Linked PO: <span className="font-mono text-[#0B3C5D]">{doc.poId}</span> | {doc.poPackage}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-slate-500 font-medium">
                        <span>{doc.size}</span>
                        <span>Uploaded: {doc.uploadDate}</span>
                        <div className="flex items-center gap-2">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              triggerAlert(`Downloading PDF copy of ${doc.name}`);
                            }}
                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-bold text-[10px] text-slate-700 transition-colors"
                          >
                            Download Document
                          </a>
                          <button
                            onClick={() => handleInitiateSendEmail(doc)}
                            className="px-2 py-1 bg-[#0B3C5D]/10 hover:bg-[#0B3C5D]/20 text-[#0B3C5D] rounded font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Mail className="w-3 h-3" /> Send Email
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredDocs.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-sm text-slate-600">No active documents match your search or filter options.</p>
                      <button 
                        onClick={() => {
                          setDocSearchQuery('');
                          setDocPOSearchQuery('');
                          setDocTypeFilter('All');
                        }}
                        className="text-xs text-[#0B3C5D] font-bold mt-2 hover:underline"
                      >
                        Reset document filters
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. AUDIT SYSTEM LOGS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'AuditLogs' && (
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#0B3C5D]" /> Blockchain-Standard Audit Trail & Compliance logs
                  </h2>
                  <button 
                    onClick={() => {
                      if (window.confirm('Clear all audit logs?')) {
                        setLogs([]);
                        triggerAlert('Audit log registry wiped.');
                      }
                    }}
                    className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    Wipe Log History
                  </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {logs.map((log, index) => (
                    <div key={log.id} className="relative pl-6 pb-2 border-l-2 border-slate-200 last:border-0 last:pb-0">
                      {/* Chronology visual dot */}
                      <div className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0B3C5D]" />
                      
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                          <span className="font-extrabold text-[#0B3C5D] uppercase tracking-wider text-[11px]">
                            {log.action}
                          </span>
                          <span className="font-mono text-slate-400 font-semibold text-[10px]">
                            {log.timestamp}
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium">{log.details}</p>
                        <div className="mt-2 text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-200/80 rounded text-slate-600 uppercase">
                            {log.role}
                          </span>
                          <span>by {log.user}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {logs.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                      <p className="font-bold">Audit history empty. Perform pipeline actions to update logs automatically.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* --- DRAWERS, POPUPS & MODALS --- */}
      {/* ========================================================================= */}

      {/* 1. WORKFLOW TIMELINE DRAWER / MODAL (Item details panel) */}
      {activeItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden relative">
            
            {/* Header Drawer */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-[#0B3C5D] text-white">
              <div>
                <span className="text-[10px] uppercase font-black text-[#FDB813] tracking-widest block mb-1">Procurement Operations Manager</span>
                <h3 className="text-lg font-black tracking-tight flex items-baseline gap-2">
                  {activeItem.id} <span className="text-xs font-normal text-slate-300">({activeItem.package.substring(0, 30)}...)</span>
                </h3>
              </div>
              <button 
                onClick={() => setActiveItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Scrollable Contents Drawer */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Stepper Workflow Stage Track */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Milestone Workflow Track</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {STAGES.map((stg) => {
                    const isPassed = STAGE_PROGRESS[activeItem.status] >= STAGE_PROGRESS[stg];
                    const isActive = activeItem.status === stg;
                    return (
                      <button
                        key={stg}
                        disabled={selectedRole === 'Viewer'}
                        onClick={() => handleTransitionStatus(activeItem.id, stg)}
                        className={`p-2.5 rounded-lg border text-left flex flex-col justify-between h-20 transition-all ${
                          isActive ? 'bg-[#0B3C5D] text-white border-[#0B3C5D] shadow-md shadow-[#0B3C5D]/20 scale-[1.03]' :
                          isPassed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider">{stg}</span>
                        {isPassed && !isActive ? (
                          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                        ) : isActive ? (
                          <span className="text-[9px] bg-[#FDB813] text-[#0B3C5D] px-1 rounded font-bold uppercase">Active</span>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">{STAGE_PROGRESS[stg]}%</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 text-center italic">
                  Note: Workflow transition is monitored by active user permission parameters.
                </p>
              </div>

              {/* Package Detail Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Material Class</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">{activeItem.category}</p>
                </div>
                <div className="p-3.5 bg-slate-50 border rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Sub-Project / Block</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">{activeItem.project}</p>
                </div>
                <div className="p-3.5 bg-slate-50 border rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Unit Quantity Cost</p>
                  <p className="text-xs font-bold text-slate-800 mt-1 font-mono">${activeItem.unitCost} / {activeItem.unit}</p>
                </div>
                <div className="p-3.5 bg-slate-50 border rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Allocated Cost Total</p>
                  <p className="text-xs font-black text-green-700 mt-1 font-mono">${activeItem.totalCost.toLocaleString()}</p>
                </div>
              </div>

              {/* Risk Log & Delayed controls */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Transit Risk Logs</h4>
                
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Logistics Status Remarks</label>
                  <textarea
                    id="riskNoteInput"
                    defaultValue={activeItem.riskNotes}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const input = document.getElementById('riskNoteInput') as HTMLTextAreaElement;
                      handleToggleDelay(activeItem.id, input?.value);
                    }}
                    disabled={selectedRole !== 'Project Manager' && selectedRole !== 'Admin'}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg shadow-sm border transition-all cursor-pointer ${
                      activeItem.isDelayed 
                        ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200' 
                        : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                    } ${selectedRole !== 'Project Manager' && selectedRole !== 'Admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {activeItem.isDelayed ? '⚠️ Flagged Delayed (Click to Clear)' : '⚠️ Flag Transit Delay Risk'}
                  </button>

                  {activeItem.pendingApproval && (
                    <button
                      onClick={() => handleApprovePO(activeItem.id)}
                      disabled={selectedRole !== 'Admin'}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve PO Budget
                    </button>
                  )}
                </div>
              </div>

              {/* Documents on file */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Linked Documents Vault</h4>
                <div className="space-y-2">
                  {activeItem.documents.map(doc => (
                    <div key={doc.id} className="p-2.5 bg-white rounded-lg border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 border text-slate-500 rounded text-[9px] font-bold">
                          {doc.type}
                        </span>
                        <span className="font-bold text-slate-700">{doc.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{doc.size}</span>
                    </div>
                  ))}
                  {activeItem.documents.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic text-center">No regulatory files uploaded yet.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Footer Drawer */}
            <div className="p-4 bg-slate-100 border-t flex gap-2">
              <button
                onClick={() => setActiveItem(null)}
                className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
              >
                Close Operational View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. ADD NEW PO DIALOG */}
      {isAddPOOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-zoom-in">
            <div className="p-5 bg-[#0B3C5D] text-white flex items-center justify-between">
              <h3 className="text-base font-black tracking-tight">Issue New RFQ / PO Contract</h3>
              <button onClick={() => setIsAddPOOpen(false)} className="hover:opacity-80">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Package Specification Spec</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bifacial PV Modules 550Wp"
                    value={newPO.package}
                    onChange={(e) => setNewPO(prev => ({ ...prev, package: e.target.value }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Material Group</label>
                  <select
                    value={newPO.category}
                    onChange={(e) => setNewPO(prev => ({ ...prev, category: e.target.value as MaterialCategory }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Project Sub-Phase</label>
                  <select
                    value={newPO.project}
                    onChange={(e) => setNewPO(prev => ({ ...prev, project: e.target.value }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none cursor-pointer"
                  >
                    <option value="Helios One - Phase 1 (60MW)">Phase 1 (60MW)</option>
                    <option value="Helios One - Phase 2 (40MW)">Phase 2 (40MW)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Primary Supplier</label>
                  <select
                    value={newPO.vendorId}
                    onChange={(e) => setNewPO(prev => ({ ...prev, vendorId: e.target.value }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none cursor-pointer"
                  >
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quantity Spec</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newPO.quantity}
                    onChange={(e) => setNewPO(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Unit Typology (e.g., Nos, Meters)</label>
                  <input
                    type="text"
                    required
                    value={newPO.unit}
                    onChange={(e) => setNewPO(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Unit Capital Cost ($)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={newPO.unitCost}
                    onChange={(e) => setNewPO(prev => ({ ...prev, unitCost: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target expected delivery date</label>
                  <input
                    type="date"
                    required
                    value={newPO.expectedDeliveryDate}
                    onChange={(e) => setNewPO(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Logistics / Risk Remarks</label>
                  <textarea
                    placeholder="Specify initial custom risk factor profiles."
                    value={newPO.riskNotes}
                    onChange={(e) => setNewPO(prev => ({ ...prev, riskNotes: e.target.value }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddPOOpen(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0B3C5D] hover:bg-[#154c73] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-[#0B3C5D]/10"
                >
                  Floated RFQ Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD NEW VENDOR POPUP */}
      {isNewVendorOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-zoom-in">
            <div className="p-5 bg-[#0B3C5D] text-white flex items-center justify-between">
              <h3 className="text-base font-black tracking-tight">Onboard New Approved Supplier</h3>
              <button onClick={() => setIsNewVendorOpen(false)} className="hover:opacity-80">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="p-6 space-y-4 text-xs font-semibold">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Corporate Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sungrow Power Supply"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Supplied Material category</label>
                  <select
                    value={newVendor.category}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, category: e.target.value as MaterialCategory }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Primary Commercial Contact Representative</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wang Wei"
                    value={newVendor.contactName}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, contactName: e.target.value }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. w.wei@jinkosolar.com"
                    value={newVendor.contactEmail}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewVendorOpen(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0B3C5D] hover:bg-[#154c73] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  Onboard Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PDF PRINT/SAVE PREVIEW REPORT MODAL */}
      {isPDFReportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
            <div className="p-5 bg-[#0B3C5D] text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-black tracking-tight">Solar EPC Procurement Status Report</h3>
                <p className="text-[10px] text-slate-300">Formatted and structured for printable distribution</p>
              </div>
              <button onClick={() => setIsPDFReportOpen(false)} className="hover:opacity-80">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6" id="printable-report-content">
              {/* Report Header Logo */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-[#0B3C5D]">HELIOS ONE SOLAR EPC PROJECT (100MW)</h1>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Primary Procurement, BOM, & Supplier Analysis Matrix</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">Report Generated: {new Date().toISOString().substring(0, 10)} 10:00 UTC</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-slate-700">SolarTrack Pro Systems Ltd</p>
                  <p className="text-slate-500">Commercial Operations Division</p>
                </div>
              </div>

              {/* High Level Key Metrics Table */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="border p-3.5 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Overall Completion</p>
                  <p className="text-lg font-black text-emerald-600 font-mono">{epcProgressPct}%</p>
                </div>
                <div className="border p-3.5 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Allocated Budget</p>
                  <p className="text-lg font-black text-[#0B3C5D] font-mono">${(totalCostBudget / 1000000).toFixed(2)}M</p>
                </div>
                <div className="border p-3.5 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Committed Capital</p>
                  <p className="text-lg font-black text-green-700 font-mono">${(spentCost / 1000000).toFixed(2)}M</p>
                </div>
                <div className="border p-3.5 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Active Delay Holds</p>
                  <p className="text-lg font-black text-rose-600 font-mono">{delayedCount}</p>
                </div>
              </div>

              {/* Comprehensive Grid Data List */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Purchase Order (PO) Details Ledger</h4>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 font-bold text-slate-500 border-b">
                      <th className="p-2 border-r">PO Number</th>
                      <th className="p-2 border-r">Package Details</th>
                      <th className="p-2 border-r">Vendor</th>
                      <th className="p-2 border-r text-right">Cost (USD)</th>
                      <th className="p-2 border-r text-center">Status</th>
                      <th className="p-2">ETA Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-700">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2 border-r font-mono font-bold text-[#0B3C5D]">{item.id}</td>
                        <td className="p-2 border-r">{item.package}</td>
                        <td className="p-2 border-r">{vendors.find(v => v.id === item.vendorId)?.name || 'Unknown'}</td>
                        <td className="p-2 border-r text-right font-mono">${item.totalCost.toLocaleString()}</td>
                        <td className="p-2 border-r text-center uppercase text-[10px] font-bold">{item.status}</td>
                        <td className="p-2 font-mono">{item.expectedDeliveryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 border-t pt-4 text-center italic">
                Disclaimer: SolarTrack Pro generated reports are strictly confidential. Dissemination requires authorization by plant directors.
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t flex gap-2 flex-shrink-0">
              <button
                onClick={() => setIsPDFReportOpen(false)}
                className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Report View
              </button>
              <button
                onClick={() => {
                  window.print();
                  addLog('Print Report', 'Opened report visual elements within standard print parameters.');
                }}
                className="w-full py-2.5 bg-[#0B3C5D] hover:bg-[#154c73] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-[#0B3C5D]/10"
              >
                Print PDF / Save Local Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SIMULATED EMAIL CLIENT POPUP */}
      {activeEmailDraft && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
            <div className="p-5 bg-[#0B3C5D] text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-white animate-pulse" />
                <div>
                  <h3 className="text-base font-black tracking-tight">Email Dispatch Control Centre</h3>
                  <p className="text-[10px] text-slate-300">Simulating document transmission with pre-filled PO templates</p>
                </div>
              </div>
              <button onClick={() => setActiveEmailDraft(null)} className="hover:opacity-80 cursor-pointer">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSendEmailSimulated} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold">
              {/* Document Info Badge */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Attachment</p>
                  <p className="font-bold text-slate-700 mt-0.5">{activeEmailDraft.docName}</p>
                  <p className="text-[10px] text-[#0B3C5D] mt-0.5">
                    Linked PO: {activeEmailDraft.poId} | Package: {activeEmailDraft.poPackage}
                  </p>
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase">
                  {activeEmailDraft.docType} File
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={activeEmailDraft.toName}
                    onChange={(e) => setActiveEmailDraft({ ...activeEmailDraft, toName: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recipient Email</label>
                  <input
                    type="email"
                    required
                    value={activeEmailDraft.toEmail}
                    onChange={(e) => setActiveEmailDraft({ ...activeEmailDraft, toEmail: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#0B3C5D] uppercase tracking-wider block mb-1">Subject Line (Auto-generated from PO Context)</label>
                <input
                  type="text"
                  required
                  value={activeEmailDraft.subject}
                  onChange={(e) => setActiveEmailDraft({ ...activeEmailDraft, subject: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Body Draft (Editable)</label>
                <textarea
                  required
                  rows={8}
                  value={activeEmailDraft.body}
                  onChange={(e) => setActiveEmailDraft({ ...activeEmailDraft, body: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none font-mono text-[11px] leading-relaxed"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium leading-relaxed">
                  <strong>Simulated System Action:</strong> This action will dispatch a simulated transaction, record the event in the system's live **Audit Trail**, and launch your device's native mail client using a secure <code className="bg-amber-100 px-1 rounded">mailto:</code> protocol with all details pre-filled.
                </p>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setActiveEmailDraft(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel Draft
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0B3C5D] hover:bg-[#154c73] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-[#0B3C5D]/10 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send & Open Native Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
