// Tailwind CSS v4 compatibility shim for HeroUI
// HeroUI expects Tailwind v3 plugin API, but we're using v4
// This shim provides a compatible interface

// In Tailwind v4, the plugin API has changed
// For now, we'll create a minimal plugin function that satisfies the interface
// HeroUI components should still work as they don't rely heavily on plugin customization

const plugin = function (handler, config) {
  // Return a plugin-like object that Tailwind v4 can handle
  return {
    handler: handler || (() => {}),
    config: config || {},
  };
};

// Add the withOptions method that some plugins use
plugin.withOptions = function (pluginFunction, configFunction = () => ({})) {
  const optionsFunction = function (options = {}) {
    return {
      handler: pluginFunction(options),
      config: configFunction(options),
    };
  };

  optionsFunction.__isOptionsFunction = true;
  optionsFunction.__pluginFunction = pluginFunction;
  optionsFunction.__configFunction = configFunction;

  return optionsFunction;
};

module.exports = plugin;
