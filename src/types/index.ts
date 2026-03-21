// ========== Core Entities ==========

export interface Country {
  id: string;
  iso_code: string;
  name: string;
  name_vn: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  country_id: string;
  name: string;
  slug: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  country?: Country;
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  name_vn: string;
  icon_url?: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  company_id?: string;
  category_id?: string;
  name: string;
  slug: string;
  logo_url?: string;
  is_vietnamese: boolean;
  is_verified?: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
  category?: ProductCategory;
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  image_url?: string;
  metadata?: Record<string, unknown>;
  source?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  brand?: Brand;
}

export interface BarcodeType {
  id: string;
  name: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Barcode {
  barcode_value: string;
  product_id: string;
  type_id?: string;
  is_verified: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
  barcode_type?: BarcodeType;
}

export interface PendingProduct {
  id: string;
  barcode: string;
  product_name: string;
  brand_name: string;
  brand_id?: string;
  image_url?: string;
  metadata?: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
  brand?: Brand;
}

// ========== Moral Status / Classifications ==========

export interface BrandClassification {
  id: string;
  code: string;
  name: string;
  description?: string;
  color_code?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandMoralStatus {
  id: string;
  brand_id: string;
  classification_id: string;
  reason_vn: string;
  reason_en?: string;
  evidence_url?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  brand?: Brand;
  classification?: BrandClassification;
}

export interface CompanyMoralStatus {
  id: string;
  company_id: string;
  classification_id: string;
  reason_vn: string;
  reason_en?: string;
  evidence_url?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
  classification?: BrandClassification;
}

export interface CountryMoralStatus {
  id: string;
  country_id: string;
  classification_id: string;
  reason_vn: string;
  reason_en?: string;
  evidence_url?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  country?: Country;
  classification?: BrandClassification;
}

// ========== Aliases ==========

export interface BrandAlias {
  id: string;
  brand_id: string;
  alias_name: string;
  normalized_alias: string;
  is_verified: boolean;
  created_at: string;
  brand?: Brand;
}

// ========== Reports ==========

export interface ReportType {
  id: string;
  code: string;
  name: string;
}

export interface Report {
  id: string;
  brand_id?: string;
  barcode_value?: string;
  type: string;
  description?: string;
  status: string;
  device_fingerprint: string;
  assigned_to?: string;
  resolution_note?: string;
  created_at: string;
  resolved_at?: string;
  brand?: Brand;
}

// ========== Pagination ==========

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
