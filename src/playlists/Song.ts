export default class Song {
    public songName: string;
    public hash: string;

    constructor(songName: string, hash: string) {
        this.songName = songName;
        this.hash = hash;
    }
}