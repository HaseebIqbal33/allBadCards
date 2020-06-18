export class ArrayUtils
{
	public static shuffle = (array: any[]) =>
	{
		let counter = array.length;

		// While there are elements in the array
		while (counter > 0)
		{
			// Pick a random index
			let index = Math.floor(Math.random() * counter);

			// Decrease counter by 1
			counter--;

			// And swap the last element with it
			let temp = array[counter];
			array[counter] = array[index];
			array[index] = temp;
		}

		return array;
	};

	public static getRandomUnused = <T>(from: T[], used: T[]): [T, T[]] =>
	{
		const available = from.filter(a => !used.includes(a));
		const randomIndex = Math.floor(Math.random() * available.length);
		const newValue = available[randomIndex];
		const newUsed = [...used, newValue];
		return [newValue, newUsed];
	};

	public static flatten = <T extends any>(arr: any[]): T[] => {
		return arr.reduce((acc, val) => acc.concat(val), []);
	}
}