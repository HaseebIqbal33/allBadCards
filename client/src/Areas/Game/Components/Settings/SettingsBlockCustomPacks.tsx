import React, {useEffect, useState} from "react";
import {GameDataStore} from "../../../../Global/DataStore/GameDataStore";
import {useDataStore} from "../../../../Global/Utils/HookUtils";
import {Platform} from "../../../../Global/Platform/platform";
import {AuthDataStore} from "../../../../Global/DataStore/AuthDataStore";
import {ErrorDataStore} from "../../../../Global/DataStore/ErrorDataStore";
import {Button, Divider, List, ListItem, ListItemSecondaryAction, ListItemText, Switch, TextField, Typography} from "@material-ui/core";
import {ICustomCardPack, ICustomPackSearchResult} from "../../../../Global/Platform/Contract";
import {Link} from "react-router-dom";
import {SiteRoutes} from "../../../../Global/Routes/Routes";


export const SettingsBlockCustomPacks: React.FC = () =>
{
	const authState = useDataStore(AuthDataStore);
	const gameData = useDataStore(GameDataStore);
	const [favs, setFavs] = useState<ICustomPackSearchResult | null>(null);
	const [packCode, setPackCode] = useState("");

	useEffect(() =>
	{
		if (authState.authorized)
		{
			Platform.getMyFavoritePacks()
				.then(data =>
				{
					setFavs(data.result);
				})
				.catch(ErrorDataStore.add);
		}
	}, []);

	const onPacksChange = (event: React.ChangeEvent<HTMLInputElement>) =>
	{
		const newPacks = event.target.checked
			? [...gameData.ownerSettings?.includedCustomPackIds, event.target.name]
			: gameData.ownerSettings.includedCustomPackIds.filter(a => a !== event.target.name);
		GameDataStore.setIncludeCustomPacks(newPacks);
	};

	const addPackCode = () =>
	{
		Platform.getPack(packCode)
			.then(data =>
			{
				GameDataStore.setIncludeCustomPacks([
					...gameData.ownerSettings?.includedCustomPackIds,
					data.definition.pack.id
				])
			})
			.catch(ErrorDataStore.add);

		setPackCode("");
	};

	const customPacksNotFavs = gameData.ownerSettings?.includedCustomPackIds?.filter(pid => !favs?.packs.find(p => p.definition.pack.id === pid));

	return (
		<>
			<Typography variant={"h6"}>Saved Packs</Typography>
			<Typography variant={"subtitle1"}>
				<Link to={SiteRoutes.PacksBrowser.resolve()}>Custom Packs</Link> you save will automatically be included in new games (log in required)
			</Typography>
			<List style={{width: "75vw", maxWidth: "40rem"}}>
				{favs?.packs?.map(pack =>
				{
					const isEnabled = gameData.ownerSettings?.includedCustomPackIds?.includes(pack.definition.pack.id);
					return (
						<PackListItem
							isEnabled={isEnabled}
							onPacksChange={onPacksChange}
							pack={pack}
						/>
					)
				})}
			</List>
			<Divider style={{margin: "1rem 0"}}/>
			<div>
				<Typography variant={"h6"}>Or add by pack code</Typography>
				<Typography variant={"subtitle1"} style={{paddingBottom: "1rem"}}>
					Browse <Link to={SiteRoutes.PacksBrowser.resolve()}>Custom Packs</Link> to find a pack you like, copy its code, and add it here
				</Typography>
				<TextField color={"secondary"} value={packCode} style={{margin: "0 1rem 1rem 0"}} size={"small"} onChange={e => setPackCode(e.target.value)} id="outlined-basic" label="Pack Code" variant="outlined"/>
				<Button variant={"contained"} color={"secondary"} onClick={addPackCode} disabled={packCode.length < 5}>
					Add Pack
				</Button>
				<Divider/>
				<List style={{width: "75vw", maxWidth: "40rem"}}>
					{customPacksNotFavs?.map(packId =>
					{
						const isEnabled = gameData.ownerSettings?.includedCustomPackIds?.includes(packId);
						const pack = gameData.customPackDefs?.[packId];
						if(!pack)
						{
							return null;
						}

						return (
							<PackListItem
								isEnabled={isEnabled}
								onPacksChange={onPacksChange}
								pack={pack}
							/>
						);
					})}
				</List>
			</div>
		</>
	);
};

interface PackListItemProps
{
	pack: ICustomCardPack;
	onPacksChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	isEnabled: boolean;
}

const PackListItem: React.FC<PackListItemProps> = (
	{
		pack,
		children,
		onPacksChange,
		isEnabled
	}
) =>
{
	return (

		<ListItem>
			<ListItemText
				primary={pack.definition.pack.name}
				secondary={<>
					P: <strong>{pack.definition.quantity.black}</strong> // R: <strong>{pack.definition.quantity.white}</strong> // {pack.isNsfw ? "NSFW" : "SFW"}
				</>}
			/>
			<ListItemSecondaryAction>
				<Switch
					onChange={onPacksChange}
					name={pack.definition.pack.id}
					checked={isEnabled}
				/>
			</ListItemSecondaryAction>
		</ListItem>
	);
};