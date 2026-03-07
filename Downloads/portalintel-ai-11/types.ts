
import React from 'react';

export type UserRole = 'Scout' | 'Director' | 'Insider' | 'Admin';
export type AccessLevel = 'Free' | 'Pro' | 'Enterprise';

export interface NILDeal {
  brand: string;
  amount: string;
  terms: string;
  date?: string;
}

export interface ProgramBlueprint {
  schoolName: string;
  offensiveScheme: string;
  defensiveScheme: string;
  recruitingPriorities: string[]; 
  rosterNeeds: string[]; 
  nilBudgetTier: 'Low' | 'Medium' | 'High' | 'Elite';
  culturePillars: string[];
}

export interface NFLDraftProspect {
  id: string;
  name: string;
  position: string;
  school: string;
  classYear: string; // Draft class
  projectedRound: string;
  consensusRank: number;
  pffGrade?: string;
  kiperTake?: string;
  walterFootballRank?: string;
  mockDraftDbRank?: string;
  physicalTraits?: string;
  nflComparison?: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  sources: GroundingSource[];
  videoLinks?: { title: string, url: string }[];
}

export interface Commitment {
  schoolName: string | null;
  commitmentDate: string | null;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  previousSchool: string; 
  highSchool?: string;    
  state?: string;         
  classYear?: string;     
  predictedDestination: string;
  stars: number;
  stats?: string;
  summary: string;
  lastUpdated: string;
  nilValue?: string;
  nilDeals?: NILDeal[];
  highlights?: string[];
  capabilities?: string[]; 
  physicalTraits?: string; 
  schemeFit?: string;      
  valueRating?: number;
  impactScore?: number;
  marketReasoning?: string;
  rank?: number;
  recruitingType?: 'College' | 'HS'; 
  draftEligibility?: string;
  draftProjection?: string;
  commitment?: Commitment;
  photoUrl?: string; 
  alignmentScore?: number; 
  videoLinks?: { title: string, url: string }[];
}

export interface ScoutUser {
  id: string;
  name: string;
  handle: string;
  email?: string; 
  role: UserRole;
  accessLevel: AccessLevel;
  isVerified: boolean;
  password?: string;
  createdAt: number;
  blueprint?: ProgramBlueprint; 
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  timestamp: string;
  urgency: 'Low' | 'Medium' | 'High';
  sources?: GroundingSource[]; 
}

export interface SavedPrompt {
  id: string;
  query: string;
  timestamp: number;
  isFast: boolean;
  resultCount: number;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: GroundingSource[];
  timestamp: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'sheet' | 'doc' | 'link' | 'image';
  url: string;
  size?: string;
}

export type ForumCategory = 
  | 'Entry' 
  | 'Commitment' 
  | 'NIL Intel' 
  | 'Roster Needs' 
  | 'Withdrawal' 
  | 'OV Intel' 
  | 'Analysis' 
  | 'Rumor'
  | 'HS Prospect';

export interface ForumBoard {
  id: string;
  name: string;
  description: string;
  icon: string; 
  authorId: string;
  isPrivate: boolean;
  timestamp: number;
}

export interface ForumPost {
  id: string;
  boardId?: string; 
  author: string;
  role: UserRole;
  title: string;
  content: string;
  category: ForumCategory;
  timestamp: number;
  upvotes: number;
  aiTake?: string;
  attachments?: Attachment[];
  images?: string[]; 
}

export interface SavedComparison {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  players: string[];
}

export interface SavedProgram {
  id: string;
  schoolName: string;
  status: 'Aggressive' | 'Passive' | 'Neutral';
  keyTargets: string[];
}

export interface SavedTrend {
  id: string;
  tag: string;
  status: string;
  description?: string;
}

export interface TeamAllocation {
  id: string;
  name: string;
  percentage: number;
}

export enum PortalTab {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  VOICE_HUB = 'VOICE_HUB',
  SEARCH = 'SEARCH',
  BIG_BOARD = 'BIG_BOARD',
  SAVED_INTEL = 'SAVED_INTEL',
  NIL_BIG_BOARD = 'NIL_BIG_BOARD',
  HS_SEARCH = 'HS_SEARCH',
  HS_BIG_BOARD = 'HS_BIG_BOARD',
  HS_SAVED_INTEL = 'HS_SAVED_INTEL',
  SOCIAL_INTEL = 'SOCIAL_INTEL',
  PODCAST_HUB = 'PODCAST_HUB',
  FORUM = 'FORUM',
  HELP_CENTER = 'HELP_CENTER',
  ADMIN_MEMBERS = 'ADMIN_MEMBERS',
  NFL_DRAFT_INTEL = 'NFL_DRAFT_INTEL'
}
