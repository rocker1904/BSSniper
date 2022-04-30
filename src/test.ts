import { writePlaylist, playlistOfNumber1s, percentageOfNMumber1s, snipePlaylist, rankingQueuePlaylist, playlistOfTopX, playlistOfNotTopX, playlistOfScoresBelowGivenAccuracy, PlayerData, getPlayerData, playlistByPercievedWorstScore, playlistByCombo } from './main';

async function noTopLevelAsyncAwait() {

    let joshabi = await getPlayerData('76561198138161802');
    writePlaylist(await playlistByCombo(joshabi, false, true));
}

noTopLevelAsyncAwait();