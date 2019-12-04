![ODIN](assets/logo_font_75.png)

# __ODIN__: Open Source __C2IS__

[![Build Status: Linux](https://travis-ci.org/syncpoint/ODIN.svg?branch=develop)](https://travis-ci.org/syncpoint/ODIN.svg?branch=develop)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

While currently in its early infancy, ODIN aims to become an Open Source alternative to industry-led commercial Command and Control Information Systems. Our main goal is __simplicity__. Coming from a military background, we think it's time for a paradigm shift. Together with a vibrant community, we want to lead the way towards lightweight and user-friendly systems.

![ODIN C2IS](assets/splash-004.png?raw=true)

## Contributing
If you are interested in raising ODIN to become big and strong, there are several ways you can help: Feature request, bugs and other backlog items can be reported in the [issues section](https://github.com/syncpoint/ODIN/issues) of the repository. Pull requests are also highly appreciated. And finally, any form of testing and feedback is welcome.

Please also see our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting started
Clone repository, install dependencies then build and start the application.

1. `git clone https://github.com/syncpoint/ODIN.git`
2. `npm install`
3. `npm run webpack; npm start`

### Binaries
To create Windows or macOS binaries, webpack first for production, then build package with electron-builder.

1. `npm run webpack:production`
2. `npm run builder:win` or `npm run builder:mac`

### Development mode (hot deployment for renderer only)
Create main and renderer bundles first, then start development server (for renderer only).

1. `npm run webpack`
2. `npm run hot`


## The missing manual
We had no time to come up with a user's manual so far. But eventually we will get there...
In the meantime, here is some information which might come in handy at some point.

You can here find a cheatsheet showing the keyboard shortcuts

  - [English Cheatsheet](https://syncpoint.github.io/ODIN/kb_shortcuts_cheat_en.pdf)
  - [German Cheatsheet](https://syncpoint.github.io/ODIN/kb_shortcuts_cheat_de.pdf)

### Resetting application state
You might want to/or are forced to reset stored application data, or example in the case of an unrecoverable error which is based on invalid application data.

Data stored in user-specific application directory include
* Booksmarks
* Layers and features incl. their geometry and other information
* Current map center and zoom level
* Visibility of different things like labels, tile layer and so on
* And other options like line smoothing, HiDPI support and more

To delete application data simply delete the entire `odin-c2is` application data directory __after closing the application__. The locations are for
* Windows: `%APPDATA%\odin-c2is` (e.g. `C:\Users\{your-user}\AppData\Roaming\odin-c2is`)
* macOS: `~/Library/Application\ Support/odin-c2is`

### REST interface
Currently, the application exposes one REST endpoint to import layers in GeoJSON format.
The interface is bound to port 8001 on localhost.

```
METHOD
  POST /layer/:name - import layer

PARAMETERS
  :name - layer name

BODY
  GeoJSON feature collection.
  Feature geometries are expected in EPSG:4326 (WGS84) projection (long/lat format).
  A range of APP6/2525 symbol modifiers are supported as feature properties,
  such as 'm', 'n' 't', 'w', etc. A special property 'sidc' is used to supply a 15 character
  symbol identification. Where possible generic graphics are rendered when SIDC is not
  supplied.

DESCRIPTION
  Import a layer with given name.
  Either creates a new layer or replaces an existing layer.

EXAMPLE
  Import layer from a file.

  curl -H "Content-Type: application/json" \
    -X POST \
    -d @examples/scenario-002.json \
    http:/localhost:8001/layer/SCENARIO-2
```

## License

Copyright (c) Syncpoint GmbH. All rights reserved.

Licensed under the [MIT](LICENSE) License.

When using the ODIN or other GitHub logos, be sure to follow the [GitHub logo guidelines](https://github.com/logos).