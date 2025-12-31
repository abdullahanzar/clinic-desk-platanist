// Common chief complaints organized by category for quick selection
export interface ComplaintCategory {
  name: string;
  complaints: string[];
}

export const COMMON_COMPLAINTS: ComplaintCategory[] = [
  {
    name: "General",
    complaints: [
      "Fever",
      "Fatigue",
      "Weakness",
      "Body ache",
      "Loss of appetite",
      "Weight loss",
      "Weight gain",
      "Night sweats",
      "Chills",
      "Malaise",
    ],
  },
  {
    name: "Respiratory",
    complaints: [
      "Cough",
      "Cold",
      "Sore throat",
      "Running nose",
      "Nasal congestion",
      "Sneezing",
      "Breathlessness",
      "Wheezing",
      "Chest congestion",
      "Sputum production",
    ],
  },
  {
    name: "Gastrointestinal",
    complaints: [
      "Nausea",
      "Vomiting",
      "Diarrhea",
      "Constipation",
      "Acidity",
      "Heartburn",
      "Abdominal pain",
      "Bloating",
      "Gas",
      "Loss of appetite",
      "Indigestion",
    ],
  },
  {
    name: "Pain",
    complaints: [
      "Headache",
      "Back pain",
      "Neck pain",
      "Joint pain",
      "Chest pain",
      "Muscle pain",
      "Leg pain",
      "Knee pain",
      "Shoulder pain",
      "Stomach pain",
    ],
  },
  {
    name: "Cardiovascular",
    complaints: [
      "Palpitations",
      "Chest discomfort",
      "Swelling in legs",
      "Dizziness",
      "Fainting",
      "High blood pressure",
    ],
  },
  {
    name: "Neurological",
    complaints: [
      "Headache",
      "Dizziness",
      "Vertigo",
      "Numbness",
      "Tingling",
      "Tremors",
      "Memory issues",
      "Confusion",
      "Seizures",
    ],
  },
  {
    name: "Skin",
    complaints: [
      "Rash",
      "Itching",
      "Skin redness",
      "Dry skin",
      "Acne",
      "Hair loss",
      "Skin lesion",
      "Swelling",
      "Wound",
      "Boil",
    ],
  },
  {
    name: "ENT",
    complaints: [
      "Ear pain",
      "Ear discharge",
      "Hearing loss",
      "Tinnitus",
      "Throat pain",
      "Difficulty swallowing",
      "Hoarseness",
      "Nose bleeding",
    ],
  },
  {
    name: "Eye",
    complaints: [
      "Eye pain",
      "Eye redness",
      "Watery eyes",
      "Blurred vision",
      "Eye discharge",
      "Itchy eyes",
      "Photophobia",
    ],
  },
  {
    name: "Urinary",
    complaints: [
      "Burning urination",
      "Frequent urination",
      "Blood in urine",
      "Difficulty urinating",
      "Urinary incontinence",
      "Flank pain",
    ],
  },
  {
    name: "Musculoskeletal",
    complaints: [
      "Joint stiffness",
      "Joint swelling",
      "Muscle cramps",
      "Limited mobility",
      "Bone pain",
      "Fracture",
      "Sprain",
    ],
  },
  {
    name: "Mental Health",
    complaints: [
      "Anxiety",
      "Depression",
      "Stress",
      "Insomnia",
      "Sleep disturbance",
      "Mood swings",
      "Irritability",
      "Panic attacks",
    ],
  },
  {
    name: "Women's Health",
    complaints: [
      "Menstrual irregularity",
      "Heavy periods",
      "Painful periods",
      "Vaginal discharge",
      "Breast pain",
      "Missed period",
      "Hot flashes",
    ],
  },
  {
    name: "Pediatric",
    complaints: [
      "Crying excessively",
      "Not feeding well",
      "Diaper rash",
      "Developmental delay",
      "Growth concerns",
      "Behavioral issues",
    ],
  },
];

// Flat list of all complaints for quick search
export const ALL_COMPLAINTS = COMMON_COMPLAINTS.flatMap((cat) =>
  cat.complaints.map((c) => ({ complaint: c, category: cat.name }))
);

// Get unique complaints (some appear in multiple categories)
export const UNIQUE_COMPLAINTS = [...new Set(ALL_COMPLAINTS.map((c) => c.complaint))];
