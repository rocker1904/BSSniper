// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { writePlaylist, playlistOfNumber1s, percentageOfNMumber1s, snipePlaylist, rankingQueuePlaylist, playlistOfTopX, playlistOfNotTopX, playlistOfScoresBelowGivenAccuracy, CachedPlayer, getPlayerData, playlistByPercievedWorstScore, playlistByCombo, playlistOfNumber1sWithinXMonths } from './main';

async function noTopLevelAsyncAwait() {
    const pandita = await getPlayerData('76561198186151129');
    await writePlaylist(await playlistOfNumber1sWithinXMonths(pandita, 5));
    // void writePlaylist(await rankingQueuePlaylist());
    console.log('Done!');
}

void noTopLevelAsyncAwait();
