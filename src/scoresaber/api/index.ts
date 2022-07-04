import axios, { AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import { BasicPlayer, FullPlayer, PlayerScore, PlayerScoreCollection } from "./PlayerData";
import { RankRequestListing } from "./Ranking";

axiosRetry(axios, {
    retries: 3,
});

export default class ScoreSaberApi {
    private static readonly SS_BASE_URL = 'https://scoresaber.com/api/';

    public static async fetchAllScores(playerId: string): Promise<PlayerScore[]> {
        const fullPlayer = await this.fetchFullPlayer(playerId);
        const totalPages = Math.ceil(fullPlayer.scoreStats.totalPlayCount / 100);
        let playerScores = [] as PlayerScore[];
        for (let i = 1; i <= totalPages; i++) {
            process.stdout.write(`\r\x1b[2KFetching page ${i}/${totalPages}...`);
            const resp = await this.fetchApiPage(`player/${playerId}/scores?limit=100&sort=recent&page=${i}`);
            const scoresPage = resp.data as PlayerScoreCollection;
            playerScores = playerScores.concat(scoresPage.playerScores);
            await this.waitForRateLimit(resp);
        }
        process.stdout.write(`\r\x1b[2KFetched ${totalPages}/${totalPages}.\n`);
        process.stdout.write(`\r\x1b[2KThe length of scores is: ${playerScores.length}.\n`)
        return playerScores;
    }

    public static async fetchRankingQueue(): Promise<RankRequestListing[]> {
        const topOfRankingQueue = (await this.fetchApiPage('ranking/requests/top')).data as RankRequestListing[];
        const restOfRankingQueue = (await this.fetchApiPage('ranking/requests/belowTop')).data as RankRequestListing[];
        return topOfRankingQueue.concat(restOfRankingQueue);
    }

    public static async fetchBasicPlayer(playerId: string): Promise<BasicPlayer> {
        const basicPlayer = (await this.fetchApiPage(`player/${playerId}/basic`)).data as BasicPlayer;
        return basicPlayer;
    }

    public static async fetchFullPlayer(playerId: string): Promise<FullPlayer> {
        const fullPlayer = (await this.fetchApiPage(`player/${playerId}/full`)).data as FullPlayer;
        return fullPlayer;
    }

    private static async fetchApiPage(relativePath: string): Promise<AxiosResponse<object>> {
        return await axios.get(this.SS_BASE_URL + relativePath);
    }

    private static async waitForRateLimit(resp: AxiosResponse<object>) {
        if (resp.headers['x-ratelimit-remaining'] === "1") {
            const expiresInMillis = resp.headers['x-ratelimit-reset'] * 1000 - new Date().getTime() + 1000;
            await new Promise(resolve => setTimeout(resolve, expiresInMillis));
        }
    }
}