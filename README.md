
# There is exciting news at ODIN - C2IS: We have released the successor to ODIN: [ODINv2](https://github.com/syncpoint/ODINv2)

[![Build Status: Linux](https://travis-ci.org/syncpoint/ODIN.svg?branch=develop)](https://travis-ci.org/syncpoint/ODIN.svg?branch=develop)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-white.svg)](https://snapcraft.io/odin-c2is)

While currently in its early infancy, ODIN aims to become an Open Source alternative to industry-led commercial Command and Control Information Systems. Our main goal is __simplicity__. Coming from a military background, we think it's time for a paradigm shift. Together with a vibrant community, we want to lead the way towards lightweight and user-friendly systems.

For details and tutorials please visit the [ODIN project website](https://odin.syncpoint.io).

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

## License

Copyright (c) Syncpoint GmbH. All rights reserved.

Licensed under the [MIT](LICENSE) License.

When using the ODIN or other GitHub logos, be sure to follow the [GitHub logo guidelines](https://github.com/logos).
