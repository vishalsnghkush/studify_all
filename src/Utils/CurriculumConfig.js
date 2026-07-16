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

export const getSubjectsForClass = (studentClass, stream) => {
  if (['Class 11', 'Class 12'].includes(studentClass)) {
    if (stream === 'Science') {
      return [
        { label: 'Physics', value: 'Physics' },
        { label: 'Chemistry', value: 'Chemistry' },
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'Biology', value: 'Biology' },
        { label: 'Computer Science', value: 'Computer Science' },
        { label: 'English', value: 'English' },
      ];
    }
    if (stream === 'Commerce') {
      return [
        { label: 'Accountancy', value: 'Accountancy' },
        { label: 'Business Studies', value: 'Business Studies' },
        { label: 'Economics', value: 'Economics' },
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'English', value: 'English' },
      ];
    }
    if (stream === 'Arts') {
      return [
        { label: 'History', value: 'History' },
        { label: 'Political Science', value: 'Political Science' },
        { label: 'Geography', value: 'Geography' },
        { label: 'Psychology', value: 'Psychology' },
        { label: 'Sociology', value: 'Sociology' },
        { label: 'English', value: 'English' },
      ];
    }
    return []; // Stream required
  }
  
  // Classes 6-10 generic subjects
  if (['Class 9', 'Class 10'].includes(studentClass)) {
    return [
      { label: 'Mathematics', value: 'Mathematics' },
      { label: 'Science', value: 'Science' },
      { label: 'Physics', value: 'Physics' },
      { label: 'Chemistry', value: 'Chemistry' },
      { label: 'Biology', value: 'Biology' },
      { label: 'History', value: 'History' },
      { label: 'Civics', value: 'Civics' },
      { label: 'Geography', value: 'Geography' },
      { label: 'English', value: 'English' },
      { label: 'Hindi', value: 'Hindi' },
    ];
  }

  // Classes 6-8 generic subjects
  return [
    { label: 'Mathematics', value: 'Mathematics' },
    { label: 'Science', value: 'Science' },
    { label: 'History', value: 'History' },
    { label: 'Civics', value: 'Civics' },
    { label: 'Geography', value: 'Geography' },
    { label: 'English', value: 'English' },
    { label: 'Hindi', value: 'Hindi' },
  ];
};
