export default interface Song {
    songName: string;
    levelAuthorName: string;
    hash: string;
    levelid: string;
    difficulties?: [{characteristic: string; name: string}];
}