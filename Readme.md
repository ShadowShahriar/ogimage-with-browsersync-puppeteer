# ogimage-with-browsersync-puppeteer

> This repository demonstrates a basic approach to generating Open Graph Images from multiple files using [Puppeteer](https://pptr.dev/) and [Browsersync](https://browsersync.io/). It also shows how we can automate this task using GitHub Actions.

Generated Images from [src/posts](./src/posts) are stored in [assets/opengraph](./assets/opengraph). The server port, file path, and other settings can be customized by editing the [index.config.js](./index.config.js) file.

# Demo

Install NPM dependencies by entering,

```bash
	npm install
```

Then run the following command,

```bash
	node index.js
```

It should generate Open Graph Images in the [opengraph](./assets/opengraph) folder.
