import {Fetcher} from "../Fetcher";

export class _PatreonConnector
{
	public static Instance = new _PatreonConnector();

	public async fetchUser(accessToken: string)
	{
		return await Fetcher.doGet<any>("https://www.patreon.com/api/oauth2/api/current_user", {
			headers: {
				authorization: `Bearer ${accessToken}`
			}
		});
	}

	public async getSubscriberLevel(userId: string | null, accessToken: string | null): Promise<string[]>
	{
		let levels: string[] = [];

		if (!userId || !accessToken)
		{
			return levels;
		}

		const profileInfo = await this.fetchUser(accessToken);

		if(profileInfo.errors)
		{
			throw new Error(profileInfo.errors);
		}

		if (profileInfo && !profileInfo.errors && profileInfo.included && profileInfo.data.relationships && profileInfo.data.relationships.pledges)
		{
			let pledgeIds = profileInfo?.data?.relationships?.pledges?.data?.map((p: any) => p?.id) ?? [];
			pledgeIds = pledgeIds.filter((a: any) => !!a);
			if (pledgeIds && pledgeIds.length)
			{
				const pledges = profileInfo.included.filter((i: any) => i.type === "pledge" && pledgeIds.includes(i.id));
				const rewardIds = pledges.map((p: any) => p.relationships?.reward?.data?.id);
				const rewards = rewardIds.map((r: any) => profileInfo.included.find((i: any) => i?.type === "reward" && i?.id === r));
				levels = rewards.map((r: any) => r.attributes.title);
			}
		}

		return levels;
	}
}

export const PatreonConnector = _PatreonConnector.Instance;