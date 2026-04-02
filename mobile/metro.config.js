const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [projectRoot, workspaceRoot];

// Add ngraph.graph from workspace root
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'ngraph.graph': path.resolve(workspaceRoot, 'node_modules/ngraph.graph'),
};

// Disable lazy imports to avoid lazy module loading issues with Hermes
config.resolver.lazyImports = false;

// Force eager bundling (no code splitting)
config.maxWorkers = 1;

module.exports = config;
