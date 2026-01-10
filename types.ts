
export type UserRole = 'guest' | 'user' | 'admin';

export interface UserSession {
  role: UserRole;
  name: string;
}

export interface Question {
  id: string;
  text: string;
  weight: number;
  levels: string[];
  iconKey?: string;
}

export interface Domain {
  key: string;
  title: string;
  questions: Question[];
}

export interface ProjectInfo {
  userName: string;
  projectName: string;
  organization: string;
  email: string;
  phone: string;
}

export interface ScaleOption {
  v: number;
  label: string;
}

export interface Answers {
  [key: string]: (number | null)[];
}

export interface DomainScore {
    title: string;
    score: number;
}

export interface AssessmentHistoryItem {
  id: string;
  projectInfo: ProjectInfo;
  date: string;
  score: number;
  maxScore: number;
  classification: string;
  percentage: number;
  detailedAnswers: Answers;
}

export interface FeedbackMessage {
    id: string;
    name: string;
    message: string;
    role: string;
    timestamp: any; // Firestore Timestamp
    dateLabel?: string; // For display
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
