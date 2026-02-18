/** Common lab reference ranges for quick lookup. For educational use only. */

export interface LabValueRow {
  name: string;
  normal: string;
  unit: string;
  notes?: string;
}

export const LAB_SECTIONS: { title: string; rows: LabValueRow[] }[] = [
  {
    title: 'Complete blood count (CBC)',
    rows: [
      { name: 'WBC', normal: '4.5–11.0', unit: '×10³/µL' },
      { name: 'RBC', normal: 'M 4.7–6.1, F 4.2–5.4', unit: '×10⁶/µL' },
      { name: 'Hemoglobin', normal: 'M 13.5–17.5, F 12.0–15.5', unit: 'g/dL' },
      { name: 'Hematocrit', normal: 'M 41–50%, F 36–44%', unit: '%' },
      { name: 'MCV', normal: '80–100', unit: 'fL' },
      { name: 'Platelets', normal: '150–400', unit: '×10³/µL' },
    ],
  },
  {
    title: 'Basic metabolic panel (BMP)',
    rows: [
      { name: 'Sodium', normal: '136–145', unit: 'mEq/L' },
      { name: 'Potassium', normal: '3.5–5.0', unit: 'mEq/L' },
      { name: 'Chloride', normal: '98–106', unit: 'mEq/L' },
      { name: 'Bicarbonate (CO₂)', normal: '23–29', unit: 'mEq/L' },
      { name: 'BUN', normal: '7–20', unit: 'mg/dL' },
      { name: 'Creatinine', normal: '0.7–1.3', unit: 'mg/dL', notes: 'M; F slightly lower' },
      { name: 'Glucose (fasting)', normal: '70–100', unit: 'mg/dL' },
      { name: 'Calcium', normal: '8.6–10.2', unit: 'mg/dL' },
    ],
  },
  {
    title: 'Liver function',
    rows: [
      { name: 'ALT', normal: '7–56', unit: 'U/L' },
      { name: 'AST', normal: '10–40', unit: 'U/L' },
      { name: 'Alkaline phosphatase', normal: '44–147', unit: 'U/L' },
      { name: 'Total bilirubin', normal: '0.1–1.2', unit: 'mg/dL' },
      { name: 'Direct bilirubin', normal: '0–0.3', unit: 'mg/dL' },
      { name: 'Albumin', normal: '3.4–5.4', unit: 'g/dL' },
    ],
  },
  {
    title: 'Coagulation',
    rows: [
      { name: 'PT', normal: '11–13.5', unit: 'sec', notes: 'INR 0.9–1.1' },
      { name: 'PTT', normal: '25–35', unit: 'sec' },
      { name: 'INR', normal: '0.9–1.1', unit: '' },
    ],
  },
  {
    title: 'Lipids',
    rows: [
      { name: 'Total cholesterol', normal: '<200', unit: 'mg/dL' },
      { name: 'LDL', normal: '<100', unit: 'mg/dL' },
      { name: 'HDL', normal: 'M >40, F >50', unit: 'mg/dL' },
      { name: 'Triglycerides', normal: '<150', unit: 'mg/dL' },
    ],
  },
  {
    title: 'Thyroid',
    rows: [
      { name: 'TSH', normal: '0.4–4.0', unit: 'mIU/L' },
      { name: 'Free T4', normal: '0.8–1.8', unit: 'ng/dL' },
    ],
  },
  {
    title: 'Other',
    rows: [
      { name: 'Troponin I', normal: '<0.04', unit: 'ng/mL', notes: 'assay-dependent' },
      { name: 'BNP', normal: '<100', unit: 'pg/mL' },
      { name: 'CRP', normal: '<10', unit: 'mg/L' },
      { name: 'ESR', normal: 'M <15, F <20', unit: 'mm/hr' },
      { name: 'Amylase', normal: '30–118', unit: 'U/L' },
      { name: 'Lipase', normal: '0–160', unit: 'U/L' },
    ],
  },
];
