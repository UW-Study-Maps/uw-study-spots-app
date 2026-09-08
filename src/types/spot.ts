export type Category =
  | "Library"
  | "Student Union"
  | "Academic Building"
  | "Outdoor"
  | "Dining Hall"
  | "Coffee Shop";

export type Affiliation = "University" | "Off-Campus";

export interface Spot {
  id: string;
  name: string;
  category: Category;
  affiliation: Affiliation;
  address: string;
  lat: number;
  lng: number;
  description: string;
  tags: string[];
}

export interface CategoryMeta {
  color: string;
  icon: string;
  label: string;
}

export type BusynessLevel = "empty" | "some-seats" | "busy" | "full";

export interface BusynessStatus {
  level: BusynessLevel | null;
  reportedAt: number | null;
  recentCount: number;
  mixed: boolean;
}

export type FeedbackIssueType = "wrong-address" | "closed" | "wrong-hours" | "other";
