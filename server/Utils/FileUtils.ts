import * as path from "path";
import fs from "fs";

export const loadFileAsJson = <T extends any>(relativePath: string): any => {
	const filePath = path.resolve(process.cwd(), relativePath);
	const stringFile = fs.readFileSync(filePath, "utf8");
	return JSON.parse(stringFile) as T;
};