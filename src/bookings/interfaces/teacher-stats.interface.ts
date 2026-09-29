export interface TeacherStats {
  commitmentScore: number;
  hearts: number;
  maxHearts: number;
  currentCompetence: string;
  competences: {
    poor: number;
    belowAverage: number;
    average: number;
    good: number;
    competent: number;
  };
  earnings: {
    total: number;
    currency: string;
    ratePerClass: number;
  };
  performance: {
    finishedCourses: number;
    canceledCourses: number;
    lateCourses: number;
    thumbsUp: number;
    thumbsDown: number;
    stars: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}
