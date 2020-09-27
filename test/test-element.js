import { LitElement, html, css } from 'lit-element';
import { ArcFileDropMixin } from '../index.js';

export class TestElement extends ArcFileDropMixin(LitElement) {
  static get styles() {
    return css`:host {
      display: block;
    }`;
  }

  render() {
    return html``;
  }
}
window.customElements.define('test-element', TestElement);
