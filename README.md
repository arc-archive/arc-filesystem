# arc-filesystem

A module with components and mixin function that adds support for filesystem processing in Advanced REST client

[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-filesystem.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-filesystem)

[![Build Status](https://travis-ci.org/advanced-rest-client/arc-filesystem.svg)](https://travis-ci.org/advanced-rest-client/arc-filesystem)

## Usage

### Installation

```sh
npm install --save @advanced-rest-client/arc-filesystem
```

### ArcFileDropMixin

A mixin with common function used to drag and drop file import in Advanced REST Client.

```js
import { LitElement, html } from 'lit-element';
import { ArcFileDropMixin } from '@advanced-rest-client/arc-filesystem';

class SampleElement extends ArcFileDropMixin(LitElement) {
  render() {
    return html`
    <h1>Drop file here</h1>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

## Development

```sh
git clone https://github.com/advanced-rest-client/arc-filesystem
cd arc-filesystem
npm install
```

### Running the tests

```sh
npm test
```
