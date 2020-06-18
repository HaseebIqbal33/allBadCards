'use strict';
const path = require('path');
const fs = require('fs-extra');
const Seven = require("node-7z");
const sevenBin = require('7zip-bin');

const appDirectory = fs.realpathSync(process.cwd());
const resolve = relativePath => path.resolve(appDirectory, relativePath);

const finalize = (buildName, buildDir, outputDir) => {
    fs.mkdir(path.resolve(outputDir, "./config"));
    fs.mkdir(path.resolve(outputDir, "server/data"));
    fs.mkdir(path.resolve(outputDir, ".ebextensions"));
    fs.mkdir(path.resolve(outputDir, "./cardcast-packs"));

    fs.copySync(resolve("./.ebextensions"), path.resolve(buildDir, "./.ebextensions"));
    fs.copySync(resolve("client/build"), path.resolve(outputDir, "client"), {dereference: true});
    fs.copySync(resolve("cardcast-packs"), path.resolve(outputDir, "./cardcast-packs"), {dereference: true});
    fs.copyFileSync(resolve("config/keys.json"), path.resolve(outputDir, "config/keys.json"));
    fs.copySync(resolve("server/data"), path.resolve(outputDir, "server/data"));
    fs.copyFileSync(resolve("server/package.json"), path.resolve(buildDir, "package.json"));
    fs.copyFileSync(resolve("server/.env"), path.resolve(outputDir, "./.env"));

    const zipPath = path.resolve(buildDir, "../" + buildName + ".zip");
    const toAdd = path.resolve(buildDir, "./*.*");
    Seven.add(zipPath, toAdd, {
        recursive: true,
        $bin: sevenBin.path7za,
    });
};

module.exports = {
    finalize
};