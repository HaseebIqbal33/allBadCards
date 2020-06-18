import * as winston from "winston";

require('log-timestamp');

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	defaultMeta: {service: 'user-service'},
	transports: [
		new winston.transports.Console({
			format: winston.format.simple()
		})
	]
});


export const logMessage = (...input: any[]) =>
{
	logger.info(input);
};

export const logWarning = (...input: any[]) =>
{
	logger.warn(input);
};

export const logError = (...input: any[]) =>
{
	logger.error(JSON.stringify(input, null, 2));
};