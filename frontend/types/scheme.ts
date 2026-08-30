export type SchemeStatus = 'draft_setup' | 'active' | 'completed';
export type YearOfStudy = 'FE' | 'SE' | 'TE' | 'BE';
export type Vertical = 'BSESC' | 'PCPEC' | 'MDC' | 'SC' | 'HSSM' | 'EL' | 'LLC' | 'BC';
export type SubVertical =
  | 'BSC' | 'ESC'                       // under BSESC
  | 'PCC' | 'PEC'                       // under PCPEC
  | 'MDM' | 'OE'                        // under MDC
  | 'VSEC'                              // under SC
  | 'AEC' | 'EEMC' | 'IKS' | 'VEC'      // under HSSM
  | 'RM' | 'CEFP' | 'PRJ' | 'INT'       // under EL
  | 'CC';                               // under LLC
export type TeachingComponentType = 'TH' | 'TU' | 'PR' | 'SL';

export const VERTICAL_SUBVERTICALS: Record<Vertical, SubVertical[]> = {
  BSESC: ['BSC', 'ESC'],
  PCPEC: ['PCC', 'PEC'],
  MDC:   ['MDM', 'OE'],
  SC:    ['VSEC'],
  HSSM:  ['AEC', 'EEMC', 'IKS', 'VEC'],
  EL:    ['RM', 'CEFP', 'PRJ', 'INT'],
  LLC:   ['CC'],
  BC:    [],
};

export const STUDY_YEAR_MARKER: Record<number, '11' | '12' | '13' | '14'> = {
  1: '11', 2: '11', 3: '12', 4: '12', 5: '13', 6: '13', 7: '14', 8: '14',
};

export const SEMESTER_PAIR: Record<number, YearOfStudy> = {
  1: 'FE', 2: 'FE', 3: 'SE', 4: 'SE', 5: 'TE', 6: 'TE', 7: 'BE', 8: 'BE',
};

export const PAIR_SEMESTERS: Record<YearOfStudy, [number, number]> = {
  FE: [1, 2], SE: [3, 4], TE: [5, 6], BE: [7, 8],
};

export interface CurriculumScheme {
  id: string;
  department_id: string;
  entering_year: string;
  scheme_year_code: string;
  status: SchemeStatus;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
  semesters?: Array<{
    number: number;
    is_unlocked: boolean;
    shell_completed_at: string | null;
    unlocked_at: string | null;
    course_count: number;
  }>;
}

export interface TeachingComponentRow {
  id: string;
  course_id: string;
  component_type: TeachingComponentType;
  hours: number;
  ise_marks?: number | null;
  mse_marks?: number | null;
  ese_min_marks?: number | null;
  ese_max_marks?: number | null;
  total_marks?: number | null;
  credit_points?: number | null;
  sort_order: number;
}

export interface SchemeCourseRow {
  id: string;
  semester_id: string;
  code: string;
  code_is_custom: number;
  title: string;
  course_type: string;
  status: string;
  faculty_user_id: string | null;
  faculty_name?: string;
  vertical?: Vertical | null;
  sub_vertical?: SubVertical | null;
  total_credits?: number | null;
  components: TeachingComponentRow[];
}
