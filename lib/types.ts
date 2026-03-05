// Types extracted from OpenAPI spec

export type QuestionType = "text" | "number" | "radio" | "checkbox" | "date" | "file" | "boolean" | "select" | "currency" | "percentage";

// Expression object type for nested expression structures
export type ExpressionObject = 
  | { $eq: [string | ExpressionObject, any] }
  | { $ne: [string | ExpressionObject, any] }
  | { $and: ExpressionObject[] }
  | { $or: ExpressionObject[] }
  | { $not: ExpressionObject }
  | string
  | boolean
  | number;

export interface QuestionOption {
  id: string;
  text: string;
  disabled_expression?: {
    action: "hide" | "disable" | "show";
    expression: ExpressionObject;
    autoSelect?: ExpressionObject;
  } | null;
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
  section?: string | null;
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

export type QuoteResult = "QUOTED" | "REVIEW" | "DECLINED" | "PENDING" | "PROCESSING";

export interface QuoteCoverage {
  coverage_line: string;
  selected_option: number;
  limit: string;
  retention: string;
  premium: string;
}

export interface CoverageSublimit {
  name: string;
  value: number;
  key: string;
  group_name: string;
  is_additional_limit?: boolean;
  order: number;
  options: number[];
  coverage_key: string;
}

export interface CoverageRetention {
  name: string;
  value: number;
  key: string | null;
  group_name: string;
  order: number;
  coverage_key: string;
}

export interface CoverageEndorsement {
  name: string;
  id: string;
  description: string;
}

export interface CoverageOption {
  limit: number;
  retention: number;
  premium: number;
}

export interface CoverageLineDetail {
  limit: number;
  retention: number;
  premium: number;
  limit_range?: number[];
  retention_range?: number[];
  limits_of_liability?: CoverageSublimit[];
  retentions?: CoverageRetention[];
  endorsements?: CoverageEndorsement[];
  options?: Record<string, CoverageOption>;
}

export interface QuoteResponse {
  account_id?: string;
  result: QuoteResult;
  message: string;
  can_bind?: boolean;
  quote?: {
    account_id: string;
    effective_date?: string;
    expiration_date?: string;
    coverages?: QuoteCoverage[];
    coverage?: Record<string, CoverageLineDetail>;
    total_premium?: string;
    can_bind?: boolean;
    quote_number?: string;
    quote_expiration_date?: string | null;
    documents?: {
      quote_bundle?: string | null;
      sample_policy_forms?: string | null;
      endorsements?: string | null;
      application?: string | null;
    };
    subjectivities?: QuoteSubjectivity[];
    subjectivities_url?: string;
    counterpart_account_page_url?: string;
    quota_share?: Array<{ percent: number; name: string }> | null;
    carrier_type?: string;
    carrier_name?: string;
    general_endorsements?: CoverageEndorsement[];
  };
  subjectivities?: QuoteSubjectivity[];
}

export interface QuoteSubjectivity {
  key: string;
  type: "upload" | "question";
  cleared: boolean;
  question: string;
  required: boolean;
  details?: string;
  options_serializer?: string[] | null;
}

export interface IssueQuoteRequest {
  action: "clear_subjectivities" | "approve_quote" | "decline_application";
}

export interface IssueQuoteResponse {
  success: boolean;
  account_id: string;
  result?: "QUOTED";
}

export interface ApiError {
  error: string | string[];
  code?: string;
}

// Storage types for application persistence
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
  quote_data?: string;
}
