#!/bin/bash
yarn install
cd server
yarn install
cd ../client
yarn install
cd ../
yarn build
cd builds
unzip *.zip