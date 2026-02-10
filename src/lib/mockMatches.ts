export interface MatchUser {
  id: string;
  name: string;
  age: number;
  country: string;
  flag: string;
  avatar: string;
  online: boolean;
  interests: string[];
  values: string[];
  personalityTags: string[];
  bio: string;
  mode: "dating" | "friendship" | "study" | "co-founder";
}

export interface MatchResult {
  user: MatchUser;
  score: number;
  sharedInterests: string[];
  sharedValues: string[];
  sharedPersonality: string[];
  textSimilarity: number;
  explanation: string;
}

export function computeMatch(userInterests: string[], userValues: string[], userPersonality: string[], userDesc: string, candidate: MatchUser): MatchResult {
  const sharedInterests = candidate.interests.filter((i) => userInterests.includes(i));
  const sharedValues = candidate.values.filter((v) => userValues.includes(v));
  const sharedPersonality = candidate.personalityTags.filter((p) => userPersonality.includes(p));

  // Simple text similarity based on word overlap
  const descWords = userDesc.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const bioWords = candidate.bio.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const commonWords = descWords.filter(w => bioWords.includes(w));
  const textSimilarity = descWords.length > 0 ? Math.min(1, commonWords.length / Math.max(descWords.length, 1) * 2) : 0;

  const interestScore = sharedInterests.length / Math.max(candidate.interests.length, 1) * 35;
  const valueScore = sharedValues.length / Math.max(candidate.values.length, 1) * 25;
  const personalityScore = sharedPersonality.length / Math.max(candidate.personalityTags.length, 1) * 20;
  const textScore = textSimilarity * 20;
  const score = Math.round(Math.min(100, interestScore + valueScore + personalityScore + textScore));

  const parts: string[] = [];
  if (sharedInterests.length > 0) parts.push(`You both enjoy ${sharedInterests.slice(0, 2).join(" & ")}`);
  if (sharedValues.length > 0) parts.push(`shared values in ${sharedValues.slice(0, 2).join(" & ")}`);
  if (sharedPersonality.length > 0) parts.push(`both ${sharedPersonality[0].toLowerCase()}`);
  const explanation = parts.length > 0 ? parts.join(". ") + "." : "Explore and find common ground!";

  return { user: candidate, score, sharedInterests, sharedValues, sharedPersonality, textSimilarity, explanation };
}
