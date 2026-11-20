export type Role = 'student' | 'admin'
export type ItemType = 'lost' | 'found'
export type ItemStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'resolved'
export type ClaimStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: number
  name: string
  student_id: string | null
  email: string
  email_verified: boolean
  phone: string | null
  profile_photo_url: string | null
  role: Role
  is_active: boolean
  created_at: string | null
}

export interface Category {
  id: number
  name: string
  icon: string | null
  description?: string | null
  is_active?: boolean
}

export interface Reporter {
  id: number
  name: string
  student_id: string | null
  email: string
}

export interface Item {
  id: number
  item_name: string
  description: string
  item_type: ItemType
  location: string
  lost_found_date: string | null
  date_reported: string | null
  item_status: ItemStatus
  additional_information: string | null
  category: Category | null
  images: string[]
  image_url: string | null
  reporter: Reporter | null
  is_owner: boolean
  claims_count?: number
  claims?: Claim[]
  created_at: string | null
}

export interface Claim {
  id: number
  item_id: number
  reason: string
  proof_url: string | null
  status: ClaimStatus
  verification_code: string
  reviewed_at: string | null
  created_at: string | null
  is_mine: boolean
  item?: Pick<Item, 'id' | 'item_name' | 'item_type' | 'image_url' | 'location' | 'item_status'>
  claimant?: Reporter
  reviewer?: { id: number; name: string } | null
}

export interface AppNotification {
  id: number
  type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string | null
}

export interface ActivityEntry {
  id: number
  action: string
  description: string
  subject_type: string | null
  subject_id: number | null
  created_at: string | null
  user?: { id: number; name: string } | null
}

export interface SupportTicket {
  id: number
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'closed'
  admin_response: string | null
  responded_at: string | null
  created_at: string | null
  user?: Reporter
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface Paginated<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
  unread_count?: number
}

export interface AdminDashboard {
  stats: {
    total_users: number
    total_lost_items: number
    total_found_items: number
    pending_reports: number
    pending_claims: number
    resolved_items: number
    total_categories: number
  }
  recent_reports: Item[]
  recent_claims: Claim[]
}

export interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}
