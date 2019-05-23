module.exports = {
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "env": {
    "browser": true,
    "es6": true,
    "node": true,
    "mocha": true
  },
  // "extends": "standard",
  "extends": ["eslint:recommended", "plugin:react/recommended", "standard"],
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly"
  },
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 2018,
    "sourceType": "module"
  },
  "plugins": [
    "react"
  ],
  "rules": {
    "no-console": "off",
    "no-multiple-empty-lines": "off",
    "padded-blocks": "off",
    "react/display-name": "off"
  }
}
