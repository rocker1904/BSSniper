import Badge from "./Badge";

export default interface PlayerInfo {
    playerId: number;
    playerName: string;
    avatar: string;
    rank: number;
    countryRank: number;
    pp: number;
    country: string;
    role: string;
    badges: Badge[];
    history: string;
    permissions: number;
    inactive: number;
    banned: number;
}