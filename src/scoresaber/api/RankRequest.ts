export default interface RankRequest {
    request: number;
    songId: number;
    priority: number;
    name: string;
    levelAuthorName: string;
    id: string;
    created_at: string;
    rankVotes: {
      upvotes: number;
      downvotes: number;
      myVote: boolean;
    };
    qatVotes: {
      upvotes: number;
      downvotes: number;
      myVote: boolean;
    },
    difficulties: number;
}