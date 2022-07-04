import { writePlaylist, playlistOfNumber1s, percentageOfNMumber1s, snipePlaylist, rankingQueuePlaylist, playlistOfTopX, playlistOfNotTopX, playlistOfScoresBelowGivenAccuracy, CachedPlayer, getPlayerData, playlistByPercievedWorstScore, playlistByCombo, playlistOfNumber1sWithinXMonths } from './main';

async function noTopLevelAsyncAwait() {

    //const pandita = await getPlayerData('76561198186151129');
    //writePlaylist(await playlistOfNumber1sWithinXMonths(pandita, 5));
    writePlaylist(await rankingQueuePlaylist())
}

noTopLevelAsyncAwait();