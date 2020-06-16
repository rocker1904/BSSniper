import ScoreSaberApi from './scoresaber/api'
import Playlist from './playlists/Playlist';
import { name } from '../package.json';
import Song from './playlists/Song';
import path from 'path';
import fs from 'fs';
import util from 'util';

// Create a playlist of songs where the given player has #1
export async function createPlaylistOfNumber1s(playerId: string): Promise<void> {

    const playlistImagePath = './resources/sniped.png';
    
    const scores = await ScoreSaberApi.fetchAllScores(playerId);
    let num1Songs = [] as Song[];
    for (const score of scores) {
        if (score.rank === 1) {
            num1Songs.push(new Song(score.name, score.id));
        }
    }

    let ext = path.extname(playlistImagePath).substr(1);
    if (ext === 'svg') ext = "svg+xml";
    const readFile = util.promisify(fs.readFile);
    const imgData = await readFile(playlistImagePath);
    const base64Img = `data:image/${ext}$;base64,${imgData.toString('base64')}`;

    const basicPlayerInfo = await ScoreSaberApi.fetchBasicPlayerInfo(playerId);
    const asciiPlayerName = basicPlayerInfo.name.replace(/[^\x00-\x7F]/g, '');
    const playlist = new Playlist(`${asciiPlayerName}'s #1s`, name, base64Img, num1Songs);

    const playlistString = JSON.stringify(playlist);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(`${asciiPlayerName}'s #1s.json`, playlistString);
}

// Create a playlist of songs where player1 has a lower score than player2
export async function createSnipePlaylist(player1Id: string, player2Id: string): Promise<void> {

    const playlistImagePath = './resources/sniped.png';
    
    const player1Scores = await ScoreSaberApi.fetchAllScores(player1Id);
    const player2Scores = await ScoreSaberApi.fetchAllScores(player2Id);
    let songsToSnipe = [] as Song[];
    for (const player1Score of player1Scores) {
        for (const player2Score of player2Scores) {
            if (player1Score.id === player2Score.id && player1Score.score < player2Score.score) {
                songsToSnipe.push(new Song(player1Score.name, player1Score.id));
            }
        }
    }

    let ext = path.extname(playlistImagePath).substr(1);
    if (ext === 'svg') ext = "svg+xml";
    const readFile = util.promisify(fs.readFile);
    const imgData = await readFile(playlistImagePath);
    const base64Img = `data:image/${ext}$;base64,${imgData.toString('base64')}`;

    const basicPlayer2Info = await ScoreSaberApi.fetchBasicPlayerInfo(player2Id);
    const asciiPlayer2Name = basicPlayer2Info.name.replace(/[^\x00-\x7F]/g, '');
    const playlist = new Playlist(`Snipe ${asciiPlayer2Name}`, name, base64Img, songsToSnipe);

    const playlistString = JSON.stringify(playlist);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(`Snipe ${asciiPlayer2Name}.json`, playlistString);
}

export async function percentageOfNMumber1s(playerId: string): Promise<void> {
    
    const scores = await ScoreSaberApi.fetchAllScores(playerId);
    let totalNum1s = 0;
    for (const score of scores) {
        if (score.rank === 1) {
            totalNum1s++;
        }
    }

    console.log(totalNum1s/scores.length * 100);
}

export async function createRankingQueuePlaylist(): Promise<void> {

    const playlistImagePath = './resources/SSRankQueue.png';

    const rankRequests = await ScoreSaberApi.fetchRankingQueue();
    const songs = [] as Song[];
    for (const rankRequest of rankRequests) {
        songs.push(new Song(rankRequest.name, rankRequest.id));
    }

    let ext = path.extname(playlistImagePath).substr(1);
    if (ext === 'svg') ext = "svg+xml";
    const readFile = util.promisify(fs.readFile);
    const imgData = await readFile(playlistImagePath);
    const base64Img = `data:image/${ext}$;base64,${imgData.toString('base64')}`;

    const playlist = new Playlist('SS Ranking Queue', '', base64Img, songs);

    const playlistString = JSON.stringify(playlist);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(`SS Ranking Queue.json`, playlistString);
}