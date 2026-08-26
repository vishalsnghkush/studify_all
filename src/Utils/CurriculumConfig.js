// ─────────────────────────────────────────────────────────────────────────────
// Studify CurriculumConfig.js
// Complete NCERT-aligned Syllabus Data for Classes 6–12 (All Subjects)
// ─────────────────────────────────────────────────────────────────────────────

export const BOARDS = [
  { label: 'CBSE', value: 'CBSE' },
  { label: 'ICSE / ISC', value: 'ICSE' },
  { label: 'State Board', value: 'State Board' },
  { label: 'Competitive (JEE/NEET)', value: 'Competitive' },
];

export const CLASSES = [
  { label: 'Class 6', value: 'Class 6' },
  { label: 'Class 7', value: 'Class 7' },
  { label: 'Class 8', value: 'Class 8' },
  { label: 'Class 9', value: 'Class 9' },
  { label: 'Class 10', value: 'Class 10' },
  { label: 'Class 11', value: 'Class 11' },
  { label: 'Class 12', value: 'Class 12' },
];

export const STREAMS = [
  { label: 'Science', value: 'Science' },
  { label: 'Commerce', value: 'Commerce' },
  { label: 'Arts / Humanities', value: 'Arts' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Board-specific class lists
// ICSE = Class 9-10, ISC = Class 11-12, CBSE/State = Class 6-12
// ─────────────────────────────────────────────────────────────────────────────
export const getClassesForBoard = (board) => {
  if (board === 'ICSE') {
    return [
      { label: 'Class 6', value: 'Class 6' },
      { label: 'Class 7', value: 'Class 7' },
      { label: 'Class 8', value: 'Class 8' },
      { label: 'Class 9 (ICSE)', value: 'Class 9' },
      { label: 'Class 10 (ICSE)', value: 'Class 10' },
      { label: 'Class 11 (ISC)', value: 'Class 11' },
      { label: 'Class 12 (ISC)', value: 'Class 12' },
    ];
  }
  if (board === 'Competitive') {
    return [
      { label: 'Class 11', value: 'Class 11' },
      { label: 'Class 12', value: 'Class 12' },
    ];
  }
  // CBSE, State Board — all classes
  return CLASSES;
};

// ─────────────────────────────────────────────────────────────────────────────
// Subject lists per class — Board-aware (CBSE / ICSE-ISC / State)
// ─────────────────────────────────────────────────────────────────────────────
export const getSubjectsForClass = (studentClass, stream, board = 'CBSE') => {

  // ══════════════════════════════════════════════════════════════════════════
  // ICSE / ISC Board (Classes 6-12)
  // ══════════════════════════════════════════════════════════════════════════
  if (board === 'ICSE') {
    // Class 6, 7 & 8 (Middle school — same foundation subjects as CBSE)
    if (['Class 6', 'Class 7', 'Class 8'].includes(studentClass)) {
      return [
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'Science', value: 'Science' },
        { label: 'History / Social Studies', value: 'History' },
        { label: 'Civics', value: 'Civics' },
        { label: 'Geography', value: 'Geography' },
        { label: 'English', value: 'English' },
        { label: 'Hindi', value: 'Hindi' },
        { label: 'Sanskrit', value: 'Sanskrit' },
        { label: 'Computer Science / Applications', value: 'Computer Science' },
      ];
    }

    if (['Class 9', 'Class 10', 'Class 11', 'Class 12'].includes(studentClass)) {
      if (stream === 'Science') {
        return [
          { label: 'English Paper - I (Grammar)', value: 'English Paper 1' },
          { label: 'English Paper - II (Literature)', value: 'English Paper 2' },
          { label: 'Science 1 (Physics)', value: 'Science 1' },
          { label: 'Science 2 (Chemistry)', value: 'Science 2' },
          { label: 'Science 3 (Biology)', value: 'Science 3' },
          { label: 'Mathematics', value: 'Mathematics' },
          { label: 'HCG 1 (History & Civics)', value: 'HCG 1' },
          { label: 'HCG 2 (Geography)', value: 'HCG 2' },
          { label: 'Hindi', value: 'Hindi' },
          { label: 'Computer Applications (Java)', value: 'Computer Applications' },
          { label: 'Physical Education', value: 'Physical Education' },
        ];
      }
      if (stream === 'Commerce') {
        return [
          { label: 'English Paper - I (Grammar)', value: 'English Paper 1' },
          { label: 'English Paper - II (Literature)', value: 'English Paper 2' },
          { label: 'Commercial Studies', value: 'Commercial Studies' },
          { label: 'Commercial Applications', value: 'Commercial Applications' },
          { label: 'Economics', value: 'Economics' },
          { label: 'Mathematics', value: 'Mathematics' },
          { label: 'HCG 1 (History & Civics)', value: 'HCG 1' },
          { label: 'HCG 2 (Geography)', value: 'HCG 2' },
          { label: 'Hindi', value: 'Hindi' },
          { label: 'Computer Applications (Java)', value: 'Computer Applications' },
          { label: 'Physical Education', value: 'Physical Education' },
        ];
      }
      if (stream === 'Arts') {
        return [
          { label: 'English Paper - I (Grammar)', value: 'English Paper 1' },
          { label: 'English Paper - II (Literature)', value: 'English Paper 2' },
          { label: 'HCG 1 (History & Civics)', value: 'HCG 1' },
          { label: 'HCG 2 (Geography)', value: 'HCG 2' },
          { label: 'Economics', value: 'Economics' },
          { label: 'Hindi', value: 'Hindi' },
          { label: 'Mathematics', value: 'Mathematics' },
          { label: 'Computer Applications (Java)', value: 'Computer Applications' },
          { label: 'Physical Education', value: 'Physical Education' },
        ];
      }
      // If stream not selected yet, return all ICSE subjects so user can also pick directly if needed
      return [
        { label: 'English Paper - I (Grammar)', value: 'English Paper 1' },
        { label: 'English Paper - II (Literature)', value: 'English Paper 2' },
        { label: 'HCG 1 (History & Civics)', value: 'HCG 1' },
        { label: 'HCG 2 (Geography)', value: 'HCG 2' },
        { label: 'Hindi', value: 'Hindi' },
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'Computer Applications (Java)', value: 'Computer Applications' },
        { label: 'Commercial Studies', value: 'Commercial Studies' },
        { label: 'Commercial Applications', value: 'Commercial Applications' },
        { label: 'Science 1 (Physics)', value: 'Science 1' },
        { label: 'Science 2 (Chemistry)', value: 'Science 2' },
        { label: 'Science 3 (Biology)', value: 'Science 3' },
        { label: 'Physical Education', value: 'Physical Education' },
        { label: 'Economics', value: 'Economics' },
      ];
    }
    return [];
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CBSE / State Board / Competitive
  // ══════════════════════════════════════════════════════════════════════════
  if (['Class 11', 'Class 12'].includes(studentClass)) {
    if (stream === 'Science') {
      return [
        { label: 'Physics', value: 'Physics' },
        { label: 'Chemistry', value: 'Chemistry' },
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'Biology', value: 'Biology' },
        { label: 'Computer Science', value: 'Computer Science' },
        { label: 'English', value: 'English' },
        { label: 'Hindi', value: 'Hindi' },
        { label: 'Physical Education', value: 'Physical Education' },
      ];
    }
    if (stream === 'Commerce') {
      return [
        { label: 'Accountancy', value: 'Accountancy' },
        { label: 'Business Studies', value: 'Business Studies' },
        { label: 'Economics', value: 'Economics' },
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'English', value: 'English' },
        { label: 'Hindi', value: 'Hindi' },
        { label: 'Physical Education', value: 'Physical Education' },
      ];
    }
    if (stream === 'Arts') {
      return [
        { label: 'History', value: 'History' },
        { label: 'Political Science', value: 'Political Science' },
        { label: 'Geography', value: 'Geography' },
        { label: 'Psychology', value: 'Psychology' },
        { label: 'Sociology', value: 'Sociology' },
        { label: 'Economics', value: 'Economics' },
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'English', value: 'English' },
        { label: 'Hindi', value: 'Hindi' },
        { label: 'Physical Education', value: 'Physical Education' },
      ];
    }
    return []; // Stream selection required
  }

  // Classes 9 & 10 (CBSE / State)
  if (['Class 9', 'Class 10'].includes(studentClass)) {
    return [
      { label: 'Mathematics', value: 'Mathematics' },
      { label: 'Science', value: 'Science' },
      { label: 'Physics', value: 'Physics' },
      { label: 'Chemistry', value: 'Chemistry' },
      { label: 'Biology', value: 'Biology' },
      { label: 'History', value: 'History' },
      { label: 'Civics / Political Science', value: 'Civics' },
      { label: 'Geography', value: 'Geography' },
      { label: 'Economics', value: 'Economics' },
      { label: 'English', value: 'English' },
      { label: 'Hindi', value: 'Hindi' },
      { label: 'Sanskrit', value: 'Sanskrit' },
      { label: 'Computer Applications', value: 'Computer Science' },
    ];
  }

  // Classes 6, 7 & 8
  return [
    { label: 'Mathematics', value: 'Mathematics' },
    { label: 'Science', value: 'Science' },
    { label: 'History / Our Pasts', value: 'History' },
    { label: 'Civics / Social & Political Life', value: 'Civics' },
    { label: 'Geography / Our Environment', value: 'Geography' },
    { label: 'English', value: 'English' },
    { label: 'Hindi', value: 'Hindi' },
    { label: 'Sanskrit', value: 'Sanskrit' },
    { label: 'Computer Science / IT', value: 'Computer Science' },
  ];
};

export const formatSubjectForBoard = (subject, board = 'CBSE') => {
  if (!subject) return '';
  const s = String(subject).trim();
  const sl = s.toLowerCase();
  
  if (board === 'ICSE') {
    if (sl === 'physics' || sl === 'physic') return 'Science 1';
    if (sl === 'chemistry' || sl === 'chem') return 'Science 2';
    if (sl === 'biology' || sl === 'bio') return 'Science 3';
    if (sl === 'history' || sl === 'civics' || sl === 'history & civics' || sl.includes('civic') || sl.includes('history')) return 'HCG 1';
    if (sl === 'geography' || sl.includes('geography')) return 'HCG 2';
    if (sl === 'computer science' || sl === 'computer applications' || sl.includes('computer') || sl.includes('coding')) return 'Computer Applications';
    if (sl === 'english grammar' || sl === 'english 1' || sl === 'english paper 1') return 'English Paper 1';
    if (sl === 'english literature' || sl === 'english 2' || sl === 'english paper 2') return 'English Paper 2';
    if (sl === 'commercial studies' || sl === 'commercial application') return 'Commercial Studies';
  }
  return s;
};

export const normalizeSubject = (rawSub, topicOrTitle = '') => {
  const text = `${rawSub || ''} ${topicOrTitle || ''}`.toLowerCase();

  // ── ICSE-specific subject values (check first) ────────────────────────────
  if (/\b(english paper.?1|english paper.?i\b|english grammar)/i.test(text)) return 'English Paper 1';
  if (/\b(english paper.?2|english paper.?ii\b|english literature|drama|prose.*poem)/i.test(text)) return 'English Paper 2';
  if (/\b(hcg.?1|history.*civics|civics.*history)/i.test(text)) return 'HCG 1';
  if (/\b(hcg.?2)/i.test(text)) return 'HCG 2';
  if (/\b(science.?1|science.*physics)/i.test(text)) return 'Science 1';
  if (/\b(science.?2|science.*chemistry)/i.test(text)) return 'Science 2';
  if (/\b(science.?3|science.*biology)/i.test(text)) return 'Science 3';
  if (/\b(commercial studies)/i.test(text)) return 'Commercial Studies';
  if (/\b(commercial application)/i.test(text)) return 'Commercial Applications';
  if (/\b(computer application|java programming)/i.test(text)) return 'Computer Applications';

  // ── Generic subject patterns (CBSE / all boards) ──────────────────────────
  if (/\b(math|maths|mathematics|algebra|geometry|trigonometry|calculus|polynomials?|number system|equations?|stats?|statistics|vectors?|matrix|probability|arithmetic|progression|mensuration|quadratic)\b/i.test(text)) return 'Mathematics';
  if (/\b(physic|physics|motion|force|gravity|electricity|optics|magnet|thermo|wave|current|kinematics|gravitation|oscillation|semiconductor)\b/i.test(text)) return 'Physics';
  if (/\b(chem|chemistry|acid|base|organic|periodic|reaction|atom|element|compound|carbon|bonding|solution|electrochemistry|equilibrium)\b/i.test(text)) return 'Chemistry';
  if (/\b(bio|biology|cell|tissue|organ|reproduction|genetics|plant|life process|dna|rna|photosynthesis|heredity|evolution|biotechnology)\b/i.test(text)) return 'Biology';
  if (/\b(science)\b/i.test(text)) return 'Science';
  if (/\b(english|grammar|prose|poem|beehive|hornbill|flamingo|literature)\b/i.test(text)) return 'English';
  if (/\b(hindi|vyakaran|vasant|kshitij|antral|sparsh|sanch|rimjhim)\b/i.test(text)) return 'Hindi';
  if (/\b(sanskrit|shemushi|ruchira|vyakaran|dhatu)\b/i.test(text)) return 'Sanskrit';
  if (/\b(computer|python|coding|java|c\+\+|sql|database|network|it|information technology)\b/i.test(text)) return 'Computer Science';
  if (/\b(account|accounts|accountancy|gst|journal|ledger|balance sheet|asset|debit|trial balance)\b/i.test(text)) return 'Accountancy';
  if (/\b(econ|economics|gdp|market|demand|supply|inflation|money|national income|development)\b/i.test(text)) return 'Economics';
  if (/\b(business|trade|commerce|management|bst|marketing|finance|fayol|taylor)\b/i.test(text)) return 'Business Studies';
  if (/\b(social|history|civic|civics|geography|polity|democracy|nationalism|federalism)\b/i.test(text)) return 'History';
  if (/\b(political|polity|constitution|parliament|judiciary|fundamental rights)\b/i.test(text)) return 'Political Science';
  if (/\b(geography|landform|climate|drainage|agriculture|mineral|population|settlement)\b/i.test(text)) return 'Geography';
  if (/\b(psychology|behavior|cognition|perception|learning|motivation|emotion|personality)\b/i.test(text)) return 'Psychology';
  if (/\b(sociology|society|culture|institution|caste|inequality|social change|community)\b/i.test(text)) return 'Sociology';
  if (/\b(physical education|pe|sports|fitness|yoga|athletics|health)\b/i.test(text)) return 'Physical Education';

  if (rawSub) {
    const s = rawSub.trim();
    const sl = s.toLowerCase();
    if (sl.startsWith('math')) return 'Mathematics';
    if (sl.startsWith('phys')) return 'Physics';
    if (sl.startsWith('chem')) return 'Chemistry';
    if (sl.startsWith('bio')) return 'Biology';
    if (sl.startsWith('sci')) return 'Science';
    if (sl.startsWith('eng')) return 'English';
    if (sl.startsWith('hin')) return 'Hindi';
    if (sl.startsWith('san')) return 'Sanskrit';
    if (sl.startsWith('acc')) return 'Accountancy';
    if (sl.startsWith('eco')) return 'Economics';
    if (sl.startsWith('soc')) return 'Sociology';
    if (sl.startsWith('pol')) return 'Political Science';
    if (sl.startsWith('geo')) return 'Geography';
    if (sl.startsWith('psy')) return 'Psychology';
    if (sl.startsWith('com')) return 'Computer Science';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  return 'Mathematics';
};

// ─────────────────────────────────────────────────────────────────────────────
// Class normalizer
// ─────────────────────────────────────────────────────────────────────────────
export const normalizeClass = (rawClass, topicOrTitle = '') => {
  const text = `${rawClass || ''} ${topicOrTitle || ''}`.toLowerCase();

  if (text.includes('class 12') || text.includes('class-12') || text.includes('class12') || text.includes('grade 12') || text.includes('12th')) return 'Class 12';
  if (text.includes('class 11') || text.includes('class-11') || text.includes('class11') || text.includes('grade 11') || text.includes('11th')) return 'Class 11';
  if (text.includes('class 10') || text.includes('class-10') || text.includes('class10') || text.includes('grade 10') || text.includes('10th')) return 'Class 10';
  if (text.includes('class 9')  || text.includes('class-9')  || text.includes('class9')  || text.includes('grade 9')  || text.includes('9th'))  return 'Class 9';
  if (text.includes('class 8')  || text.includes('class-8')  || text.includes('class8')  || text.includes('grade 8')  || text.includes('8th'))  return 'Class 8';
  if (text.includes('class 7')  || text.includes('class-7')  || text.includes('class7')  || text.includes('grade 7')  || text.includes('7th'))  return 'Class 7';
  if (text.includes('class 6')  || text.includes('class-6')  || text.includes('class6')  || text.includes('grade 6')  || text.includes('6th'))  return 'Class 6';

  if (rawClass) {
    const trimmed = String(rawClass).trim();
    if (trimmed.startsWith('Class')) return trimmed;
    if (/^\d+$/.test(trimmed)) return `Class ${trimmed}`;
  }
  return 'Class 10';
};

// ─────────────────────────────────────────────────────────────────────────────
// Stream normalizer
// ─────────────────────────────────────────────────────────────────────────────
export const normalizeStream = (subject, studentClass, board = 'CBSE') => {
  // ICSE Class 9-10 doesn't need streams
  if (board === 'ICSE' && ['Class 9', 'Class 10'].includes(studentClass)) return '';
  if (!['Class 11', 'Class 12'].includes(studentClass)) return '';
  const s = (subject || '').trim().toLowerCase();

  if (s.includes('physic') || s.includes('chem') || s.includes('bio') || s.includes('computer') || s.includes('science 1') || s.includes('science 2') || s.includes('science 3')) return 'Science';
  if (s.includes('account') || s.includes('business') || s.includes('ledger') || s.includes('journal') || s.includes('econ') || s.includes('commercial')) return 'Commerce';
  if (s.includes('history') || s.includes('pol') || s.includes('political') || s.includes('psych') || s.includes('soc') || s.includes('geo') || s.includes('hcg')) return 'Arts';
  if (s.includes('math') || s.includes('english') || s.includes('hindi')) return 'Science'; // default common subjects to Science
  return 'Science';
};

// ─────────────────────────────────────────────────────────────────────────────
// Strict NCERT Syllabus & Subject-Aware Quick Chips Database
// All classes, all subjects, NCERT-accurate chapter names
// ─────────────────────────────────────────────────────────────────────────────
export const getSyllabusData = (studentClass = 'Class 10', subject = '') => {
  const normSub = (subject || '').trim().toLowerCase();
  const cls = (studentClass || 'Class 10').trim();

  // ── ICSE-Specific Subject Flags ──────────────────────────────────────────
  const isEngPaper1 = normSub.includes('english paper 1') || normSub.includes('english paper - i') || normSub === 'english paper 1';
  const isEngPaper2 = normSub.includes('english paper 2') || normSub.includes('english paper - ii') || normSub === 'english paper 2';
  const isHCG1      = normSub.includes('hcg 1') || normSub.includes('hcg1');
  const isHCG2      = normSub.includes('hcg 2') || normSub.includes('hcg2');
  const isSci1      = normSub.includes('science 1') || normSub.includes('science1');
  const isSci2      = normSub.includes('science 2') || normSub.includes('science2');
  const isSci3      = normSub.includes('science 3') || normSub.includes('science3');
  const isCommStud  = normSub.includes('commercial studies');
  const isCommApp   = normSub.includes('commercial application');
  const isCompApp   = normSub.includes('computer application');

  // ── Generic Subject Type Flags ──────────────────────────────────────────
  const isHistory    = isHCG1 || normSub.includes('history');
  const isGeography  = isHCG2 || normSub.includes('geography') || normSub.includes('geo');
  const isCivics     = isHCG1 || normSub.includes('civic') || normSub.includes('political') || normSub.includes('polity');
  const isPolity     = isCivics; // Political Science is the Class 11/12 name for Civics
  const isEnglish    = isEngPaper1 || isEngPaper2 || normSub.includes('english');
  const isHindi      = normSub.includes('hindi');
  const isSanskrit   = normSub.includes('sanskrit');
  const isMath       = normSub.includes('math');
  const isPhysics    = isSci1 || normSub.includes('physic');
  const isChemistry  = isSci2 || normSub.includes('chem');
  const isBiology    = isSci3 || normSub.includes('bio');
  const isScience    = normSub === 'science';
  const isEconomics  = normSub.includes('econ');
  const isAccountancy = normSub.includes('account');
  const isBusiness   = normSub.includes('business');
  const isCS         = normSub.includes('computer') || normSub.includes('coding') || normSub.includes('it');
  const isSociology  = normSub.includes('sociol');
  const isPsychology = normSub.includes('psych');
  const isPE         = normSub.includes('physical') || normSub.includes(' pe');

  // ── Subject-Aware Action Chips ───────────────────────────────────────────
  let actionChips = [];
  if (isEngPaper1) {
    actionChips = [
      { label: 'Functional Grammar Rules', icon: 'format-text' },
      { label: 'Letter & Email Formats', icon: 'email-edit-outline' },
      { label: 'Composition & Essay Writing', icon: 'pencil-box-outline' },
      { label: 'Unseen Passage Techniques', icon: 'file-document-outline' },
    ];
  } else if (isEngPaper2) {
    actionChips = [
      { label: 'Merchant of Venice / Drama', icon: 'theater' },
      { label: 'Treasure Trove Prose Summary', icon: 'book-open-variant' },
      { label: 'Treasure Trove Poetry Analysis', icon: 'script-text-outline' },
      { label: 'Character Sketches & Extracts', icon: 'account-details' },
    ];
  } else if (isHCG1) {
    actionChips = [
      { label: 'Key Dates & Timelines', icon: 'calendar-clock' },
      { label: 'Civics: Parliament & Courts', icon: 'scale-balance' },
      { label: '1857 Revolt & Freedom Struggle', icon: 'shield-cross' },
      { label: 'ICSE Previous Year Questions', icon: 'history' },
    ];
  } else if (isHCG2) {
    actionChips = [
      { label: 'Topographical Maps (Topo Sheet)', icon: 'map-marker-radius' },
      { label: 'Map Work of India', icon: 'terrain' },
      { label: 'Climate, Soils & Vegetation', icon: 'leaf' },
      { label: 'ICSE Previous Year Questions', icon: 'history' },
    ];
  } else if (isSci1) {
    actionChips = [
      { label: 'Physics Formulas & Units', icon: 'axis-arrow' },
      { label: 'Ray Diagrams & Lens Refraction', icon: 'sine-wave' },
      { label: 'Circuit Diagrams & Ohm\'s Law', icon: 'flash-outline' },
      { label: 'Calorimetry & Radioactivity', icon: 'calculator' },
    ];
  } else if (isSci2) {
    actionChips = [
      { label: 'Chemical Equations & Balancing', icon: 'flask-outline' },
      { label: 'Periodic Trends & Bonding', icon: 'atom' },
      { label: 'Mole Concept & Stoichiometry', icon: 'calculator' },
      { label: 'Study of Compounds & Reactions', icon: 'test-tube' },
    ];
  } else if (isSci3) {
    actionChips = [
      { label: 'Important Biological Diagrams', icon: 'shape-outline' },
      { label: 'Plant Physiology & Transpiration', icon: 'sprout-outline' },
      { label: 'Human Systems & Anatomy', icon: 'heart-pulse' },
      { label: 'Genetics & Cell Division', icon: 'dna' },
    ];
  } else if (isCommStud || isCommApp) {
    actionChips = [
      { label: 'Commercial Terms & Stakeholders', icon: 'briefcase-outline' },
      { label: 'Accounting Rules & Ledger', icon: 'book-account-outline' },
      { label: 'Marketing & E-Commerce', icon: 'bullhorn-outline' },
      { label: 'Banking & Financial Services', icon: 'bank-outline' },
    ];
  } else if (isCompApp) {
    actionChips = [
      { label: 'Java Syntax & Keywords', icon: 'code-tags' },
      { label: 'OOP Concepts & Definitions', icon: 'sitemap' },
      { label: 'String & Array Methods', icon: 'code-braces' },
      { label: 'ICSE Java Program Solutions', icon: 'laptop' },
    ];
  } else if (isHistory) {
    actionChips = [
      { label: 'Key Dates & Timelines', icon: 'calendar-clock' },
      { label: 'Important Wars & Treaties', icon: 'shield-cross' },
      { label: 'Chapter Summary', icon: 'book-open-page-variant' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isGeography) {
    actionChips = [
      { label: 'Map Work & Locations', icon: 'map-marker-radius' },
      { label: 'Physical Features & Climate', icon: 'terrain' },
      { label: 'Chapter Summary', icon: 'book-open-page-variant' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isCivics || isPolity) {
    actionChips = [
      { label: 'Articles & Constitution', icon: 'file-certificate' },
      { label: 'Rights & Governance', icon: 'scale-balance' },
      { label: 'Key Concepts', icon: 'book-outline' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isEnglish) {
    actionChips = [
      { label: 'Grammar Rules', icon: 'format-text' },
      { label: 'Prose & Poetry Summary', icon: 'book-open-variant' },
      { label: 'Character Sketches', icon: 'account-details' },
      { label: 'Writing Skills & Format', icon: 'pencil-box-outline' },
    ];
  } else if (isHindi) {
    actionChips = [
      { label: 'व्याकरण नियम', icon: 'format-text' },
      { label: 'पाठ का सारांश', icon: 'book-open-variant' },
      { label: 'महत्वपूर्ण प्रश्नोत्तर', icon: 'help-circle-outline' },
      { label: 'लेखन कौशल', icon: 'pencil-box-outline' },
    ];
  } else if (isSanskrit) {
    actionChips = [
      { label: 'धातु रूप (Verb Forms)', icon: 'format-text' },
      { label: 'शब्द रूप (Noun Declensions)', icon: 'book-alphabet' },
      { label: 'अनुवाद (Translation)', icon: 'translate' },
      { label: 'व्याकरण सूत्र', icon: 'pencil-box-outline' },
    ];
  } else if (isMath) {
    actionChips = [
      { label: 'Important Formulas', icon: 'function-variant' },
      { label: 'Theorems & Proofs', icon: 'ruler-square' },
      { label: 'Numerical Problems', icon: 'calculator' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isPhysics) {
    actionChips = [
      { label: 'Important Formulas', icon: 'axis-arrow' },
      { label: 'Derivations & Ray Diagrams', icon: 'sine-wave' },
      { label: 'Numerical Problems', icon: 'calculator' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isChemistry) {
    actionChips = [
      { label: 'Chemical Reactions & Equations', icon: 'flask-outline' },
      { label: 'Periodic Trends & Formulas', icon: 'atom' },
      { label: 'Numerical Problems', icon: 'calculator' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isBiology) {
    actionChips = [
      { label: 'Important Diagrams', icon: 'shape-outline' },
      { label: 'Key Definitions & Terms', icon: 'file-document-outline' },
      { label: 'Biological Cycles & Processes', icon: 'recycle' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isScience) {
    actionChips = [
      { label: 'Important Formulas & Definitions', icon: 'molecule' },
      { label: 'Diagrams & Reactions', icon: 'flask-outline' },
      { label: 'Chapter Summary', icon: 'book-open-page-variant' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isEconomics) {
    actionChips = [
      { label: 'Key Economic Terms', icon: 'finance' },
      { label: 'Graphs & Market Curves', icon: 'chart-line' },
      { label: 'Case Studies', icon: 'briefcase-outline' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isAccountancy) {
    actionChips = [
      { label: 'Journal & Ledger Rules', icon: 'book-account' },
      { label: 'Balance Sheet Formats', icon: 'file-table-outline' },
      { label: 'Practical Problems', icon: 'calculator' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isBusiness) {
    actionChips = [
      { label: 'Principles of Management', icon: 'account-group' },
      { label: 'Case Studies', icon: 'briefcase-search' },
      { label: 'Key Concepts', icon: 'lightbulb-outline' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isCS) {
    actionChips = [
      { label: 'Syntax & Code Examples', icon: 'code-tags' },
      { label: 'Algorithms & Logic', icon: 'sitemap' },
      { label: 'Database & Queries', icon: 'database' },
    ];
  } else if (isSociology) {
    actionChips = [
      { label: 'Key Sociological Terms', icon: 'account-group-outline' },
      { label: 'Thinkers & Theories', icon: 'head-lightbulb-outline' },
      { label: 'Case Studies & Examples', icon: 'briefcase-outline' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isPsychology) {
    actionChips = [
      { label: 'Key Psychological Terms', icon: 'head-cog-outline' },
      { label: 'Thinkers & Experiments', icon: 'brain' },
      { label: 'Case Studies', icon: 'clipboard-text-outline' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  } else if (isPE) {
    actionChips = [
      { label: 'Sports Rules & Specifications', icon: 'run' },
      { label: 'Yoga & Fitness Theory', icon: 'yoga' },
      { label: 'Health & Nutrition Concepts', icon: 'heart-pulse' },
    ];
  } else {
    actionChips = [
      { label: 'Chapter Summary', icon: 'book-open-page-variant' },
      { label: 'Important Questions', icon: 'help-circle-outline' },
      { label: 'Previous Year Questions', icon: 'history' },
    ];
  }

  // ── NCERT / ICSE Topic Chips per Class & Subject ──────────────────────────
  let topicPlaceholder = 'e.g. Select Class & Subject first';
  let subtopicPlaceholder = 'e.g. Select Topic first';
  let topicChips = [];

  // ── CLASS 9 (ICSE & CBSE Specific Topic Chips) ───────────────────────────
  if (cls === 'Class 9') {
    if (isEngPaper1) {
      topicPlaceholder = 'e.g. Tenses, Active Voice, Essay Writing';
      subtopicPlaceholder = 'e.g. Prepositions, Sentence Transformation';
      topicChips = ['Tenses & Verb Forms', 'Active & Passive Voice', 'Direct & Indirect Speech', 'Prepositions & Conjunctions', 'Transformation of Sentences', 'Agreement of Verb with Subject', 'Synthesis of Sentences', 'Formal & Informal Letter Writing', 'Notice & Email Formats', 'Composition & Essay Writing', 'Unseen Passage & Comprehension'];
    } else if (isEngPaper2) {
      topicPlaceholder = 'e.g. Julius Caesar Act 1, Bonku Babu';
      subtopicPlaceholder = 'e.g. Character Sketch, Theme';
      topicChips = ['Drama: Julius Caesar (Act 1 & 2)', 'Drama: The Merchant of Venice (Act 1 & 2)', 'Prose: Bonku Babu\'s Friend (Satyajit Ray)', 'Prose: Oliver Asks for More (Charles Dickens)', 'Prose: The Model Millionaire (Oscar Wilde)', 'Poetry: A Work of Artifice (Marge Piercy)', 'Poetry: Skimbleshanks the Railway Cat', 'Poetry: I Remember, I Remember'];
    } else if (isHCG1) {
      topicPlaceholder = 'e.g. Harappan Civilization, Constitution';
      subtopicPlaceholder = 'e.g. Vedic Period, Local Self Govt';
      topicChips = ['The Harappan Civilization', 'Early Vedic & Later Vedic Age', 'Jainism & Buddhism', 'The Mauryan Empire', 'The Gupta Empire & Golden Age', 'The Delhi Sultanate', 'The Mughal Empire', 'The Renaissance in Europe', 'Civics: Our Constitution & Features', 'Civics: Elections & Election Commission', 'Civics: Local Self-Government (Rural & Urban)'];
    } else if (isHCG2) {
      topicPlaceholder = 'e.g. Latitudes & Longitudes, Rocks, Oceans';
      subtopicPlaceholder = 'e.g. Earth Movements, Weathering';
      topicChips = ['Earth as a Planet', 'Geographic Grid (Latitudes & Longitudes)', 'Rotation and Revolution of Earth', 'Earth\'s Structure & Types of Rocks', 'Volcanoes and Earthquakes', 'Weathering and Denudation', 'Oceans, Tides and Ocean Currents', 'Atmosphere: Composition & Structure', 'Insolation and Heat Belts', 'Humidity and Precipitation', 'Natural Regions of the World'];
    } else if (isSci1) {
      topicPlaceholder = 'e.g. Measurements, Motion, Pressure, Heat';
      subtopicPlaceholder = 'e.g. Laws of Motion, Reflection of Light';
      topicChips = ['Measurements and Experimentation', 'Motion in One Dimension', 'Laws of Motion', 'Fluids & Atmospheric Pressure', 'Upthrust in Fluids & Archimedes Principle', 'Heat & Temperature Basics', 'Reflection of Light in Plane Mirrors', 'Propagation of Sound Waves', 'Simple Electricity and Magnetism'];
    } else if (isSci2) {
      topicPlaceholder = 'e.g. Matter, Gas Laws, Atomic Structure';
      subtopicPlaceholder = 'e.g. Chemical Bonding, Hydrogen';
      topicChips = ['Matter and Its Composition', 'Study of Gas Laws (Boyle & Charles)', 'Elements, Compounds and Mixtures', 'Atomic Structure & Chemical Bonding', 'The Periodic Table (Class 9 Intro)', 'Study of Hydrogen', 'Physical and Chemical Changes', 'Water & Water Pollution'];
    } else if (isSci3) {
      topicPlaceholder = 'e.g. Cell Unit of Life, Plant Tissues, Flower';
      subtopicPlaceholder = 'e.g. Seeds & Germination, Respiration';
      topicChips = ['Introducing Biology', 'Cell: The Unit of Life', 'Tissues (Plant & Animal Tissues)', 'The Flower: Structure & Floral Parts', 'Pollination and Fertilization', 'Seeds: Structure & Germination', 'Respiration in Plants', 'Diversity in Living Organisms', 'Economic Importance of Bacteria & Fungi', 'Human Anatomy: Digestive System', 'Skeleton & Movement', 'Hygiene, Health & Diseases'];
    } else if (isCompApp) {
      topicPlaceholder = 'e.g. Scanner Input, Math Class, Loops';
      subtopicPlaceholder = 'e.g. Data Types, Conditional if-else';
      topicChips = ['Introduction to OOP Concepts', 'Elementary Concept of Objects & Classes', 'Values, Data Types & Variables', 'Operators & Expressions in Java', 'Input in Java (Scanner Class)', 'Mathematical Library Methods (Math Class)', 'Conditional Constructs (if, if-else, switch)', 'Iterative Constructs (for, while, do-while)', 'Nested Loops & Patterns'];
    } else if (isMath) {
      topicPlaceholder = 'e.g. Rational Numbers, Expansions, Triangles';
      subtopicPlaceholder = 'e.g. Compound Interest, Logarithms';
      topicChips = ['Rational and Irrational Numbers', 'Compound Interest (Without Formula & Formula)', 'Expansions and Factorisation', 'Simultaneous Linear Equations', 'Indices & Exponents', 'Logarithms', 'Triangles & Congruency Theorems', 'Pythagoras Theorem', 'Rectilinear Figures (Polygons & Quadrilaterals)', 'Statistics (Frequency & Mean)', 'Mensuration (Area & Perimeter)', 'Trigonometry (Standard Angles)', 'Coordinate Geometry'];
    } else if (isHistory) {
      topicPlaceholder = 'e.g. French Revolution, Nazism';
      subtopicPlaceholder = 'e.g. Bastille, Versailles Treaty';
      topicChips = ['The French Revolution', 'Socialism in Europe & the Russian Revolution', 'Nazism and the Rise of Hitler', 'Forest Society & Colonialism', 'Pastoralists in the Modern World'];
    } else if (isGeography) {
      topicPlaceholder = 'e.g. Physical Features, Climate';
      subtopicPlaceholder = 'e.g. Himalayan Rivers, Monsoon';
      topicChips = ['India: Size & Location', 'Physical Features of India', 'Drainage System', 'Climate', 'Natural Vegetation & Wildlife', 'Population'];
    } else if (isCivics) {
      topicPlaceholder = 'e.g. Constitutional Design, Electoral';
      subtopicPlaceholder = 'e.g. Preamble, Fundamental Rights';
      topicChips = ["What is Democracy? Why Democracy?", 'Constitutional Design', 'Electoral Politics', 'Working of Institutions', 'Democratic Rights'];
    } else if (isEconomics) {
      topicPlaceholder = 'e.g. People as Resource, Poverty';
      subtopicPlaceholder = 'e.g. Human Capital, Food Security';
      topicChips = ['The Story of Village Palampur', 'People as Resource', 'Poverty as a Challenge', 'Food Security in India'];
    } else if (isEnglish) {
      topicPlaceholder = 'e.g. The Fun They Had, Sound of Music';
      subtopicPlaceholder = 'e.g. Reported Speech, Tenses';
      topicChips = ['The Fun They Had', 'The Sound of Music', 'The Little Girl', 'A Truly Beautiful Mind', 'The Snake and the Mirror', 'My Childhood', 'Reach for the Top', 'Grammar: Tenses, Voice & Reported Speech', 'Letter Writing & Diary Entry'];
    } else if (isHindi) {
      topicPlaceholder = 'e.g. दो बैलों की कथा, ल्हासा की ओर';
      subtopicPlaceholder = 'e.g. उपसर्ग, प्रत्यय, समास';
      topicChips = ['दो बैलों की कथा', 'ल्हासा की ओर', 'उपभोक्तावाद की संस्कृति', 'साँवले सपनों की याद', 'मेरे बचपन के दिन', 'व्याकरण: समास, उपसर्ग एवं प्रत्यय', 'लेखन: निबंध एवं पत्र', 'काव्य: साखियाँ एवं सबद'];
    } else if (isPhysics) {
      topicPlaceholder = 'e.g. Motion, Laws of Motion';
      subtopicPlaceholder = "e.g. Equations of Motion, Work";
      topicChips = ['Motion (Distance, Speed, Velocity, Acceleration)', 'Force & Laws of Motion', 'Gravitation & Flotation', 'Work, Energy & Power', 'Sound & Its Properties'];
    } else if (isChemistry) {
      topicPlaceholder = 'e.g. Matter, Atoms & Molecules';
      subtopicPlaceholder = 'e.g. Valency, Atomic Mass';
      topicChips = ['Matter in Our Surroundings', 'Is Matter Around Us Pure?', 'Atoms and Molecules', 'Structure of the Atom'];
    } else if (isBiology) {
      topicPlaceholder = 'e.g. Cell Unit of Life, Tissues';
      subtopicPlaceholder = 'e.g. Cell Organelles, Plant Tissues';
      topicChips = ['The Fundamental Unit of Life (Cell)', 'Tissues', 'Diversity in Living Organisms', 'Why Do We Fall Ill?', 'Improvement in Food Resources'];
    } else if (isScience) {
      topicPlaceholder = 'e.g. Motion, Atoms, Cell Unit';
      subtopicPlaceholder = "e.g. Newton's Laws, Valency";
      topicChips = ['Motion & Force', 'Matter in Surroundings', 'Atoms and Molecules', 'Fundamental Unit of Life (Cell)', 'Tissues', 'Gravitation', 'Work & Energy', 'Sound'];
    } else if (isCS) {
      topicPlaceholder = 'e.g. Python Functions, SQL Basics';
      subtopicPlaceholder = 'e.g. Read/Write Files, SELECT';
      topicChips = ['Python: Functions & Modules', 'Python: Lists, Tuples & Dictionaries', 'Python: File Handling', 'Introduction to SQL', 'SQL: SELECT, WHERE, ORDER BY', 'Cyber Safety & Ethics'];
    }

  // ── CLASS 10 (ICSE & CBSE Specific Topic Chips) ──────────────────────────
  } else if (cls === 'Class 10') {
    if (isEngPaper1) {
      topicPlaceholder = 'e.g. Tenses, Active Voice, Essay Writing';
      subtopicPlaceholder = 'e.g. Prepositions, Transformation of Sentences';
      topicChips = ['Tenses & Verb Forms', 'Active & Passive Voice', 'Direct & Indirect Speech', 'Prepositions & Conjunctions', 'Transformation of Sentences', 'Agreement of Verb with Subject', 'Synthesis of Sentences', 'Formal & Informal Letter Writing', 'Notice & Email Formats', 'Composition & Essay Writing', 'Unseen Passage & Comprehension'];
    } else if (isEngPaper2) {
      topicPlaceholder = 'e.g. Merchant of Venice Act 3, Bonku Babu';
      subtopicPlaceholder = 'e.g. Shylock Character Sketch, Theme';
      topicChips = ['Drama: The Merchant of Venice (Act 3, 4 & 5)', 'Drama: Julius Caesar (Act 3, 4 & 5)', 'Prose: The Home-Coming (Rabindranath Tagore)', 'Prose: The Boy Who Broke the Bank', 'Prose: A Face in the Dark (Ruskin Bond)', 'Poetry: A Doctor\'s Journal Entry', 'Poetry: The Cold Within', 'Poetry: Nine Gold Medals', 'Character Sketches & Extracts'];
    } else if (isHCG1) {
      topicPlaceholder = 'e.g. First War of Independence 1857, Lok Sabha';
      subtopicPlaceholder = 'e.g. Cause of 1857 Revolt, Supreme Court';
      topicChips = ['The First War of Independence (1857)', 'Growth of Nationalism & Early Nationalists', 'Assertive Nationalism & Partition of Bengal', 'Muslim League & Lucknow Pact', 'National Movement & Mahatma Gandhi', 'Quit India Movement & Forward Bloc', 'Independence & Partition of India', 'First World War & Second World War', 'United Nations Organization & Agencies', 'Non-Aligned Movement (NAM)', 'Civics: Union Parliament (Lok Sabha & Rajya Sabha)', 'Civics: President & Vice-President', 'Civics: Prime Minister & Cabinet', 'Civics: Supreme Court & High Courts'];
    } else if (isHCG2) {
      topicPlaceholder = 'e.g. Topo Sheets, Climate of India';
      subtopicPlaceholder = 'e.g. Grid Reference, Soils of India';
      topicChips = ['Interpretation of Topographical Maps (Topo Sheets)', 'Map Work of India (Mountains, Rivers, Minerals)', 'Location, Extent & Physical Features of India', 'Climate of India (Monsoon Mechanism & Seasons)', 'Soils of India (Alluvial, Black, Red, Laterite)', 'Natural Vegetation of India & Conservation', 'Water Resources & Irrigation Systems', 'Mineral & Energy Resources (Iron, Coal, Petroleum)', 'Agriculture in India (Kharif, Rabi, Crops)', 'Manufacturing Industries (Agro & Mineral Based)', 'Transport System in India', 'Waste Management (Impact & Safe Disposal)'];
    } else if (isSci1) {
      topicPlaceholder = 'e.g. Force, Machines, Refraction, Echo';
      subtopicPlaceholder = 'e.g. Work Power Energy, Ohm\'s Law';
      topicChips = ['Force, Turning Effect & Center of Gravity', 'Work, Power and Energy', 'Machines (Pulleys, Levers, Mechanical Advantage)', 'Refraction of Light at Plane Surfaces', 'Refraction through Lenses & Prism', 'Spectrum & Dispersion of Light', 'Sound (Echo, Resonance, Damped Vibrations)', 'Current Electricity (Ohm\'s Law, Resistance)', 'Electrical Power & Household Circuits', 'Electromagnetism (Magnetic Field, Induction)', 'Calorimetry & Specific Heat Capacity', 'Radioactivity & Nuclear Decay'];
    } else if (isSci2) {
      topicPlaceholder = 'e.g. Periodic Table, Mole Concept, Organic Chem';
      subtopicPlaceholder = 'e.g. Chemical Bonding, Study of HCl';
      topicChips = ['Periodic Properties and Variations', 'Chemical Bonding (Electrovalent, Covalent, Coordinate)', 'Acids, Bases and Salts', 'Analytical Chemistry (Action of NH4OH & NaOH)', 'Mole Concept and Stoichiometry', 'Electrolysis (Electroplating, Electro-refining)', 'Metallurgy (Extraction of Aluminium & Ores)', 'Study of Compounds: Hydrogen Chloride (HCl)', 'Study of Compounds: Ammonia (NH3)', 'Study of Compounds: Nitric Acid (HNO3)', 'Study of Compounds: Sulphuric Acid (H2SO4)', 'Organic Chemistry (Alkanes, Alkenes, Alkynes, Alcohols)'];
    } else if (isSci3) {
      topicPlaceholder = 'e.g. Cell Division, Circulatory System';
      subtopicPlaceholder = 'e.g. Transpiration, Photosynthesis';
      topicChips = ['Cell Cycle, Cell Division & Chromosomes', 'Genetics (Mendel\'s Laws of Inheritance)', 'Absorption by Roots & Osmosis', 'Transpiration & Factors Affecting Transpiration', 'Photosynthesis & Carbon Fixation', 'Chemical Coordination in Plants (Plant Hormones)', 'Circulatory System & Heart Structure', 'Excretory System & Kidney Anatomy', 'Nervous System & Brain Structure', 'Sense Organs (Eye & Ear Anatomy)', 'Endocrine System & Hormones', 'Reproductive System', 'Population Explosion & Pollution Control'];
    } else if (isCompApp) {
      topicPlaceholder = 'e.g. User Defined Methods, String Methods, Pattern Loops';
      subtopicPlaceholder = 'e.g. 1D & 2D Arrays, Wrapper Classes';
      topicChips = ['Revision of Class 9 Java Basics', 'Library & Wrapper Classes (Math & Character)', 'Class as the Basis of Computation', 'User-Defined Methods & Parameter Passing', 'Constructors (Default, Parameterized, Overloading)', 'Encapsulation, Abstraction & Scope of Variables', 'Single Dimensional Arrays (Searching & Sorting)', 'Double Dimensional Arrays (2D Matrix Operations)', 'String Handling & String Functions'];
    } else if (isCommStud || isCommApp) {
      topicPlaceholder = 'e.g. Stakeholders, E-Commerce, Final Accounts';
      subtopicPlaceholder = 'e.g. Marketing Mix, Banking Services';
      topicChips = ['Commercial Organisations & Stakeholders', 'Marketing & Sales Functions', 'Advertising & Brand Promotion', 'Consumer Protection & Consumer Rights', 'E-Commerce & Digital Business', 'Capital & Revenue Expenditure', 'Final Accounts of Commercial Organisations', 'Banking Functions & E-Banking Services', 'Fundamental Accounting Concepts', 'Human Resource Management & Recruitment', 'Logistics & Supply Chain Management'];
    } else if (isHistory) {
      topicPlaceholder = 'e.g. Nationalism in India, Europe';
      subtopicPlaceholder = 'e.g. Salt March, Unification';
      topicChips = ['The Rise of Nationalism in Europe', 'Nationalism in India', 'The Making of a Global World', 'The Age of Industrialisation', 'Print Culture & the Modern World'];
    } else if (isGeography) {
      topicPlaceholder = 'e.g. Resources, Agriculture';
      subtopicPlaceholder = 'e.g. Soil Erosion, Hydro Power';
      topicChips = ['Resources and Development', 'Forest & Wildlife Resources', 'Water Resources', 'Agriculture', 'Minerals & Energy Resources', 'Manufacturing Industries', 'Lifelines of National Economy'];
    } else if (isCivics) {
      topicPlaceholder = 'e.g. Power Sharing, Federalism';
      subtopicPlaceholder = 'e.g. Union & State Lists, Belgian Model';
      topicChips = ['Power Sharing', 'Federalism', 'Democracy & Diversity', 'Gender, Religion & Caste', 'Popular Struggles & Movements', 'Political Parties', 'Outcomes of Democracy', 'Challenges to Democracy'];
    } else if (isEconomics) {
      topicPlaceholder = 'e.g. Sectors of Economy, Money';
      subtopicPlaceholder = 'e.g. Primary Sector, Formal Credit';
      topicChips = ['Development', 'Sectors of the Indian Economy', 'Money and Credit', 'Globalisation & the Indian Economy', 'Consumer Rights'];
    } else if (isEnglish) {
      topicPlaceholder = 'e.g. Letter to God, Nelson Mandela';
      subtopicPlaceholder = 'e.g. Reported Speech, Letter Writing';
      topicChips = ['A Letter to God', 'Nelson Mandela: Long Walk to Freedom', 'Two Stories About Flying', 'From the Diary of Anne Frank', 'Glimpses of India', 'Madam Rides the Bus', 'The Hack Driver', 'Grammar: Clauses, Conditionals & Reported Speech', 'Letter Writing & Formal Formats'];
    } else if (isHindi) {
      topicPlaceholder = 'e.g. सूरदास, तुलसीदास, नेताजी का चश्मा';
      subtopicPlaceholder = 'e.g. पद व्याख्या, रस, अलंकार';
      topicChips = ['सूरदास के पद', 'राम-लक्ष्मण-परशुराम संवाद (तुलसीदास)', 'बालगोबिन भगत', 'नेताजी का चश्मा', 'माता का आँचल', 'व्याकरण: रस, छन्द एवं अलंकार', 'लेखन: निबंध एवं अनुच्छेद', 'पत्र लेखन (औपचारिक / अनौपचारिक)'];
    } else if (isMath) {
      topicPlaceholder = 'e.g. Quadratic Equations, Trigonometry';
      subtopicPlaceholder = 'e.g. Quadratic Formula, BPT';
      topicChips = ['Commercial Mathematics (GST, Banking & RD)', 'Quadratic Equations', 'Matrices & Determinants Basics', 'Arithmetic Progressions', 'Triangles & Similarity', 'Coordinate Geometry (Reflection & Section)', 'Introduction to Trigonometry & Identities', 'Heights and Distances', 'Circles & Tangents', 'Areas Related to Circles', 'Surface Areas & Volumes', 'Statistics & Ogive', 'Probability'];
    } else if (isPhysics) {
      topicPlaceholder = 'e.g. Electricity, Light Reflection';
      subtopicPlaceholder = "e.g. Ohm's Law, Lens Formula";
      topicChips = ['Light: Reflection & Refraction', 'Human Eye & the Colourful World', 'Electricity', 'Magnetic Effects of Electric Current', 'Sources of Energy'];
    } else if (isChemistry) {
      topicPlaceholder = 'e.g. Chemical Reactions, Carbon';
      subtopicPlaceholder = 'e.g. Esterification, Metals';
      topicChips = ['Chemical Reactions & Equations', 'Acids, Bases and Salts', 'Metals and Non-Metals', 'Carbon and Its Compounds'];
    } else if (isBiology) {
      topicPlaceholder = 'e.g. Life Processes, Reproduction';
      subtopicPlaceholder = "e.g. Photosynthesis, Mendel's Laws";
      topicChips = ['Life Processes (Nutrition, Respiration, Transportation)', 'Control & Coordination', 'How Do Organisms Reproduce?', 'Heredity & Evolution', 'Our Environment', 'Management of Natural Resources'];
    } else if (isScience) {
      topicPlaceholder = 'e.g. Chemical Reactions, Electricity';
      subtopicPlaceholder = "e.g. Ohm's Law, Life Processes";
      topicChips = ['Chemical Reactions & Equations', 'Life Processes', 'Light: Reflection & Refraction', 'Electricity', 'Carbon & Its Compounds', 'Heredity & Evolution'];
    } else if (isCS) {
      topicPlaceholder = 'e.g. Python OOP, SQL Databases';
      subtopicPlaceholder = 'e.g. Classes & Objects, Joins';
      topicChips = ['Python: Object-Oriented Programming (OOP)', 'Python: Inheritance & Polymorphism', 'Python: File Handling & Exception', 'Database Concepts & SQL', 'SQL: Joins & Aggregate Functions', 'Computer Networks & Internet'];
    }

  // ── CLASS 11 (ISC & CBSE Specific Topic Chips) ───────────────────────────
  } else if (cls === 'Class 11') {
    if (isPhysics) {
      topicPlaceholder = 'e.g. Kinematics, Rotational Motion';
      subtopicPlaceholder = 'e.g. Laws of Motion, Work Power Energy';
      topicChips = ['Units & Measurements', 'Kinematics (Motion in Straight Line & Plane)', 'Laws of Motion & Friction', 'Work, Energy & Power', 'System of Particles & Rotational Motion', 'Gravitation & Orbital Motion', 'Mechanical Properties of Solids & Fluids', 'Thermal Properties of Matter & Thermodynamics', 'Kinetic Theory of Gases', 'Oscillations (Simple Harmonic Motion) & Waves'];
    } else if (isChemistry) {
      topicPlaceholder = 'e.g. Structure of Atom, Thermodynamics';
      subtopicPlaceholder = 'e.g. Chemical Bonding, Hydrocarbons';
      topicChips = ['Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements & Periodicity', 'Chemical Bonding & Molecular Structure', 'Chemical Thermodynamics', 'Equilibrium (Chemical & Ionic)', 'Redox Reactions', 'Organic Chemistry: Basic Principles & Techniques', 'Hydrocarbons (Alkanes, Alkenes, Alkynes, Aromatic)'];
    } else if (isBiology) {
      topicPlaceholder = 'e.g. Plant Kingdom, Cell Cycle';
      subtopicPlaceholder = 'e.g. Biomolecules, Photosynthesis';
      topicChips = ['Diversity of Living Organisms & Biological Classification', 'Plant Kingdom & Animal Kingdom', 'Morphology & Anatomy of Flowering Plants', 'Structural Organisation in Animals', 'Cell: Structure & Function', 'Biomolecules & Cell Cycle', 'Plant Physiology (Photosynthesis, Respiration)', 'Human Physiology (Digestion, Circulation, Excretion, Locomotion)'];
    } else if (isMath) {
      topicPlaceholder = 'e.g. Sets, Trigonometric Functions';
      subtopicPlaceholder = 'e.g. Complex Numbers, Permutations';
      topicChips = ['Sets and Functions', 'Trigonometric Functions', 'Complex Numbers & Quadratic Equations', 'Linear Inequations', 'Permutations & Combinations', 'Binomial Theorem', 'Sequences and Series (AP & GP)', 'Straight Lines & Conic Sections', 'Limits & Derivatives', 'Statistics & Probability'];
    } else if (isCS || isCompApp) {
      topicPlaceholder = 'e.g. Boolean Algebra, Java OOP, Arrays';
      subtopicPlaceholder = 'e.g. Logic Gates, Functions & Recursion';
      topicChips = ['Numbers & Boolean Algebra', 'Logic Gates & Truth Tables', 'Basic Java Concepts & OOP Principles', 'Control Statements & Functions', 'Recursion Basics', 'Single Dimensional & 2D Arrays', 'Data Structure Concepts'];
    } else if (isEngPaper2) {
      topicPlaceholder = 'e.g. The Tempest Act 1 & 2, Prism Stories';
      subtopicPlaceholder = 'e.g. Prospero Character Sketch, Rhapsody';
      topicChips = ['Drama: The Tempest (Act 1 & 2)', 'Drama: Macbeth (Act 1 & 2)', 'Prose: Prism Short Stories Collection', 'Poetry: Rhapsody Poems Collection'];
    }

  // ── CLASS 12 (ISC & CBSE Specific Topic Chips) ───────────────────────────
  } else if (cls === 'Class 12') {
    if (isPhysics) {
      topicPlaceholder = 'e.g. Electrostatics, Ray Optics, AC';
      subtopicPlaceholder = 'e.g. Kirchhoff\'s Laws, Wave Optics';
      topicChips = ['Electrostatics (Electric Charges, Fields, Potential & Capacitance)', 'Current Electricity & Kirchhoff\'s Laws', 'Magnetic Effects of Current & Magnetism', 'Electromagnetic Induction & Alternating Current (AC)', 'Electromagnetic Waves', 'Ray Optics & Optical Instruments', 'Wave Optics (Interference & Diffraction)', 'Dual Nature of Radiation & Matter', 'Atoms & Atomic Nuclei', 'Semiconductor Electronics & Logic Gates'];
    } else if (isChemistry) {
      topicPlaceholder = 'e.g. Electrochemistry, Organic Reactions';
      subtopicPlaceholder = 'e.g. Nernst Equation, Aldehydes & Ketones';
      topicChips = ['Solutions & Colligative Properties', 'Electrochemistry & Nernst Equation', 'Chemical Kinetics & Rate Laws', 'd-and f-Block Elements', 'Coordination Compounds', 'Haloalkanes & Haloarenes', 'Alcohols, Phenols & Ethers', 'Aldehydes, Ketones & Carboxylic Acids', 'Organic Compounds Containing Nitrogen (Amines)', 'Biomolecules & Polymers'];
    } else if (isBiology) {
      topicPlaceholder = 'e.g. Genetics, Biotechnology, DNA';
      subtopicPlaceholder = 'e.g. Mendel\'s Laws, Human Reproduction';
      topicChips = ['Reproduction in Organisms & Flowering Plants', 'Human Reproduction & Reproductive Health', 'Principles of Inheritance & Variation (Genetics)', 'Molecular Basis of Inheritance (DNA & RNA)', 'Evolution', 'Human Health & Diseases', 'Microbes in Human Welfare', 'Biotechnology: Principles & Processes', 'Biotechnology & Its Applications', 'Ecology, Biodiversity & Environment'];
    } else if (isMath) {
      topicPlaceholder = 'e.g. Integrals, Matrices, 3D Geometry';
      subtopicPlaceholder = 'e.g. Chain Rule, Differential Equations';
      topicChips = ['Relations and Functions & Inverse Trig', 'Matrices & Determinants', 'Continuity, Differentiability & Derivatives', 'Application of Derivatives (Maxima & Minima)', 'Integrals (Indefinite & Definite)', 'Application of Integrals (Area under Curves)', 'Differential Equations', 'Vector Algebra & 3D Geometry', 'Linear Programming', 'Probability & Bayes\' Theorem'];
    } else if (isCS || isCompApp) {
      topicPlaceholder = 'e.g. Karnaugh Maps (K-Maps), Data Structures';
      subtopicPlaceholder = 'e.g. Recursion, Stacks & Queues, Inheritance';
      topicChips = ['Boolean Algebra & Karnaugh Maps (K-Maps)', 'Computer Hardware & Logic Circuits', 'Java Programming OOP Review', 'Object-Oriented Design & Inheritance', 'Recursion & Recursive Functions', 'Data Structures: Stacks & Queues', 'Linked Lists & Binary Trees', 'Computational Complexity & Algorithms'];
    } else if (isEngPaper2) {
      topicPlaceholder = 'e.g. The Tempest Act 3, 4 & 5, Prism';
      subtopicPlaceholder = 'e.g. Caliban Character Sketch, Rhapsody';
      topicChips = ['Drama: The Tempest (Act 3, 4 & 5)', 'Drama: Macbeth (Act 3, 4 & 5)', 'Prose: Prism Short Stories (Class 12 Selection)', 'Poetry: Rhapsody Poems (Class 12 Selection)'];
    }
  } else if (cls === 'Class 6') {
    if (isHistory) {
      topicPlaceholder = 'e.g. Earliest Cities, New Empires';
      subtopicPlaceholder = 'e.g. Harappan Seals, Vedic Era';
      topicChips = ['In the Earliest Cities', 'What Books & Burials Tell Us', 'Kingdoms, Kings & Early Republic', 'New Empires & Kingdoms', 'Buildings, Paintings & Books'];
    } else if (isGeography) {
      topicPlaceholder = 'e.g. Globe, Major Landforms';
      subtopicPlaceholder = 'e.g. Prime Meridian, Himalayas';
      topicChips = ['The Earth in the Solar System', 'Globe: Latitudes & Longitudes', 'Motions of the Earth', 'Maps', 'Major Domains of the Earth', 'Major Landforms of the Earth', 'Our Country – India'];
    } else if (isCivics) {
      topicPlaceholder = 'e.g. Diversity, Panchayati Raj';
      subtopicPlaceholder = 'e.g. Gram Sabha, Democracy';
      topicChips = ['Understanding Diversity', 'Diversity & Discrimination', 'What is Government?', 'Key Elements of Democratic Govt', 'Panchayati Raj', 'Rural Administration', 'Urban Administration'];
    } else if (isEnglish) {
      topicPlaceholder = "e.g. Patrick's Homework, Taro's Reward";
      subtopicPlaceholder = 'e.g. Nouns, Tenses, Letter Writing';
      topicChips = ["Who Did Patrick's Homework?", 'A Different Kind of School', "Taro's Reward", 'An Indian-American Woman in Space', 'A Game of Chance', 'Fair Play', 'The Wonderful Words', 'Grammar: Nouns, Pronouns & Tenses'];
    } else if (isHindi) {
      topicPlaceholder = 'e.g. वह चिड़िया जो, बचपन';
      subtopicPlaceholder = 'e.g. संज्ञा, सर्वनाम, भावार्थ';
      topicChips = ['वह चिड़िया जो', 'बचपन', 'नादान दोस्त', 'चाँद से थोड़ी सी गप्पें', 'अक्षरों का महत्व', 'व्याकरण: संज्ञा एवं सर्वनाम', 'व्याकरण: विशेषण एवं क्रिया'];
    } else if (isSanskrit) {
      topicPlaceholder = 'e.g. सुभाषितानि, शब्द रूप';
      subtopicPlaceholder = 'e.g. पुल्लिंग, लट् लकार, सन्धि';
      topicChips = ['शब्द रूप (रामः, बालकः)', 'धातु रूप (गम्, पठ्)', 'अनुवाद – हिन्दी से संस्कृत', 'सुभाषितानि', 'व्याकरण: सन्धि एवं समास'];
    } else if (isMath) {
      topicPlaceholder = 'e.g. Knowing Numbers, Integers';
      subtopicPlaceholder = 'e.g. LCM, HCF, Fractions';
      topicChips = ['Knowing Our Numbers', 'Whole Numbers', 'Playing with Numbers (HCF & LCM)', 'Basic Geometrical Ideas', 'Understanding Elementary Shapes', 'Integers', 'Fractions', 'Decimals', 'Data Handling', 'Mensuration', 'Algebra: Introduction to Variables', 'Ratio and Proportion'];
    } else if (isScience) {
      topicPlaceholder = 'e.g. Components of Food, Electricity';
      subtopicPlaceholder = 'e.g. Balanced Diet, Circuits';
      topicChips = ['Components of Food', 'Sorting Materials into Groups', 'Separation of Substances', 'Getting to Know Plants', 'Body Movements', 'The Living Organisms & Surroundings', 'Light, Shadows & Reflections', 'Electricity & Circuits', 'Fun with Magnets', 'Water & Air Around Us'];
    } else if (isCS) {
      topicPlaceholder = 'e.g. Intro to Computers, MS Word';
      subtopicPlaceholder = 'e.g. Input Devices, Paint Basics';
      topicChips = ['Introduction to Computers', 'Parts of a Computer', 'Input & Output Devices', 'Introduction to MS Word', 'Introduction to MS Paint', 'Internet Basics'];
    }

  // ── CLASS 7 ──────────────────────────────────────────────────────────────
  } else if (cls === 'Class 7') {
    if (isHistory) {
      topicPlaceholder = 'e.g. Mughal Empire, Delhi Sultans';
      subtopicPlaceholder = "e.g. Akbar's Reign, Chola Temples";
      topicChips = ['Tracing Changes Through a Thousand Years', 'New Kings & Kingdoms', 'The Delhi Sultans', 'The Mughal Empire', 'Rulers & Buildings', 'Towns, Traders & Craftspersons', 'Tribes, Nomads & Settled Communities', 'Devotional Paths to the Divine'];
    } else if (isGeography) {
      topicPlaceholder = 'e.g. Inside Our Earth, Air & Water';
      subtopicPlaceholder = 'e.g. Rock Cycle, Ocean Currents';
      topicChips = ['Environment', 'Inside Our Earth', 'Our Changing Earth', 'Air', 'Water', 'Natural Vegetation & Wildlife', 'Human Environment – Settlement & Transport', 'Human Environment Interactions'];
    } else if (isCivics) {
      topicPlaceholder = 'e.g. On Equality, State Govt';
      subtopicPlaceholder = 'e.g. MLA Roles, Public Health';
      topicChips = ['On Equality', 'Role of Govt in Health', 'How the State Government Works', 'Growing Up as Boys & Girls', 'Women Change the World', 'Understanding Media', 'Markets Around Us'];
    } else if (isEnglish) {
      topicPlaceholder = 'e.g. Three Questions, Chappals';
      subtopicPlaceholder = 'e.g. Reported Speech, Letter Format';
      topicChips = ['Three Questions', 'A Gift of Chappals', 'Gopal and the Hilsa Fish', 'The Ashes That Made Trees Bloom', 'Quality', 'Expert Detectives', 'The Invention of Vita-Wonk', 'Grammar: Tenses, Voice & Reported Speech'];
    } else if (isHindi) {
      topicPlaceholder = 'e.g. हम पंछी उन्मुक्त गगन के';
      subtopicPlaceholder = 'e.g. भावार्थ, विशेषण, संधि';
      topicChips = ['हम पंछी उन्मुक्त गगन के', 'दादी माँ', 'हिमालय की बेटियाँ', 'कठपुतली', 'मिठाईवाला', 'रक्त और हमारा शरीर', 'व्याकरण: विशेषण एवं क्रिया', 'व्याकरण: संधि एवं समास'];
    } else if (isSanskrit) {
      topicPlaceholder = 'e.g. सुभाषितानि, शब्द रूप';
      subtopicPlaceholder = 'e.g. लट् लकार, संधि विच्छेद';
      topicChips = ['शब्द रूप (फल, लता)', 'धातु रूप (भू, हस्)', 'सुभाषितानि', 'त्रिपदा गायत्री', 'संधि विच्छेद', 'हिन्दी से संस्कृत अनुवाद'];
    } else if (isMath) {
      topicPlaceholder = 'e.g. Integers, Triangles';
      subtopicPlaceholder = 'e.g. Simple Interest, Area';
      topicChips = ['Integers', 'Fractions and Decimals', 'Data Handling', 'Simple Equations', 'Lines and Angles', 'The Triangle and Its Properties', 'Congruence of Triangles', 'Comparing Quantities (Profit/Loss, SI)', 'Rational Numbers', 'Perimeter and Area', 'Algebraic Expressions', 'Exponents and Powers'];
    } else if (isScience) {
      topicPlaceholder = 'e.g. Nutrition in Plants, Acids & Bases';
      subtopicPlaceholder = 'e.g. Photosynthesis, Heat';
      topicChips = ['Nutrition in Plants', 'Nutrition in Animals', 'Heat & Temperature', 'Acids, Bases and Salts', 'Physical & Chemical Changes', 'Respiration in Organisms', 'Transportation in Animals & Plants', 'Reproduction in Plants', 'Motion and Time', 'Electric Current & Its Effects', 'Light'];
    } else if (isCS) {
      topicPlaceholder = 'e.g. Scratch Logo, Excel Basics';
      subtopicPlaceholder = 'e.g. Formulas, Flowcharts';
      topicChips = ['Introduction to Scratch / Logo', 'MS Excel Basics', 'Spreadsheet: Formulas & Charts', 'Algorithm & Flowchart', 'Internet Safety & Cyber Ethics'];
    }

  // ── CLASS 8 ──────────────────────────────────────────────────────────────
  } else if (cls === 'Class 8') {
    if (isHistory) {
      topicPlaceholder = 'e.g. When People Rebel (1857)';
      subtopicPlaceholder = 'e.g. Revolt of 1857, East India Co.';
      topicChips = ['How, When and Where', 'From Trade to Territory', 'Ruling the Countryside', 'Tribals, Dikus & the Vision of a Golden Age', 'When People Rebel: 1857', 'Weavers, Iron Smelters & Factory Owners', "Civilising the 'Native', Educating the Nation", 'Women, Caste & Reform', 'The Making of the National Movement'];
    } else if (isGeography) {
      topicPlaceholder = 'e.g. Resources, Agriculture';
      subtopicPlaceholder = 'e.g. Soil Conservation, Farming';
      topicChips = ['Resources', 'Land, Soil, Water & Natural Vegetation Resources', 'Mineral & Power Resources', 'Agriculture', 'Industries', 'Human Resources'];
    } else if (isCivics) {
      topicPlaceholder = 'e.g. Indian Constitution, Parliament';
      subtopicPlaceholder = 'e.g. Fundamental Rights, Judiciary';
      topicChips = ['The Indian Constitution', 'Understanding Secularism', 'Why Do We Need a Parliament?', 'Understanding Laws', 'Judiciary', 'Understanding Our Criminal Justice System', 'Understanding Marginalisation', 'Confronting Marginalisation', 'Public Facilities', 'Law and Social Justice'];
    } else if (isEnglish) {
      topicPlaceholder = 'e.g. Best Christmas Present, Tsunami';
      subtopicPlaceholder = 'e.g. Notice Writing, Modals';
      topicChips = ['The Best Christmas Present in the World', 'The Tsunami', 'Glimpses of the Past', 'Bepin Choudhury\'s Lapse of Memory', 'The Summit Within', 'This is Jody\'s Fawn', 'Grammar: Modals, Clauses & Voice', 'Letter Writing & Notice Format'];
    } else if (isHindi) {
      topicPlaceholder = 'e.g. ध्वनि, लाख की चूड़ियाँ';
      subtopicPlaceholder = 'e.g. समास, संधि, पत्र लेखन';
      topicChips = ['ध्वनि (कविता)', 'लाख की चूड़ियाँ', 'बस की यात्रा', 'दीवानों की हस्ती', 'चिट्ठियों की अनूठी दुनिया', 'अकबरी लोटा', 'व्याकरण: समास एवं संधि', 'लेखन: पत्र एवं निबंध'];
    } else if (isSanskrit) {
      topicPlaceholder = 'e.g. सुभाषितानि, बिलस्य वाणी';
      subtopicPlaceholder = 'e.g. अव्यय, उपसर्ग, संधि';
      topicChips = ['सुभाषितानि', 'बिलस्य वाणी न कदापि मे श्रुता', 'शब्द रूप (नदी, मति)', 'धातु रूप (दृश्, वद्)', 'व्याकरण: उपसर्ग एवं अव्यय', 'अनुवाद अभ्यास'];
    } else if (isMath) {
      topicPlaceholder = 'e.g. Rational Numbers, Equations';
      subtopicPlaceholder = 'e.g. Compound Interest, Volume';
      topicChips = ['Rational Numbers', 'Linear Equations in One Variable', 'Understanding Quadrilaterals', 'Data Handling', 'Squares & Square Roots', 'Cubes & Cube Roots', 'Comparing Quantities (CI, Tax, Discount)', 'Algebraic Expressions & Identities', 'Mensuration (Area & Volume)', 'Exponents & Powers', 'Direct & Inverse Proportions', 'Factorisation'];
    } else if (isScience) {
      topicPlaceholder = 'e.g. Crop Production, Cell Structure';
      subtopicPlaceholder = 'e.g. Friction, Plant Cell';
      topicChips = ['Crop Production & Management', 'Microorganisms: Friend & Foe', 'Synthetic Fibres & Plastics', 'Metals & Non-Metals', 'Coal and Petroleum', 'Combustion & Flame', 'Conservation of Plants & Animals', 'Cell: Structure & Functions', 'Reproduction in Animals', 'Force & Pressure', 'Friction', 'Sound', 'Chemical Effects of Electric Current', 'Stars & the Solar System'];
    } else if (isCS) {
      topicPlaceholder = 'e.g. Python Intro, HTML Basics';
      subtopicPlaceholder = 'e.g. Data Types, HTML Tags';
      topicChips = ['Introduction to Programming (Python)', 'Variables & Data Types', 'Input/Output in Python', 'Conditionals (if-else)', 'Loops (for & while)', 'Introduction to HTML', 'HTML Tags & Basic Webpage'];
    }

  // ── CLASS 9 ──────────────────────────────────────────────────────────────
  } else if (cls === 'Class 9') {
    if (isHistory) {
      topicPlaceholder = 'e.g. French Revolution, Nazism';
      subtopicPlaceholder = 'e.g. Bastille, Versailles Treaty';
      topicChips = ['The French Revolution', 'Socialism in Europe & the Russian Revolution', 'Nazism and the Rise of Hitler', 'Forest Society & Colonialism', 'Pastoralists in the Modern World'];
    } else if (isGeography) {
      topicPlaceholder = 'e.g. Physical Features, Climate';
      subtopicPlaceholder = 'e.g. Himalayan Rivers, Monsoon';
      topicChips = ['India: Size & Location', 'Physical Features of India', 'Drainage System', 'Climate', 'Natural Vegetation & Wildlife', 'Population'];
    } else if (isCivics) {
      topicPlaceholder = 'e.g. Constitutional Design, Electoral';
      subtopicPlaceholder = 'e.g. Preamble, Fundamental Rights';
      topicChips = ["What is Democracy? Why Democracy?", 'Constitutional Design', 'Electoral Politics', 'Working of Institutions', 'Democratic Rights'];
    } else if (isEconomics) {
      topicPlaceholder = 'e.g. People as Resource, Poverty';
      subtopicPlaceholder = 'e.g. Human Capital, Food Security';
      topicChips = ['The Story of Village Palampur', 'People as Resource', 'Poverty as a Challenge', 'Food Security in India'];
    } else if (isEnglish) {
      topicPlaceholder = 'e.g. The Fun They Had, Sound of Music';
      subtopicPlaceholder = 'e.g. Reported Speech, Tenses';
      topicChips = ['The Fun They Had', 'The Sound of Music', 'The Little Girl', 'A Truly Beautiful Mind', 'The Snake and the Mirror', 'My Childhood', 'Reach for the Top', 'Grammar: Tenses, Voice & Reported Speech', 'Letter Writing & Diary Entry'];
    } else if (isHindi) {
      topicPlaceholder = 'e.g. दो बैलों की कथा, ल्हासा की ओर';
      subtopicPlaceholder = 'e.g. उपसर्ग, प्रत्यय, समास';
      topicChips = ['दो बैलों की कथा', 'ल्हासा की ओर', 'उपभोक्तावाद की संस्कृति', 'साँवले सपनों की याद', 'मेरे बचपन के दिन', 'व्याकरण: समास, उपसर्ग एवं प्रत्यय', 'लेखन: निबंध एवं पत्र', 'काव्य: साखियाँ एवं सबद'];
    } else if (isSanskrit) {
      topicPlaceholder = 'e.g. भारतीवसन्तगीतिः, शुचिपर्यावरणम्';
      subtopicPlaceholder = 'e.g. सन्धि, समास, कारक';
      topicChips = ['भारतीवसन्तगीतिः', 'शुचिपर्यावरणम्', 'व्याकरण: सन्धि', 'व्याकरण: समास', 'कारक एवं विभक्तियाँ', 'अनुवाद: हिन्दी से संस्कृत', 'व्याकरण: प्रत्यय एवं उपसर्ग'];
    } else if (isMath) {
      topicPlaceholder = 'e.g. Polynomials, Triangles';
      subtopicPlaceholder = "e.g. Heron's Formula, Lines";
      topicChips = ['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations in Two Variables', "Introduction to Euclid's Geometry", 'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Circles', "Heron's Formula", 'Surface Areas & Volumes', 'Statistics', 'Probability'];
    } else if (isPhysics) {
      topicPlaceholder = 'e.g. Motion, Laws of Motion';
      subtopicPlaceholder = "e.g. Equations of Motion, Work";
      topicChips = ['Motion (Distance, Speed, Velocity, Acceleration)', 'Force & Laws of Motion', 'Gravitation & Flotation', 'Work, Energy & Power', 'Sound & Its Properties'];
    } else if (isChemistry) {
      topicPlaceholder = 'e.g. Matter, Atoms & Molecules';
      subtopicPlaceholder = 'e.g. Valency, Atomic Mass';
      topicChips = ['Matter in Our Surroundings', 'Is Matter Around Us Pure?', 'Atoms and Molecules', 'Structure of the Atom'];
    } else if (isBiology) {
      topicPlaceholder = 'e.g. Cell Unit of Life, Tissues';
      subtopicPlaceholder = 'e.g. Cell Organelles, Plant Tissues';
      topicChips = ['The Fundamental Unit of Life (Cell)', 'Tissues', 'Diversity in Living Organisms', 'Why Do We Fall Ill?', 'Improvement in Food Resources'];
    } else if (isScience) {
      topicPlaceholder = 'e.g. Motion, Atoms, Cell Unit';
      subtopicPlaceholder = "e.g. Newton's Laws, Valency";
      topicChips = ['Motion & Force', 'Matter in Surroundings', 'Atoms and Molecules', 'Fundamental Unit of Life (Cell)', 'Tissues', 'Gravitation', 'Work & Energy', 'Sound'];
    } else if (isCS) {
      topicPlaceholder = 'e.g. Python Functions, SQL Basics';
      subtopicPlaceholder = 'e.g. Read/Write Files, SELECT';
      topicChips = ['Python: Functions & Modules', 'Python: Lists, Tuples & Dictionaries', 'Python: File Handling', 'Introduction to SQL', 'SQL: SELECT, WHERE, ORDER BY', 'Cyber Safety & Ethics'];
    }
  // ── CLASS 10 ─────────────────────────────────────────────────────────────
  } else if (cls === 'Class 10') {
    if (isHistory) {
      topicPlaceholder = 'e.g. Nationalism in India, Europe';
      subtopicPlaceholder = 'e.g. Salt March, Unification';
      topicChips = ['The Rise of Nationalism in Europe', 'Nationalism in India', 'The Making of a Global World', 'The Age of Industrialisation', 'Print Culture & the Modern World'];
    } else if (isGeography) {
      topicPlaceholder = 'e.g. Resources, Agriculture';
      subtopicPlaceholder = 'e.g. Soil Erosion, Hydro Power';
      topicChips = ['Resources and Development', 'Forest & Wildlife Resources', 'Water Resources', 'Agriculture', 'Minerals & Energy Resources', 'Manufacturing Industries', 'Lifelines of National Economy'];
    } else if (isCivics) {
      topicPlaceholder = 'e.g. Power Sharing, Federalism';
      subtopicPlaceholder = 'e.g. Union & State Lists, Belgian Model';
      topicChips = ['Power Sharing', 'Federalism', 'Democracy & Diversity', 'Gender, Religion & Caste', 'Popular Struggles & Movements', 'Political Parties', 'Outcomes of Democracy', 'Challenges to Democracy'];
    } else if (isEconomics) {
      topicPlaceholder = 'e.g. Sectors of Economy, Money';
      subtopicPlaceholder = 'e.g. Primary Sector, Formal Credit';
      topicChips = ['Development', 'Sectors of the Indian Economy', 'Money and Credit', 'Globalisation & the Indian Economy', 'Consumer Rights'];
    } else if (isEnglish) {
      topicPlaceholder = 'e.g. Letter to God, Nelson Mandela';
      subtopicPlaceholder = 'e.g. Reported Speech, Letter Writing';
      topicChips = ['A Letter to God', 'Nelson Mandela: Long Walk to Freedom', 'Two Stories About Flying', 'From the Diary of Anne Frank', 'Glimpses of India', 'Madam Rides the Bus', 'The Hack Driver', 'Grammar: Clauses, Conditionals & Reported Speech', 'Letter Writing & Formal Formats'];
    } else if (isHindi) {
      topicPlaceholder = 'e.g. सूरदास, तुलसीदास, नेताजी का चश्मा';
      subtopicPlaceholder = 'e.g. पद व्याख्या, रस, अलंकार';
      topicChips = ['सूरदास के पद', 'राम-लक्ष्मण-परशुराम संवाद (तुलसीदास)', 'बालगोबिन भगत', 'नेताजी का चश्मा', 'माता का आँचल', 'व्याकरण: रस, छन्द एवं अलंकार', 'लेखन: निबंध एवं अनुच्छेद', 'पत्र लेखन (औपचारिक / अनौपचारिक)'];
    } else if (isSanskrit) {
      topicPlaceholder = 'e.g. शुचिपर्यावरणम्, सन्धि';
      subtopicPlaceholder = 'e.g. वाच्य परिवर्तन, समास';
      topicChips = ['शुचिपर्यावरणम्', 'बुद्धिर्बलवती सदा', 'व्याकरण: वाच्य परिवर्तन', 'व्याकरण: सन्धि (स्वर, व्यंजन, विसर्ग)', 'समास (द्वन्द्व, तत्पुरुष)', 'अनुवाद: हिन्दी से संस्कृत', 'रचनात्मक लेखन (पत्र, सूचना)'];
    } else if (isMath) {
      topicPlaceholder = 'e.g. Quadratic Equations, Trigonometry';
      subtopicPlaceholder = 'e.g. Quadratic Formula, BPT';
      topicChips = ['Real Numbers', 'Polynomials', 'Pair of Linear Equations in Two Variables', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles (Similarity & BPT)', 'Coordinate Geometry', 'Introduction to Trigonometry', 'Some Applications of Trigonometry', 'Circles', 'Areas Related to Circles', 'Surface Areas & Volumes', 'Statistics', 'Probability'];
    } else if (isPhysics) {
      topicPlaceholder = 'e.g. Electricity, Light Reflection';
      subtopicPlaceholder = "e.g. Ohm's Law, Lens Formula";
      topicChips = ['Light: Reflection & Refraction', 'Human Eye & the Colourful World', 'Electricity', 'Magnetic Effects of Electric Current', 'Sources of Energy'];
    } else if (isChemistry) {
      topicPlaceholder = 'e.g. Chemical Reactions, Carbon';
      subtopicPlaceholder = 'e.g. Esterification, Metals';
      topicChips = ['Chemical Reactions & Equations', 'Acids, Bases and Salts', 'Metals and Non-Metals', 'Carbon and Its Compounds'];
    } else if (isBiology) {
      topicPlaceholder = 'e.g. Life Processes, Reproduction';
      subtopicPlaceholder = "e.g. Photosynthesis, Mendel's Laws";
      topicChips = ['Life Processes (Nutrition, Respiration, Transportation)', 'Control & Coordination', 'How Do Organisms Reproduce?', 'Heredity & Evolution', 'Our Environment', 'Management of Natural Resources'];
    } else if (isScience) {
      topicPlaceholder = 'e.g. Chemical Reactions, Electricity';
      subtopicPlaceholder = "e.g. Ohm's Law, Life Processes";
      topicChips = ['Chemical Reactions & Equations', 'Life Processes', 'Light: Reflection & Refraction', 'Electricity', 'Carbon & Its Compounds', 'Heredity & Evolution'];
    } else if (isCS) {
      topicPlaceholder = 'e.g. Python OOP, SQL Databases';
      subtopicPlaceholder = 'e.g. Classes & Objects, Joins';
      topicChips = ['Python: Object-Oriented Programming (OOP)', 'Python: Inheritance & Polymorphism', 'Python: File Handling & Exception', 'Database Concepts & SQL', 'SQL: Joins & Aggregate Functions', 'Computer Networks & Internet'];
    }

  // ── CLASS 11 & 12 ─────────────────────────────────────────────────────────
  } else if (['Class 11', 'Class 12'].includes(cls)) {
    if (isPhysics) {
      topicPlaceholder = 'e.g. Electrostatics, Optics, Motion';
      subtopicPlaceholder = "e.g. Gauss's Law, Kirchhoff's Laws";
      topicChips = ['Units & Measurements', 'Kinematics (Motion in Straight Line & Plane)', 'Laws of Motion', 'Work, Energy & Power', 'Rotational Motion & Gravitation', 'Properties of Matter & Thermodynamics', 'Oscillations & Waves', 'Electrostatics (Class 12)', 'Current Electricity (Class 12)', 'Magnetic Effects & Magnetism (Class 12)', 'Electromagnetic Induction & AC (Class 12)', 'Ray Optics & Wave Optics (Class 12)', 'Dual Nature & Semiconductor Electronics (Class 12)'];
    } else if (isChemistry) {
      topicPlaceholder = 'e.g. Chemical Bonding, Electrochemistry';
      subtopicPlaceholder = 'e.g. Hybridisation, Nernst Equation';
      topicChips = ['Structure of Atom', 'Classification of Elements & Periodicity', 'Chemical Bonding & Molecular Structure', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Solutions (Class 12)', 'Electrochemistry (Class 12)', 'Chemical Kinetics (Class 12)', 'Surface Chemistry (Class 12)', 'Organic Chemistry Basics & Mechanisms (Class 12)', 'Aldehydes, Ketones & Carboxylic Acids (Class 12)'];
    } else if (isMath) {
      topicPlaceholder = 'e.g. Integrals, Matrices, Derivatives';
      subtopicPlaceholder = 'e.g. Integration by Parts, Chain Rule';
      topicChips = ['Sets and Functions', 'Trigonometric Functions', 'Principle of Mathematical Induction', 'Complex Numbers', 'Permutations & Combinations', 'Binomial Theorem', 'Sequences & Series', 'Straight Lines & Conic Sections', 'Limits & Derivatives', 'Relations & Functions (Class 12)', 'Matrices & Determinants (Class 12)', 'Continuity & Differentiability (Class 12)', 'Integrals (Class 12)', 'Differential Equations (Class 12)', 'Vector Algebra & 3D Geometry (Class 12)', 'Linear Programming (Class 12)', 'Probability (Class 12)'];
    } else if (isBiology) {
      topicPlaceholder = 'e.g. Inheritance, Biotechnology';
      subtopicPlaceholder = 'e.g. DNA Replication, Meiosis';
      topicChips = ['The Living World & Biological Classification', 'Cell: The Unit of Life', 'Biomolecules & Cell Cycle', 'Photosynthesis & Respiration in Plants', 'Plant Growth & Development', 'Digestion & Absorption', 'Breathing & Exchange of Gases', 'Body Fluids & Circulation', 'Human Reproduction (Class 12)', 'Reproductive Health (Class 12)', 'Principles of Inheritance & Variation (Class 12)', 'Molecular Basis of Inheritance (Class 12)', 'Evolution (Class 12)', 'Human Health & Disease (Class 12)', 'Biotechnology (Class 12)', 'Ecology & Environment (Class 12)'];
    } else if (isHistory) {
      topicPlaceholder = 'e.g. Harappan Civilisation, Rebels 1857';
      subtopicPlaceholder = 'e.g. Ashokan Inscriptions, Bhakti Era';
      topicChips = ['Bricks, Beads & Bones (Harappan Civilisation)', 'Kings, Farmers & Towns (Early India)', 'Thinkers, Beliefs & Buildings (600 BCE–600 CE)', 'Travellers\' Accounts – Al-Beruni, Ibn Battuta (Class 12)', 'Bhakti-Sufi Traditions (Class 12)', 'An Imperial Capital: Vijayanagara (Class 12)', 'Peasants, Zamindars & the State (Class 12)', 'Rebels & the Raj: 1857 (Class 12)', 'Mahatma Gandhi & the Nationalist Movement (Class 12)', 'Partition & Independence (Class 12)'];
    } else if (isPolity || isCivics) {
      topicPlaceholder = 'e.g. Constitution, Rights, Cold War';
      subtopicPlaceholder = 'e.g. Executive, Judiciary, Foreign Policy';
      topicChips = ['Constitution: Why & How?', 'Rights in Indian Constitution', 'Election & Representation', 'Executive & Legislature', 'Judiciary & Local Governments', 'Political Theory: Equality & Justice', 'The Cold War Era (Class 12)', 'The End of Bipolarity (Class 12)', 'Security in Contemporary World (Class 12)', 'India\'s Foreign Policy (Class 12)', 'India at the Time of Partition (Class 12)', 'Challenges of Nation Building (Class 12)'];
    } else if (isGeography) {
      topicPlaceholder = 'e.g. Physical Geography, Landforms';
      subtopicPlaceholder = 'e.g. Plate Tectonics, Climate Zones';
      topicChips = ['Origin & Evolution of the Earth', 'Interior of the Earth & Landforms', 'Distribution of Oceans & Continents', 'Atmospheric Composition & Structure', 'Solar Radiation & Atmospheric Circulation', 'Water in the Atmosphere & Oceans', 'World Climate & Climate Change', 'India: Location & Relief (Class 12)', 'Agriculture & Industries in India (Class 12)', 'Transport, Communication & Trade (Class 12)', 'Population: Distribution & Density (Class 12)'];
    } else if (isEconomics) {
      topicPlaceholder = 'e.g. Microeconomics, National Income';
      subtopicPlaceholder = 'e.g. Demand & Supply, Money & Banking';
      topicChips = ['Introduction to Economics & Microeconomics', 'Consumer Equilibrium & Demand', 'Producer Behaviour & Supply', 'Forms of Market & Price Determination', 'National Income Accounting (Class 12)', 'Money & Banking (Class 12)', 'Determination of Income & Employment (Class 12)', 'Government Budget & Economy (Class 12)', 'Balance of Payments & Exchange Rate (Class 12)'];
    } else if (isAccountancy) {
      topicPlaceholder = 'e.g. Partnership Accounts, Cash Flow';
      subtopicPlaceholder = 'e.g. Goodwill, Journal Entries';
      topicChips = ['Introduction to Accounting', 'Recording of Transactions: Journal & Ledger', 'Trial Balance & Rectification of Errors', 'Depreciation, Provisions & Reserves', 'Bills of Exchange', 'Introduction to Partnership Accounts (Class 12)', 'Reconstitution: Admission & Retirement (Class 12)', 'Dissolution of Partnership (Class 12)', 'Issue & Forfeiture of Shares (Class 12)', 'Issue of Debentures (Class 12)', 'Financial Statements (Class 12)', 'Cash Flow Statement (Class 12)'];
    } else if (isBusiness) {
      topicPlaceholder = 'e.g. Management Principles, Marketing';
      subtopicPlaceholder = "e.g. Taylor's Principles, 4 Ps";
      topicChips = ['Nature & Significance of Management', 'Principles of Management (Taylor & Fayol)', 'Business Environment', 'Planning & Organising', 'Staffing & Directing', 'Controlling', 'Financial Management (Class 12)', 'Financial Markets (Class 12)', 'Marketing Management & Consumer Protection (Class 12)'];
    } else if (isEnglish) {
      topicPlaceholder = 'e.g. The Portrait of a Lady, Deep Water';
      subtopicPlaceholder = 'e.g. Notice Writing, Article Writing';
      topicChips = ['The Portrait of a Lady (Khushwant Singh)', 'We\'re Not Afraid to Die (Class 11)', 'The Adventure (Jayant Narlikar, Class 11)', 'The Browning Version (Rattigan, Class 11)', 'The Last Lesson (Daudet, Class 12)', 'Lost Spring (Anees Jung, Class 12)', 'Deep Water (William Douglas, Class 12)', 'The Rattrap (Selma Lagerlöf, Class 12)', 'Indigo (Louis Fischer, Class 12)', 'My Mother at Sixty-Six (Kamala Das, Class 12)', 'Writing Skills: Notice, Article & Letter (Class 12)'];
    } else if (isHindi) {
      topicPlaceholder = 'e.g. कबीर के पद, भक्तिन, बाज़ार दर्शन';
      subtopicPlaceholder = 'e.g. शब्द-शक्ति, छन्द, निबंध';
      topicChips = ['आरोह: कबीर के पद', 'आरोह: मीरा के पद', 'स्पर्श: धूल', 'स्पर्श: मीठी नींद', 'भक्तिन (महादेवी वर्मा, Class 12)', 'बाज़ार दर्शन (जैनेन्द्र कुमार, Class 12)', 'काले मेघा पानी दे (Class 12)', 'व्याकरण: शब्द-शक्ति एवं छन्द', 'लेखन: निबंध, संस्मरण एवं पत्र'];
    } else if (isSociology) {
      topicPlaceholder = 'e.g. Social Institutions, Social Change';
      subtopicPlaceholder = 'e.g. Family & Kinship, Caste System';
      topicChips = ['Introducing Sociology: Society & the Individual', 'Terms, Concepts & Their Use in Sociology', 'Understanding Social Institutions', 'Culture & Socialisation', 'Doing Sociology: Research Methods', 'Social Inequality & Exclusion (Class 12)', 'The Challenges of Cultural Diversity (Class 12)', 'Social Change & Development in India (Class 12)', 'Social Movements (Class 12)'];
    } else if (isPsychology) {
      topicPlaceholder = 'e.g. What is Psychology, Motivation';
      subtopicPlaceholder = "e.g. Conditioning, Personality";
      topicChips = ['What is Psychology?', 'Methods of Enquiry in Psychology', 'The Bases of Human Behaviour (Biology & Culture)', 'Human Development across Life Span', 'Sensory, Attentional & Perceptual Processes', 'Learning (Classical, Operant, Observational)', 'Human Memory: Encoding, Storage & Retrieval', 'Thinking, Language & Communication', 'Motivation & Emotion (Class 12)', 'Self & Personality (Class 12)', 'Life Challenges: Stress & Coping (Class 12)', 'Psychological Disorders (Class 12)', 'Developing Psychological Skills (Class 12)'];
    } else if (isCS) {
      topicPlaceholder = 'e.g. Python Data Structures, SQL Queries';
      subtopicPlaceholder = 'e.g. Recursion, JOIN in SQL';
      topicChips = ['Python: Review of Basics & Functions', 'Python: Data Structures (Stack, Queue)', 'Python: File Handling & Exception Handling', 'Database Concepts & MySQL', 'SQL: DDL, DML & Queries', 'SQL: Joins, Views & Aggregate Functions', 'Computer Networks & Protocols', 'Web Technologies (HTML, CSS Basics)', 'Boolean Algebra & Logic Gates', 'Cyber Safety & Digital Ethics'];
    } else if (isPE) {
      topicPlaceholder = 'e.g. Physical Fitness, Yoga';
      subtopicPlaceholder = 'e.g. Components of Fitness, Asanas';
      topicChips = ['Physical Fitness, Wellness & Lifestyle', 'Yoga for Wellness (Asanas & Pranayama)', 'Olympic Movement & Sports Values', 'Biomechanics in Sports', 'Kinesiology: Joints & Movements', 'Sports Psychology: Motivation & Anxiety', 'Women & Sports', 'Test & Measurement in Sports', 'Sports Training & Doping'];
    }
  }

  // ── Fallback if no specific match ────────────────────────────────────────
  if (topicChips.length === 0) {
    if (normSub) {
      const formattedName = normSub.charAt(0).toUpperCase() + normSub.slice(1);
      topicPlaceholder = `e.g. Key Concept 1, ${formattedName} Topics`;
      subtopicPlaceholder = `e.g. Important Theorems, ${formattedName} Examples`;
      topicChips = [`${formattedName} Fundamentals`, 'NCERT Chapter 1', 'NCERT Chapter 2', 'NCERT Chapter 3', 'Revision Topics & Previous Year Questions'];
    } else {
      topicPlaceholder = 'e.g. Select Subject to see NCERT topics';
      subtopicPlaceholder = 'e.g. Select Topic first';
    }
  }

  return {
    actionChips,
    topicPlaceholder,
    subtopicPlaceholder,
    topicChips,
  };
};
