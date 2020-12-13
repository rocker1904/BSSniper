import { writePlaylist, playlistOfNumber1s, percentageOfNMumber1s, snipePlaylist, rankingQueuePlaylist, playlistOfTopX, playlistOfNotTopX, playlistOfScoresBelowGivenAccuracy } from './main';

async function noTopLevelAsyncAwait() {
    writePlaylist(await playlistOfNumber1s('76561198138161802'));
}

noTopLevelAsyncAwait();