// PostCSS configuration for Next.js with Tailwind CSS v4
const path = require('path');

module.exports = {
  plugins: {
    // Use the full path to ensure the plugin is found
    [path.resolve(__dirname, 'node_modules/@tailwindcss/postcss')]: {},
  },
};
