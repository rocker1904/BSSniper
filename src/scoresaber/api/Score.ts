export default interface Score {
    rank: number;
    scoreId: number;
    score: number;
    unmodififiedScore: number;
    mods: string;
    pp: number;
    weight: number;
    timeSet: string;
    leaderboardId: number;
    songHash: string;
    songName: string;
    songSubName: string;
    songAuthorName: string;
    levelAuthorName: string;
    difficulty: number;
    difficultyRaw: string;
    maxScore: number;
}