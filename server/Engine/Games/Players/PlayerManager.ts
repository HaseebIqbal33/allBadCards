import {GamePlayer} from "../Game/GameContract";
import {IAuthContext} from "../../Auth/UserContract";

class _PlayerManager
{
	public static Instance = new _PlayerManager();

	public createPlayer(authContext: IAuthContext, playerGuid: string, nickname: string, isSpectating: boolean, isRandom: boolean): GamePlayer
	{
		return {
			isSubscriber: authContext.levels.length > 0,
			levels: authContext.levels,
			guid: playerGuid,
			whiteCards: [],
			nickname,
			wins: 0,
			isSpectating,
			isRandom,
			isIdle: false,
			kickedForTimeout: false,
			isApproved: isRandom ? true : null
		};
	}
}

export const PlayerManager = _PlayerManager.Instance;