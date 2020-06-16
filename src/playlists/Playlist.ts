import Song from "./Song";

export default class Playlist {
    public playlistTitle: string;
    public playlistAuthor: string;
    public playlistDescription: string;
    public image: string;
    public songs: Song[];

    constructor(playlistTitle: string, playlistAuthor: string, image: string, songs: Song[], playlistDescription?: string) {
        this.playlistTitle = playlistTitle;
        this.playlistAuthor = playlistAuthor;
        this.playlistDescription = playlistDescription ? playlistDescription : "";
        this.image = image;
        this.songs = songs;
    }
}