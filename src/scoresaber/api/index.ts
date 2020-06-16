import axios, { AxiosResponse } from "axios";
import Score from "./Score";
import FullPlayer from "./FullPlayer";
import BasicPlayer from "./BasicPlayer";
import BasicPlayerInfo from "./BasicPlayerInfo";
import PlayerScores from "./PlayerScores";
import RankingQueue from "./RankingQueue";
import RankRequest from "./RankRequest";

export default class ScoreSaberApi {
    private static readonly SS_BASE_URL = 'https://new.scoresaber.com/api/';

    public static async fetchAllScores(playerId: string): Promise<Score[]> {
        const fullPlayer = await this.fetchFullPlayer(playerId);
        const totalPages = Math.ceil(fullPlayer.scoreStats.totalPlayCount / 8);
        let scores = [] as Score[];
        for (let i = 1; i <= totalPages; i++) {
            process.stdout.write(`\r\x1b[2KFetching page ${i}/${totalPages}...`);
            const scoresPage = (await this.fetchApiPage(`player/${playerId}/scores/top/${i}`)).data as PlayerScores;
            scores = scores.concat(scoresPage.scores);
        }
        process.stdout.write(`\r\x1b[2KFetched ${totalPages}/${totalPages}.\n`);
        return scores;
    }

    public static async fetchRankingQueue(): Promise<RankRequest[]> {
        const topOfRankingQueue = (await this.fetchApiPage('ranking/requests/top')).data as RankingQueue;
        const restOfRankingQueue = (await this.fetchApiPage('ranking/requests/belowTop')).data as RankingQueue;
        return topOfRankingQueue.requests.concat(restOfRankingQueue.requests);
    }

    public static async fetchBasicPlayerInfo(playerId: string): Promise<BasicPlayerInfo> {
        const basicPlayer = (await this.fetchApiPage(`player/${playerId}/basic`)).data as BasicPlayer;
        return basicPlayer.playerInfo;
    }

    public static async fetchFullPlayer(playerId: string): Promise<FullPlayer> {
        const fullPlayer = (await this.fetchApiPage(`player/${playerId}/full`)).data as FullPlayer;
        return fullPlayer;
    }

    private static async fetchApiPage(relativePath: string): Promise<AxiosResponse<object>> {
        return await axios.get(this.SS_BASE_URL + relativePath);
    }
}