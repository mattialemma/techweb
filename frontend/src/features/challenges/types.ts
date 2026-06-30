export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ChallengeOrdering = "newest" | "oldest";

export type ChallengeAuthor = {
  userId: number;
  username: string;
  avatarUrl: string | null;
};

export type Challenge = {
  challengeId: number;
  title: string;
  description: string;
  author: ChallengeAuthor;
  positiveExample: string;
  negativeExample: string;
  createdAt: string;
};

export type CreateChallengePayload = {
  title: string;
  description: string;
  secretRegex: string;
  positiveExample: string;
  negativeExample: string;
  positiveControls: string[];
  negativeControls: string[];
};

export type Attempt = {
  attemptId: number;
  challengeId: number;
  proposedRegex: string;
  positiveMatched: number;
  negativeMatched: number;
  totalPositive: number;
  totalNegative: number;
  solved: boolean;
  attemptNumber: number;
  createdAt: string;
};

export type CreateAttemptPayload = {
  challengeId: string;
  proposedRegex: string;
};

export type LeaderboardEntry = {
  rank: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  solvedCount: number;
  averageAttempts: number;
};
