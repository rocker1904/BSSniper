import { writePlaylist, playlistOfNumber1s, percentageOfNMumber1s, snipePlaylist, rankingQueuePlaylist, playlistOfTopX, playlistOfNotTopX, playlistOfScoresBelowGivenAccuracy, PlayerData, getPlayerData } from './main';

async function noTopLevelAsyncAwait() {

    let joshabi = await getPlayerData('76561198138161802');
    writePlaylist(await playlistOfNumber1s(joshabi));
}

noTopLevelAsyncAwait();