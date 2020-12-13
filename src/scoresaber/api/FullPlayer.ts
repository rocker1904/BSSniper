import FullPlayerInfo from './PlayerInfo';
import ScoreStats from './ScoreStats';

export default interface FullPlayer {
    playerInfo: FullPlayerInfo;
    scoreStats: ScoreStats;
}