export interface Bylaw {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  fullText: string;
  icon: string;
  category: "revenue" | "compliance" | "enforcement" | "general";
  lastUpdated: string;
  wardApplicability: string[];
}

export interface BylawCategory {
  id: string;
  name: string;
  bylaws: Bylaw[];
}