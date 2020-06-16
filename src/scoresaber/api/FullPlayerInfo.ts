import Badge from "./Badge";

export default interface FullPlayerInfo {
    playerId: number;
    pp: number;
    banned: number;
    inactive: number;
    name: string;
    country: string;
    role: string;
    badges: Badge[];
    history: string;
    permissions: number;
    avatar: string;
    rank: number;
    countryRank: number;
}