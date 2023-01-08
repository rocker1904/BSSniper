import ScoreSaberApi from './scoresaber/api';
import Playlist from './playlists/Playlist';
import Song from './playlists/Song';
import { name } from '../package.json';
import path from 'path';
import fs from 'fs';
import util from 'util';
import { PlayerScore, Player } from './scoresaber/api/PlayerData';

interface ScorePredicate {
    (playerScore: PlayerScore, index: number, playerScores: PlayerScore[]): boolean
}

interface PlayerToPlaylistName {
    (player: Player): string
}

// A class for storing player information
export class CachedPlayer {
    playerScores: PlayerScore[];
    player: Player;
    constructor(scores: PlayerScore[], player: Player) {
        this.playerScores = scores;
        this.player = player;
    }
}

// Gathers a players scores and information, returns the data
export async function getPlayerData(playerID: string): Promise<CachedPlayer> {
    const playerScores = await ScoreSaberApi.fetchAllScores(playerID);
    const basicPlayer = await ScoreSaberApi.fetchBasicPlayer(playerID);
    return new CachedPlayer(playerScores, basicPlayer);
}

// Replaces restricted characters with an underscore.
function windowsFileNamify(str: string): string {
    return str.replace(/[\/\\:*?"<>|]/g, '_');
}

// Converts an image at a given file path to a base64 string.
async function imgToBase64(imagePath: string): Promise<string> {
    let ext = path.extname(imagePath).substr(1);
    if (ext === 'svg') ext = 'svg+xml';
    const readFile = util.promisify(fs.readFile);
    const imgData = await readFile(imagePath);
    return `data:image/${ext}$;base64,${imgData.toString('base64')}`;
}

// Returns a playlist with base64 converted image.
async function playlist(playlistTitle: string, imagePath: string, songs: Song[], syncLink?:string, playlistDescription = ''): Promise<Playlist> {
    return { playlistTitle, playlistAuthor: name, playlistDescription, image: await imgToBase64(imagePath), syncURL: syncLink, songs };
}

// Writes a playlist to file.
export async function writePlaylist(playlist: Playlist, fileName = playlist.playlistTitle): Promise<void> {
    const playlistString = JSON.stringify(playlist);
    const writeFile = util.promisify(fs.writeFile);
    return writeFile(`${windowsFileNamify(fileName)}.json`, playlistString);
}

// Returns a playlist of a user's songs filtered by a predicate.
export async function playlistByPredicate(cachedPlayer: CachedPlayer, predicate: ScorePredicate, playlistName: PlayerToPlaylistName, playerScores?: PlayerScore[]): Promise<Playlist> {
    if (!playerScores) {
        playerScores = cachedPlayer.playerScores;
    }
    const filteredSongs: Song[] = playerScores.filter(predicate).map(playerScore => {
        if (playerScore.leaderboard.difficulty.difficultyRaw.split('_')[2] === 'SoloStandard') {
            return {
                songName: playerScore.leaderboard.songName,
                levelAuthorName: playerScore.leaderboard.levelAuthorName,
                hash: playerScore.leaderboard.songHash,
                levelid: 'custom_level_' + playerScore.leaderboard.songHash,
                difficulties: [{ characteristic: 'Standard', name: playerScore.leaderboard.difficulty.difficultyRaw.split('_')[1] }],
            };
        } else {
            return {
                songName: playerScore.leaderboard.songName,
                levelAuthorName: playerScore.leaderboard.levelAuthorName,
                hash: playerScore.leaderboard.songHash,
                levelid: 'custom_level_' + playerScore.leaderboard.songHash,
            };
        }
    });
    return playlist(playlistName(cachedPlayer.player), './resources/sniped.png', filteredSongs);
}

// Returns a playlist of all songs for which the given player has #1.
export async function playlistOfNumber1s(cachedPlayer: CachedPlayer): Promise<Playlist> {
    const predicate: ScorePredicate = playerScore => playerScore.score.rank === 1;
    const playlistName: PlayerToPlaylistName = player => `${player.name}'s #1s`;
    return playlistByPredicate(cachedPlayer, predicate, playlistName);
}

// Returns a playlist of all songs for which the given player has #1, within the last x months
export async function playlistOfNumber1sWithinXMonths(cachedPlayer: CachedPlayer, x: number): Promise<Playlist> {
    const predicate: ScorePredicate = playerScore => {
        const date = new Date(playerScore.score.timeSet);
        return playerScore.score.rank === 1 && date.getTime() > Date.now() - x * 30 * 24 * 60 * 60 * 1000;
    };
    const playlistName: PlayerToPlaylistName = player => `${player.name}'s #1s`;
    return playlistByPredicate(cachedPlayer, predicate, playlistName);
}

export async function playlistByCombo(cachedPlayer: CachedPlayer, fullCombo: boolean, onlyRanked: boolean): Promise <Playlist> {
    const predicate: ScorePredicate = playerScore => playerScore.score.fullCombo === fullCombo && (!onlyRanked || playerScore.score.pp !== 0);
    const playlistName: PlayerToPlaylistName = player => `${player.name}'s ${fullCombo ? '' : ' Not'} Full Combo`;
    return playlistByPredicate(cachedPlayer, predicate, playlistName);
}

export async function rankedPlaylistByStarValue(minStar:number, maxStar:number, syncLink?:string): Promise<Playlist> {
    const rankedMaps = await ScoreSaberApi.fetchRankedBetweenStars(minStar, maxStar);
    const songs: Song[] = rankedMaps.map(rankedMaps => {
        return { songName: rankedMaps.songName,
            levelAuthorName: rankedMaps.levelAuthorName,
            hash: rankedMaps.songHash,
            levelid: 'custom_level_'+rankedMaps.songHash,
            difficulties: [{ characteristic: 'Standard', name: rankedMaps.difficulty.difficultyRaw.split('_')[1] }],
        };
    });
    return playlist(`Ranked maps ${minStar}-${maxStar}*`, './resources/SSLogo.png', songs, syncLink );
}

// Returns a playlist of all the songs currently in the ranking queue.
export async function rankingQueuePlaylist(): Promise<Playlist> {
    const rankRequests = await ScoreSaberApi.fetchRankingQueue();
    const songs: Song[] = rankRequests.map(rankRequest => {
        return { songName: rankRequest.leaderboardInfo.songName,
            levelAuthorName: rankRequest.leaderboardInfo.levelAuthorName,
            hash: rankRequest.leaderboardInfo.songHash,
            levelid: 'custom_level_' + rankRequest.leaderboardInfo.songHash,
        };
    });
    return playlist('SS Ranking Queue', './resources/SSRankQueue.png', songs);
}

// Returns a playlist of all songs for which the given player is ranked in the top x.
export async function playlistOfTopX(cachedPlayer: CachedPlayer, x: number, onlyRanked: boolean): Promise<Playlist> {
    const predicate: ScorePredicate = playerScore => playerScore.score.rank <= x && (!onlyRanked || playerScore.score.pp !== 0);
    const playlistName: PlayerToPlaylistName = player => `${player.name}'s Top ${x}s`;
    return playlistByPredicate(cachedPlayer, predicate, playlistName);
}

// Returns a playlist of all songs for which the given player is not ranked in the top x.
export async function playlistOfNotTopX(cachedPlayer: CachedPlayer, x: number, onlyRanked: boolean): Promise<Playlist> {
    const predicate: ScorePredicate = playerScore => playerScore.score.rank > x && (!onlyRanked || playerScore.score.pp !== 0);
    const playlistName: PlayerToPlaylistName = player => `${player.name}'s Not Top ${x}s`;
    return playlistByPredicate(cachedPlayer, predicate, playlistName);
}

// Returns a playlist of all songs for which the given player has an accuracy below the given value.
export async function playlistOfScoresBelowGivenAccuracy(cachedPlayer: CachedPlayer, accuracy: number, onlyRanked:boolean): Promise<Playlist> {
    const predicate: ScorePredicate = playerScore => {
        const songAcc = playerScore.score.baseScore / playerScore.leaderboard.maxScore * 100;
        return songAcc < accuracy && (!onlyRanked || playerScore.score.pp !== 0);
    };
    const playlistName: PlayerToPlaylistName = player => `${player.name}'s Below ${accuracy}`;
    return playlistByPredicate(cachedPlayer, predicate, playlistName);
}

// Returns a playlist that order's based on percieved potential improvement
export async function playlistByPercievedWorstScore(cachedPlayer: CachedPlayer, lowestStar: number, highestStar: number, belowRank: number): Promise<Playlist> {
    const predicate: ScorePredicate = playerScore => {
        const songAcc = playerScore.score.baseScore / playerScore.leaderboard.maxScore * 100;
        return playerScore.score.rank < belowRank && playerScore.leaderboard.stars <= highestStar && playerScore.leaderboard.stars >= lowestStar && songAcc < 99;
    };

    const playlistName: PlayerToPlaylistName = player => `${player.name}'s Improvement Checklist.`;
    let sorted = cachedPlayer.playerScores.sort(compare);
    sorted = sorted.filter(predicate);
    // Debug the Weight, rank, date and PP to console for each map for adjusting purposes
    for (let j = 0; j < sorted.length; j++) {
        console.log(`>> ${sorted[j].leaderboard.songName}, Weight: ${weighting(sorted[j])} | Rank ${sorted[j].score.rank} | Month  ${monthDiff(new Date(sorted[j].score.timeSet), new Date())} | Star ${sorted[j].leaderboard.stars}`);
    }
    return playlistByPredicate(cachedPlayer, predicate, playlistName, sorted);
}

// Comparison function for the weights of 2 scores
function compare(a: PlayerScore, b: PlayerScore): number {
    const weightA = weighting(a);
    const weightB = weighting(b);
    return weightA - weightB;
}

// Weights a score based on its age, pp value, and rank
function weighting(playerScore: PlayerScore) {
    const ageInMonths = monthDiff(new Date(playerScore.score.timeSet), new Date());
    const weight = playerScore.score.rank * 3 + ageInMonths * 3 - playerScore.leaderboard.stars / 1.5;
    return weight;
}

// Calculates the month difference between 2 set dates
function monthDiff(d1: Date, d2: Date) {
    let months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

// Returns the percentage of songs for which the given player is #1.
export function percentageOfNMumber1s(cachedPlayer: CachedPlayer): number {
    const totalNum1s = cachedPlayer.playerScores.filter(score => score.score.rank === 1).length;
    return totalNum1s / cachedPlayer.playerScores.length * 100;
}

// Returns a playlist of all songs where player1 has a lower score than player2.
export async function snipePlaylist(P1: CachedPlayer, P2: CachedPlayer, onlyRanked:boolean): Promise<Playlist> {
    const predicate: ScorePredicate = p1Score => P2.playerScores.some(p2Score => p1Score.leaderboard.id === p2Score.leaderboard.id && p1Score.score.modifiedScore < p2Score.score.modifiedScore&& (!onlyRanked || p1Score.score.pp !== 0));
    const playlistName: PlayerToPlaylistName = () => `Snipe ${P2.player.name}`;
    return playlistByPredicate(P1, predicate, playlistName);
}