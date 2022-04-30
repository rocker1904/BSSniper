import { writePlaylist, playlistOfNumber1s, percentageOfNMumber1s, snipePlaylist, rankingQueuePlaylist, playlistOfTopX, playlistOfNotTopX, playlistOfScoresBelowGivenAccuracy, PlayerData, getPlayerData, playlistByPercievedWorstScore } from './main';

async function noTopLevelAsyncAwait() {

    let joshabi = await getPlayerData('76561198138161802');
    writePlaylist(await playlistByPercievedWorstScore(joshabi, 4, 7, 50, true));
    console.log(await percentageOfNMumber1s(joshabi));
}

noTopLevelAsyncAwait();