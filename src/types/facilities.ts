export type FacilityType = 'logistics' | 'customs' | 'certification' | 'financing' | 'other';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  description?: string;
  country?: string;
  website?: string;
  contact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacility {
  name: string;
  type: FacilityType;
  description?: string;
  country?: string;
  website?: string;
  contact?: string;
}

export type UpdateFacility = Partial<CreateFacility>;
