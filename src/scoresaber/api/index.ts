import Axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Leaderboard, LeaderboardInfo, LeaderboardInfoCollection, ScoreCollection } from './LeaderboardData';
import { BasicPlayer, FullPlayer, Player, PlayerCollection, PlayerScore, PlayerScoreCollection } from './PlayerData';
import axiosRetry from 'axios-retry';
import { RankRequestListing } from './Ranking';

axiosRetry(Axios, {
    retries: 3,
});

export default class ScoreSaberAPI {
    private static SS_BASE_URL = 'https://scoresaber.com/api/';
    private static rateLimitRemaining = 400;
    private static rateLimitReset = -1; // Unix timestamp, initialised by the first request

    private static async fetchPage(relativePath: string): Promise<unknown> {
        // Initialise rate limit reset time if uninitialised
        if (this.rateLimitReset === -1) {
            this.rateLimitReset = Math.floor(Date.now() / 1000) + 61; // 61 not 60 just to be safe
            setTimeout(() => this.rateLimitRemaining = 400, this.rateLimitReset * 1000 - Date.now());
        }

        // When we run out of requests, wait until the limit resets
        while (this.rateLimitRemaining <= 10) {
            const expiresInMillis = this.rateLimitReset * 1000 - Date.now() + 1000;
            await new Promise(resolve => setTimeout(resolve, expiresInMillis));
        }

        // Make the request
        const response = await Axios.get(this.SS_BASE_URL + relativePath);
        this.rateLimitRemaining--;

        // Update the reset time if it changed
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!response.headers['x-ratelimit-reset']) {
            throw new Error('Request missing ratelimit reset header');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const ratelimitReset = parseInt(response.headers['x-ratelimit-reset'] as string);
        if (this.rateLimitReset < ratelimitReset) {
            this.rateLimitReset = ratelimitReset;
            setTimeout(() => this.rateLimitRemaining = 400, this.rateLimitReset * 1000 - Date.now() + 500);
        }
        return response.data as unknown;
    }

    public static async fetchPlayerByRank(rank: number, region?: string): Promise<Player> {
        const pageNum = Math.ceil(rank / 50);
        let request = `players?page=${pageNum}`;
        if (region) request += `&countries=${region}`;
        const playerCollection = await this.fetchPage(request) as PlayerCollection; // TODO: Handle request fail
        return playerCollection.players[rank % 50 - 1];
    }

    public static async fetchPlayersUnderRank(rank: number, region?: string): Promise<Player[]> {
        let players: Player[] = [];
        const totalPages = Math.ceil(rank / 50);
        for (let i = 0; i < totalPages; i++) {
            let request = `players?page=${i + 1}`;
            if (region) request += `&countries=${region}`;
            const playerCollection = await this.fetchPage(request) as PlayerCollection; // TODO: Handle request fail
            players = players.concat(playerCollection.players);
        }
        return players;
    }

    public static async fetchBasicPlayer(playerId: string): Promise<BasicPlayer> {
        const basicPlayer = await this.fetchPage(`player/${playerId}/basic`) as BasicPlayer; // TODO: Handle request fail
        return basicPlayer;
    }

    public static async fetchFullPlayer(playerId: string): Promise<FullPlayer> {
        const fullPlayer = await this.fetchPage(`player/${playerId}/full`) as FullPlayer; // TODO: Handle request fail
        return fullPlayer;
    }

    public static async fetchScoresPage(playerId: string, pageNum: number): Promise<PlayerScoreCollection> {
        const scoresPage = await this.fetchPage(`player/${playerId}/scores?limit=100&sort=recent&page=${pageNum}`) as PlayerScoreCollection; // TODO: Handle request fail
        return scoresPage;
    }


    public static async fetchLeaderboards(starMin: number, starMax: number, pageNum: number) {
        const leaderboards = await this.fetchPage(`leaderboards?ranked=true&minStar=${starMin}&maxStar=${starMax}&page=${pageNum}`) as LeaderboardInfoCollection;
        return leaderboards;
    }

    public static async fetchLeaderboardScores(leaderboardId: number, page = 1): Promise<ScoreCollection> {
        const scoreCollection = await this.fetchPage(`leaderboard/by-id/${leaderboardId}/scores?page=${page}`) as ScoreCollection; // TODO: Handle request fail
        return scoreCollection;
    }

    public static async fetchLeaderboardInfo(leaderboardId: number): Promise<LeaderboardInfo> {
        const scoreCollection = await this.fetchPage(`leaderboard/by-id/${leaderboardId}/info`) as LeaderboardInfo; // TODO: Handle request fail
        return scoreCollection;
    }


    public static async fetchRankedBetweenStars(starMin: number, starMax: number): Promise<LeaderboardInfo[]> {
        const Firstleaderboard = await ScoreSaberAPI.fetchLeaderboards(starMin, starMax, 1);
        const totalPages =Math.ceil(Firstleaderboard.metadata.total/Firstleaderboard.metadata.itemsPerPage);
        let leaderboards = [] as LeaderboardInfo[];
        const promises = [];
        for (let i =1; i <= totalPages; i++) {
            const promise = ScoreSaberAPI.fetchLeaderboards(starMin, starMax, i).then(leaderboardPage=>{
                leaderboards = leaderboards.concat(leaderboardPage.leaderboards);
            });

            promises.push(promise);
        }
        console.log(`Waiting for ${totalPages} requests to resolve...`);
        await Promise.all(promises);
        console.log(`Fetched ${totalPages}/${totalPages}.`);
        return leaderboards;
    }


    public static async fetchRankingQueue(): Promise<RankRequestListing[]> {
        const topOfRankingQueue = await this.fetchPage('ranking/requests/top') as RankRequestListing[];
        const restOfRankingQueue = await this.fetchPage('ranking/requests/belowTop') as RankRequestListing[];
        return topOfRankingQueue.concat(restOfRankingQueue);
    }
    // Fetches all of a players scores by simultaneous requests of all score pages
    public static async fetchAllScores(playerId: string): Promise<PlayerScore[]> {
        const fullPlayer = await ScoreSaberAPI.fetchFullPlayer(playerId);
        const totalPages = Math.ceil(fullPlayer.scoreStats.totalPlayCount / 100);
        let playerScores = [] as PlayerScore[];
        const promises = [];
        for (let i = 1; i <= totalPages; i++) {
            const promise = ScoreSaberAPI.fetchScoresPage(playerId, i).then(scoresPage => {
                playerScores = playerScores.concat(scoresPage.playerScores);
            });
            promises.push(promise);
        }
        console.log(`Waiting for ${totalPages} requests to resolve...`);
        await Promise.all(promises);
        console.log(`Fetched ${totalPages}/${totalPages}.`);
        return playerScores;
    }
}
