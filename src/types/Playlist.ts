import Song from './Song';

export default interface Playlist {
    playlistTitle: string;
    playlistAuthor: string;
    playlistDescription: string;
    image: string;
    syncURL?: string;
    songs: Song[];
}
