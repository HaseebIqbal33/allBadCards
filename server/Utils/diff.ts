import * as _ from "lodash";

const isNullBlankOrUndefined = function (o: any)
{
	return (typeof o === "undefined" || o == null || o === "");
};

export const diff = function (object: any, base: any, ignoreBlanks = false) {
	if (!_.isObject(object) || _.isDate(object)) return object;         // special case dates
	return _.transform(object, (result: any, value: any, key: any) => {
		if (!_.isEqual(value, base[key])) {
			if (ignoreBlanks && isNullBlankOrUndefined(value) && isNullBlankOrUndefined( base[key])) return;
			result[key] = _.isObject(value) && _.isObject(base[key]) ? diff(value, base[key]) : value;
		}
	});
};