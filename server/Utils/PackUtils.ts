import {IBlackCardDefinition, ICardPackDefinition, ICustomPackDataInput} from "../Engine/Games/Game/GameContract";
import shortid from "shortid";

export const packInputToPackDef = (packInput: ICustomPackDataInput) =>
{
	const whiteTotal = packInput.whiteCards.length;
	const blackTotal = packInput.blackCards.length;

	const black: IBlackCardDefinition[] = packInput.blackCards.map(bc =>
	{
		const anwerArray = (bc.match(/_/g) ?? ["_"]);
		const pick = anwerArray.length;

		return {
			pick,
			draw: Math.max(1, pick - 1),
			content: bc
		};
	});

	const packDef: ICardPackDefinition = {
		white: packInput.whiteCards,
		black,
		pack: {
			name: packInput.packName,
			id: packInput.id ?? shortid()
		},
		quantity: {
			white: whiteTotal,
			black: blackTotal,
			total: whiteTotal + blackTotal
		}
	};

	return packDef;
};