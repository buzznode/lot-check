export type InspectionStatus = 'in_progress' | 'complete';
export type Verdict = 'pass' | 'caution' | 'walk_away';
export type Severity = 'walk_away' | 'negotiate';
export type Category = 'exterior' | 'interior' | 'under_hood' | 'test_drive' | 'documents';

export interface Inspection {
  id: string;
  year: number;
  make: string;
  model: string;
  askingPrice?: number;
  status: InspectionStatus;
  verdict?: Verdict;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface InspectionItem {
  id: string;
  inspectionId: string;
  templateItemId: string;
  checked: boolean;
  flagged: boolean;
  severity?: Severity;
  note?: string;
  photoUris: string[];
  updatedAt: string;
}

export interface PurchaseRecord {
  id: string;
  platform: 'ios' | 'android';
  productId: string;
  transactionId: string;
  purchasedAt: string;
  verified: boolean;
}

export interface UserAccount {
  id: string;
  email?: string;
  cloudBackupEnabled: boolean;
  lastSyncedAt?: string;
  createdAt: string;
}

export interface ChecklistTemplateItem {
  id: string;
  category: Category;
  label: string;
  hint: string;
  severity: Severity;
}

export interface ChecklistCategory {
  id: Category;
  label: string;
  icon: string;
  items: ChecklistTemplateItem[];
}

export interface InspectionSummary {
  walkAwayCount: number;
  negotiateCount: number;
  passCount: number;
  totalChecked: number;
  totalItems: number;
  verdict: Verdict;
}

export interface PdfExportOptions {
  includeAllItems: boolean;
  includePhotos: boolean;
}
