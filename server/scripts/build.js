const path = require('path');
const fs = require('fs-extra');

const finalize = require("./finalize");
const webpack = require("webpack");
const configFactory = require("../webpack.config");

const appDirectory = fs.realpathSync(process.cwd());
const resolve = relativePath => path.resolve(appDirectory, relativePath);
const serverEnv = process.argv.find(a => a.includes("serverenv")).split("=")[1];

const date = new Date();
const buildDirName = `build_${serverEnv}___${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}`;
const buildDir = resolve(`builds/${buildDirName}`);
const outputDir = path.resolve(buildDir, "output");

fs.mkdir(buildDir);

const compiler = webpack(configFactory(serverEnv, outputDir));
compiler.run((err, stats) => {
    finalize.finalize(buildDirName, buildDir, outputDir);
    console.log("Build is complete! Deleting build directory..");
    setTimeout(() => {
        fs.rmdir(buildDir, {recursive: true});
        console.log("Finished at " + (new Date()));
    }, 10000);
});
