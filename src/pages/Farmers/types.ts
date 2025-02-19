
export interface Seller {
  id: string;
  business_name: string | null;
  location: string | null;
  bio: string | null;
  role: 'farmer' | 'buyer' | 'admin';
  avatar_url: string | null;
}

export interface Profile {
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  role: 'farmer' | 'buyer' | 'admin';
}
