# Heroic Tool
Tools to automate the process of development static sites.

Gulp, Jade, SASS, Bower, srvdir, Foundation

## Installation
First, ensure that you have the latest Node.js, npm and Bower installed.

```
git clone git@github.com:kozach/heroic-tool.git
cd heroic-tool
npm install
bower install
```
## Usage

```
gulp - generate development files
gulp watch - watch for changes and auto generate development files
gulp --env=prod - generate production files
gulp images-gen - replacing images optimized version of their
```
The resulting files are in the folder /build