export interface WellPoint {
  id: string;
  name: string;
  field_name?: string;
  lat: number;
  lng: number;
  status: string;
  risk: string;
  depth: number;
  formation?: string;
  supportingEvidence?: {
    distance: number;
    similarity: number;
    candLabel: string;
  };
}

export interface CandidatePoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
  suitability: number;
  risk: string;
  supportingWells?: { lat: number; lng: number }[];
}
