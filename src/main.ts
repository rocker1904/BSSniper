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
export async function playlistByPredicate(playerId: string, predicate: ScorePredicate, playlistName: InfoToName): Promise<Playlist> {
    const scores = await ScoreSaberApi.fetchAllScores(playerId);
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
    const playerInfo = await ScoreSaberApi.fetchPlayerInfo(playerId);
    return playlist(playlistName(playerInfo), './resources/sniped.png', filteredSongs);
}

// Returns a playlist of all songs for which the given player has #1.
export async function playlistOfNumber1s(playerId: string): Promise<Playlist> {
    const predicate: ScorePredicate = score => score.rank === 1;
    const playlistName: InfoToName = playerInfo => `${playerInfo.playerName}'s #1s`;
    return playlistByPredicate(playerId, predicate, playlistName);
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
export async function playlistOfTopX(playerId: string, x: number, onlyRanked: boolean): Promise<Playlist> {
    const predicate: ScorePredicate = score => score.rank <= x && (!onlyRanked || score.pp !== 0);
    const playlistName: InfoToName = playerInfo => `${playerInfo.playerName}'s Top ${x}s`;
    return playlistByPredicate(playerId, predicate, playlistName);
}

// Returns a playlist of all songs for which the given player is not ranked in the top x.
export async function playlistOfNotTopX(playerId: string, x: number, onlyRanked: boolean): Promise<Playlist> {
    const predicate: ScorePredicate = score => score.rank > x && (!onlyRanked || score.pp !== 0);
    const playlistName: InfoToName = playerInfo => `${playerInfo.playerName}'s Not Top ${x}s`;
    return playlistByPredicate(playerId, predicate, playlistName);
}

// Returns a playlist of all songs for which the given player has an accuracy below the given value.
export async function playlistOfScoresBelowGivenAccuracy(playerId: string, accuracy: number, onlyRanked:boolean): Promise<Playlist> {
    const predicate: ScorePredicate = score => {
        const songAcc = score.score / score.maxScore * 100;
        return songAcc < accuracy && (!onlyRanked || score.pp !== 0);
    };
    const playlistName: InfoToName = playerInfo => `${playerInfo.playerName}'s Below ${accuracy}`;
    return playlistByPredicate(playerId, predicate, playlistName);
}

// Returns the percentage of songs for which the given player is #1.
export async function percentageOfNMumber1s(playerId: string): Promise<number> {
    const scores = await ScoreSaberApi.fetchAllScores(playerId);
    let totalNum1s = scores.filter(score => score.rank === 1).length;
    return totalNum1s / scores.length * 100;
}

// Returns a playlist of all songs where player1 has a lower score than player2.
export async function snipePlaylist(p1Id: string, p2Id: string): Promise<Playlist> {
    const p2Scores = await ScoreSaberApi.fetchAllScores(p2Id);
    const predicate: ScorePredicate = p1Score => p2Scores.some(p2Score => p1Score.leaderboardId === p2Score.leaderboardId && p1Score.score < p2Score.score);
    const p2Info = await ScoreSaberApi.fetchPlayerInfo(p2Id);
    const playlistName: InfoToName = () => `Snipe ${p2Info.playerName}`;
    return playlistByPredicate(p1Id, predicate, playlistName);
}