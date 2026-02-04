// Types extracted from OpenAPI spec

export type QuestionType = "text" | "number" | "radio" | "checkbox" | "date" | "file";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  key: string;
  type: QuestionType;
  title: string;
  help_text?: string;
  required: boolean;
  placeholder?: string;
  dependant_on?: string | null;
  allow_multiple_answers?: boolean;
  options_serializer?: QuestionOption[];
}

export type AnswerValue = string | number | string[];

export interface Answer {
  key: string;
  answer: AnswerValue;
}

export type ApplicationStatus = 
  | "draft" 
  | "in_progress" 
  | "submitted" 
  | "quoted" 
  | "declined" 
  | "bound";

export type CoverageType = "do" | "epli" | "fid" | "crm" | "mpl" | "gl" | "ah" | "ae" | "isogl";

export type ApplicationVersion = "1000" | "23";

export interface StartApplicationRequest {
  app_source: "counterpart";
  application_version: ApplicationVersion;
  legal_name: string;
  dba_name?: string | null;
  website?: string;
  industry?: string;
  address_1?: string;
  address_2?: string | null;
  address_city?: string;
  address_state?: string;
  address_zipcode?: string;
  broker_first_name?: string;
  broker_last_name?: string;
  broker_email?: string;
  brokerage_office_city?: string | null;
  brokerage_office_state?: string | null;
  coverages: CoverageType[];
}

export interface StartApplicationResponse {
  account_id: string;
  questions: Question[];
}

export interface GetApplicationQuestionsResponse {
  account_id: string;
  questions: Question[];
}

export interface SubmitApplicationRequest {
  answers: Answer[];
  hr_contact_name?: string;
  hr_contact_email?: string;
  hr_contact_title?: string;
  hr_contact_phone?: string;
  expiring_dec_page_pdf?: string; // Base64 encoded PDF
}

export interface SubmitApplicationResponse {
  result: "PENDING";
  message: string;
  success: boolean;
  account_id: string;
}

export interface ApiError {
  error: string | string[];
  code?: string;
}

// Storage types for localStorage
export interface StoredApplication {
  account_id: string;
  status: ApplicationStatus;
  company_name: string;
  coverages: CoverageType[];
  answers: Answer[];
  questions: Question[];
  startApplicationData?: Partial<StartApplicationRequest>;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}
