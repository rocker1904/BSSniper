# BSSniper

A collection of useful functions for building Beat Saber playlists based on player scores.

General usage: Fetch player data for all relevant players, pass players to playlist functions, write playlists to file.

Example usage:
```typescript
const pandita = await getPlayerData('76561198186151129');
const number1sIn5Months = await playlistOfNumber1sWithinXMonths(pandita, 5);
void writePlaylist(number1sIn5Months);
```

To easily define additional playlist filters, `playlistByPredicate` can be used.

The predicate should be of the form `(playerScore: PlayerScore, index: number, playerScores: PlayerScore[]): boolean`.

For example, to filter to only number 1 scores:
```typescript
// Returns a playlist of all songs for which the given player has #1.
async function playlistOfNumber1s(cachedPlayer: CachedPlayer): Promise<Playlist> {
    const predicate: ScorePredicate = playerScore => playerScore.score.rank === 1;
    const playlistName: PlayerToPlaylistName = player => `${player.name}'s #1s`;
    return playlistByPredicate(cachedPlayer, predicate, playlistName);
}
```