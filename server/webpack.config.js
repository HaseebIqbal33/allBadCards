const webpack = require("webpack");
const path = require('path');
const fs = require('fs');
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
const entryPath = resolveApp("server/server.ts");

const portEnvMap = {
    local: 5000,
    prod: 8080,
    beta: 8080
};

module.exports = (serverEnv, outputDir) => ({
    entry: entryPath,
    target: "node",
    mode: "production",
    devtool: "inline-source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    optimization: {
        minimize: false
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'server.js',
        path: path.resolve(outputDir, "server")
    },
    plugins: [
        new FriendlyErrorsWebpackPlugin(),
        new webpack.DefinePlugin({
            __SERVER_ENV__: `\"${serverEnv}\"`,
            __PORT__: portEnvMap[serverEnv],
            __VERSION__: Date.now(),
            __OUTPUT_DIR__: JSON.stringify(outputDir)
        })
    ]
});