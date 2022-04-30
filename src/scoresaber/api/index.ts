import axios, { AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import {  Player, PlayerScore, PlayerScoreCollection,  } from './PlayerData';
import { RankRequestInformation, RankRequestListing } from "./Ranking";
import RankingQueue from "./RankingQueue";
import RankRequest from "./RankRequest";

axiosRetry(axios, {
    retries: 3,
});

export default class ScoreSaberApi {
    private static readonly SS_BASE_URL = 'https://scoresaber.com/api/';

    public static async fetchAllScores(playerId: string): Promise<PlayerScore[]> {
        const player = await this.fetchPlayer(playerId);
        const totalPages = Math.ceil(player.scoreStats.totalPlayCount / 8);
        let playerScores = [] as PlayerScore[];
        for (let i = 1; i <= totalPages; i++) {
            process.stdout.write(`\r\x1b[2KFetching page ${i}/${totalPages}...`);
            const resp = await this.fetchApiPage(`player/${playerId}/scores?sort=top&page=${i}`);
            const scoresPage = resp.data as PlayerScoreCollection;
            for(let j = 0; j < scoresPage.playerScores.length; j++) {
                playerScores.push(scoresPage.playerScores[j]);
            }
            await this.waitForRateLimit(resp);
        }
        process.stdout.write(`\r\x1b[2KFetched ${totalPages}/${totalPages}.\n`);
        process.stdout.write(`\r\x1b[2KThe length of scores is: ${playerScores.length}.\n`)
        return playerScores;
    }

    public static async fetchRankingQueue(): Promise<RankRequest[]> {
        const topOfRankingQueue = (await this.fetchApiPage('ranking/requests/top')).data as RankingQueue;
        const restOfRankingQueue = (await this.fetchApiPage('ranking/requests/belowTop')).data as RankingQueue;
        return topOfRankingQueue.requests.concat(restOfRankingQueue.requests);
    }

    public static async fetchPlayer(playerId: string): Promise<Player> {
        const player = (await this.fetchApiPage(`player/${playerId}/full`)).data as Player;
        return player;
    }

    private static async fetchApiPage(relativePath: string): Promise<AxiosResponse<object>> {
        return await axios.get(this.SS_BASE_URL + relativePath);
    }

    private static async waitForRateLimit(resp: AxiosResponse<object>) {
        if (resp.headers['x-ratelimit-remaining'] === "0") {
            const expiresInMillis = resp.headers['x-ratelimit-reset'] * 1000 - new Date().getTime() + 1000;
            await new Promise(resolve => setTimeout(resolve, expiresInMillis));
        }
    }
}