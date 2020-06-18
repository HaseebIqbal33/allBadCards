import {Validator} from "jsonschema";
import {JSONSchema4} from "json-schema";

export const AbcPackSchema: JSONSchema4 = {
	"$schema": "http://json-schema.org/draft-04/schema#",
	"type": "object",
	"properties": {
		"packName": {"type": "string"},
		"blackCards": {
			"type": "array",
			"items": {"type": "string"}
		},
		"whiteCards": {
			"type": "array",
			"items": {"type": "string"}
		}
	},
	"required": ["packName", "blackCards", "whiteCards"]
};

const validator = new Validator();

export const validatePackInput = (packData: any) =>
{
	return validator.validate(packData, AbcPackSchema);
};

export const getSchemas = () => validator.schemas;