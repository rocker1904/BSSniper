import ScoreSaberApi from './scoresaber/api';
import Score from './scoresaber/api/Score';
import PlayerInfo from './scoresaber/api/PlayerInfo';
import Playlist from './playlists/Playlist';
import Song from './playlists/Song';
import { name } from '../package.json';
import path from 'path';
import fs from 'fs';
import util from 'util';

interface ScorePredicate {
    (value: Score, index: number, array: Score[]): boolean
}

interface InfoToName {
    (playerInfo: PlayerInfo): string
}

// A class for storing player information
export class PlayerData {
    scores: Score[] = [];
    info!: PlayerInfo;
    constructor(scores: Score[], info: PlayerInfo){
        this.scores = scores;
        this.info = info;
    }
}

// Gathers a players scores and information, returns the Data
export async function getPlayerData(playerID: string): Promise<PlayerData> {
    let scores = await ScoreSaberApi.fetchAllScores(playerID);
    let playerInfo = await ScoreSaberApi.fetchPlayerInfo(playerID);
    return new PlayerData(scores, playerInfo);
}

// Replaces restricted characters with an underscore.
function windowsFileNamify(str: string): string {
    return str.replace(/[\/\\:*?"<>|]/g, '_');
}

// Converts an image at a given file path to a base64 string.
async function imgToBase64(imagePath: string): Promise<string> {
    let ext = path.extname(imagePath).substr(1);
    if (ext === 'svg') ext = "svg+xml";
    const readFile = util.promisify(fs.readFile);
    const imgData = await readFile(imagePath);
    return `data:image/${ext}$;base64,${imgData.toString('base64')}`;
}

// Returns a playlist with base64 converted image.
async function playlist(playlistTitle: string, imagePath: string, songs: Song[], playlistDescription = ''): Promise<Playlist> {
    return { playlistTitle, playlistAuthor: name, playlistDescription, image: await imgToBase64(imagePath), songs };
}

// Writes a playlist to file.
export async function writePlaylist(playlist: Playlist, fileName = playlist.playlistTitle): Promise<void> {
    const playlistString = JSON.stringify(playlist);
    const writeFile = util.promisify(fs.writeFile);
    return writeFile(`${windowsFileNamify(fileName)}.json`, playlistString);
}

// Returns a playlist of a user's songs filtered by a predicate.
export async function playlistByPredicate(player: PlayerData, predicate: ScorePredicate, playlistName: InfoToName, scores?: Score[]): Promise<Playlist> {
    if (!scores) {
        scores = player.scores;
    }
    let filteredSongs: Song[] = scores.filter(predicate).map(score => {
        if (score.difficultyRaw.split('_')[2] === "SoloStandard"){
            return {songName: score.songName,
                levelAuthorName: score.levelAuthorName,
                hash: score.songHash,
                levelid: "custom_level_" + score.songHash,
                difficulties: [{characteristic: "Standard", name: score.difficultyRaw.split('_')[1]}]
            }
        } else {
            return {songName: score.songName,
                levelAuthorName: score.levelAuthorName,
                hash: score.songHash,
                levelid: "custom_level_" + score.songHash
            }
        }
        
    });
    return playlist(playlistName(player.info), './resources/sniped.png', filteredSongs);
}

// Returns a playlist of all songs for which the given player has #1.
export async function playlistOfNumber1s(player: PlayerData): Promise<Playlist> {
    const predicate: ScorePredicate = score => score.rank === 1;
    const playlistName: InfoToName = playerInfo => `${playerInfo.playerName}'s #1s`;
    return playlistByPredicate(player, predicate, playlistName);
}

// Returns a playlist of all the songs currently in the ranking queue.
export async function rankingQueuePlaylist(): Promise<Playlist> {
    const rankRequests = await ScoreSaberApi.fetchRankingQueue();
    const songs: Song[] = rankRequests.map(rankRequest => {
        return {songName: rankRequest.name,
                levelAuthorName: rankRequest.levelAuthorName,
                hash: rankRequest.id,
                levelid: "custom_level_" + rankRequest.id
            }
    });
    return playlist('SS Ranking Queue', './resources/SSRankQueue.png', songs);
}

// Returns a playlist of all songs for which the given player is ranked in the top x.
export async function playlistOfTopX(player: PlayerData, x: number, onlyRanked: boolean): Promise<Playlist> {
    const predicate: ScorePredicate = score => score.rank <= x && (!onlyRanked || score.pp !== 0);
    const playlistName: InfoToName = playerInfo => `${playerInfo.playerName}'s Top ${x}s`;
    return playlistByPredicate(player, predicate, playlistName);
}

// Returns a playlist of all songs for which the given player is not ranked in the top x.
export async function playlistOfNotTopX(player: PlayerData, x: number, onlyRanked: boolean): Promise<Playlist> {
    const predicate: ScorePredicate = score => score.rank > x && (!onlyRanked || score.pp !== 0);
    const playlistName: InfoToName = playerInfo => `${playerInfo.playerName}'s Not Top ${x}s`;
    return playlistByPredicate(player, predicate, playlistName);
}

// Returns a playlist of all songs for which the given player has an accuracy below the given value.
export async function playlistOfScoresBelowGivenAccuracy(player: PlayerData, accuracy: number, onlyRanked:boolean): Promise<Playlist> {
    const predicate: ScorePredicate = score => {
        const songAcc = score.score / score.maxScore * 100;
        return songAcc < accuracy && (!onlyRanked || score.pp !== 0);
    };
    const playlistName: InfoToName = playerInfo => `${playerInfo.playerName}'s Below ${accuracy}`;
    return playlistByPredicate(player, predicate, playlistName);
}

// Returns a playlist that order's based on percieved potential improvement
export async function playlistByPercievedWorstScore(player: PlayerData, PPUpper: number, PPLower: number, leaderboardPlace: number, onlyRanked:boolean): Promise<Playlist> {
    const predicate: ScorePredicate = score => {
        const songAcc = score.score / score.maxScore * 100;
		return score.rank > leaderboardPlace && score.pp <= PPUpper && score.pp >= PPLower && songAcc < 98.6;
    };
    
    const playlistName: InfoToName = playerInfo => `${playerInfo.playerName}'s Improvement Checklist.`;
    let sorted = player.scores.sort(compare);
    sorted = sorted.filter(predicate);
    // Debug the Weight, rank, date and PP to console for each map for adjusting purposes
    for (let j = 0; j < sorted.length; j++){
        console.log(`>> ${sorted[j].songName}, Weight: ${weighting(sorted[j])} | Rank ${sorted[j].rank} | Month  ${monthDiff(new Date(sorted[j].timeSet), new Date())} | PP ${sorted[j].pp}`);
    }
    return playlistByPredicate(player, predicate, playlistName, sorted);
}

// Comparison function for the weights of 2 scores
function compare(a: Score, b: Score): number {
    const weightA = weighting(a);
    const weightB = weighting(b);
    return weightA - weightB;

}

// Weights a score based on its age, pp value, and rank
function weighting(score: Score){
    const ageInMonths = monthDiff(new Date(score.timeSet), new Date());
    let weight = score.rank * 3 + ageInMonths * 3 - score.pp / 20;
    return weight;
 }

 // Calculates the month difference between 2 set dates
 function monthDiff(d1: Date, d2: Date) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

// Returns the percentage of songs for which the given player is #1.
export async function percentageOfNMumber1s(player: PlayerData): Promise<number> {
    let totalNum1s = player.scores.filter(score => score.rank === 1).length;
    return totalNum1s / player.scores.length * 100;
}

// Returns a playlist of all songs where player1 has a lower score than player2.
export async function snipePlaylist(P1: PlayerData, P2: PlayerData): Promise<Playlist> {
    const predicate: ScorePredicate = p1Score => P2.scores.some(p2Score => p1Score.leaderboardId === p2Score.leaderboardId && p1Score.score < p2Score.score);
    const playlistName: InfoToName = () => `Snipe ${P2.info.playerName}`;
    return playlistByPredicate(P1, predicate, playlistName);
}