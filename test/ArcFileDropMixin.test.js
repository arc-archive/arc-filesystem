/* eslint-disable no-param-reassign */
import { fixture, assert, html, nextFrame } from '@open-wc/testing';
import sinon from 'sinon';
import { DataImportEventTypes, ProcessEventTypes, RestApiEventTypes } from '@advanced-rest-client/arc-events';
import './test-element.js';
import { dragEnterHandler, dragLeaveHandler, dragOverHandler, dropHandler, processEntries, notifyApiParser } from '../src/ArcFileDropMixin.js';

/** @typedef {import('./test-element').TestElement} TestElement */

describe('ArcFileDropMixin', () => {
  /**
   * @returns {Promise<TestElement>}
   */
  async function basicFixture() {
    return fixture(html`<test-element></test-element>`);
  }

  describe('Basics', () => {
    /**
     * @param {File=} file 
     * @return {DragEvent}
     */
    function createEventObject(file) {
      const e = new Event('event', { cancelable: true });
      const dt = {};
      if (file) {
        dt.files = [file];
        dt.types = ['Files'];
      } else {
        dt.types = /** @type string[] */ ([]);
      }
      // @ts-ignore
      e.dataTransfer = dt;
      return /** @type DragEvent */ (e);
    }

    let element = /** @type TestElement */ (null);
    let file;
    beforeEach(async () => {
      element = await basicFixture();
    });

    before(() => {
      file = new Blob(['{}'], { type: 'application/json' });
    });

    it('Sets dragging on drag enter', () => {
      const e = createEventObject(file);
      element[dragEnterHandler](e);
      assert.isTrue(element.dragging);
    });

    it('Sets dragging attribute', async () => {
      const e = createEventObject(file);
      element[dragEnterHandler](e);
      await nextFrame();
      assert.isTrue(element.hasAttribute('dragging'));
    });

    it("Won't set dragging when no files", () => {
      const e = createEventObject();
      element[dragEnterHandler](e);
      assert.isUndefined(element.dragging);
    });

    it('drag enter cancels the event', () => {
      const e = createEventObject(file);
      element[dragEnterHandler](e);
      assert.isTrue(e.defaultPrevented);
    });

    it('Removes dragging on drag leave', () => {
      element[dragLeaveHandler](createEventObject(file));
      assert.isFalse(element.dragging);
    });

    it('Ignores dragleave event when no files', () => {
      element[dragLeaveHandler](createEventObject());
      assert.isUndefined(element.dragging);
    });

    it('drag leave cancels the event', () => {
      const e = createEventObject(file);
      element[dragLeaveHandler](e);
      assert.isTrue(e.defaultPrevented);
    });

    it('drag over cancels the event', () => {
      const e = createEventObject(file);
      element[dragOverHandler](e);
      assert.isTrue(e.defaultPrevented);
    });

    it('Ignores drag over when no files', () => {
      const e = createEventObject();
      element[dragOverHandler](e);
      assert.isFalse(e.defaultPrevented);
    });

    it('drop cancels the event', () => {
      const e = createEventObject(file);
      element[dropHandler](e);
      assert.isTrue(e.defaultPrevented);
    });

    it('Ignores drop when no files', () => {
      const e = createEventObject();
      element[dropHandler](e);
      assert.isFalse(e.defaultPrevented);
    });

    it("Ignores the event when there's no file", () => {
      const e = createEventObject();
      const spy = sinon.spy(element, processEntries);
      element[dropHandler](e);
      assert.isFalse(spy.called);
    });

    it(`dispatches ${DataImportEventTypes.processfile} event`, () => {
      const e = createEventObject(file);
      const spy = sinon.spy();
      element.addEventListener(DataImportEventTypes.processfile, spy);
      element[dropHandler](e);
      assert.isTrue(spy.calledOnce);
    });

    it(`dispatches ${ProcessEventTypes.loadingerror} event when import error`, async () => {
      const e = createEventObject(file);
      const spy = sinon.spy();
      element.addEventListener(ProcessEventTypes.loadingerror, spy);
      element.addEventListener(DataImportEventTypes.processfile, (ev) => {
        e.preventDefault();
        // @ts-ignore
        ev.detail.result = Promise.reject(new Error('test'));
      });
      await element[dropHandler](e);
      assert.isTrue(spy.calledOnce);
    });

    it(`does not dispatch ${ProcessEventTypes.loadingerror} event when import handled`, async () => {
      const e = createEventObject(file);
      const spy = sinon.spy();
      element.addEventListener(ProcessEventTypes.loadingerror, spy);
      element.addEventListener(DataImportEventTypes.processfile, (ev) => {
        e.preventDefault();
        // @ts-ignore
        ev.detail.result = Promise.resolve();
      });
      await element[dropHandler](e);
      assert.isFalse(spy.called);
    });
  });

  describe('[notifyApiParser]()', () => {
    let element = /** @type TestElement */ (null);
    let file;
    beforeEach(async () => {
      element = await basicFixture();
      file = new Blob(['{}'], { type: 'application/json' });
    });

    function handler(e) {
      e.preventDefault();
      e.detail.result = Promise.resolve({
        model: 'test-value',
        type: 'x-api',
      });
    }

    it(`dispatches ${RestApiEventTypes.dataready} when finished`, async () => {
      const spy = sinon.spy();
      element.addEventListener(RestApiEventTypes.dataready, spy);
      element.addEventListener(RestApiEventTypes.processfile, handler);
      await element[notifyApiParser](file);
      assert.isTrue(spy.called, 'Event dispatched');
      assert.deepEqual(spy.args[0][0].detail, { model: 'test-value', type: 'x-api' });
    });

    it('rejects the promise when event not handled', async () => {
      let message;
      try {
        await element[notifyApiParser](file);
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'API processor not available');
    });
  });

  describe('[processEntries]()', () => {
    let element = /** @type TestElement */ (null);
    let files;
    const acceptedType = 'application/json';

    function apiHandler(e) {
      e.preventDefault();
      e.detail.result = Promise.resolve({
        model: 'test-value',
        type: 'x-api',
      });
    }

    function importHandler(e) {
      e.preventDefault();
      e.detail.result = Promise.resolve('test-value');
    }

    beforeEach(async () => {
      element = await basicFixture();
      element.addEventListener(RestApiEventTypes.processfile, apiHandler);
    });

    afterEach(() => {
      element.removeEventListener(RestApiEventTypes.processfile, apiHandler);
    });

    [
      'application/zip',
      'application/yaml',
      'application/x-yaml',
      'application/raml',
      'application/x-raml',
      'application/x-zip-compressed'
    ].forEach((item) => {
      it(`Calls [notifyApiParser]() when type is ${item}`, async () => {
        const spy = sinon.spy(element, notifyApiParser);
        files = [new Blob(['***'], { type: item })];
        // @ts-ignore
        await element[processEntries](files);
        assert.isTrue(spy.called);
        assert.isTrue(spy.args[0][0] === files[0]);
      });
    });

    it(`dispatches ${DataImportEventTypes.processfile} for other types`, async () => {
      const spy = sinon.spy();
      element.addEventListener(DataImportEventTypes.processfile, spy);
      element.addEventListener(DataImportEventTypes.processfile, importHandler);
      files = [new Blob(['{}'], { type: acceptedType })];
      // @ts-ignore
      await element[processEntries](files);
      element.removeEventListener(DataImportEventTypes.processfile, importHandler);
      assert.isTrue(spy.called);
    });

    it(`dispatches process error when ${DataImportEventTypes.processfile} error`, async () => {
      element.addEventListener(DataImportEventTypes.processfile, (e) => {
        // @ts-ignore
        e.detail.result = Promise.reject(new Error('test'));
      });
      files = [new Blob(['{}'], { type: acceptedType })];
      const spy = sinon.spy();
      element.addEventListener(ProcessEventTypes.loadingerror, spy);
      // @ts-ignore
      await element[processEntries](files);
      assert.isTrue(spy.called);
    });
  });
});