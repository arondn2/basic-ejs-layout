'use strict';

const fs         = require('fs');
const path       = require('path');
const assert     = require('assert');
const expect     = require('chai').expect;
const express    = require('express');
const supertestp = require('supertest-as-promised');

const Layout = require('..');

describe('Layout', () => {

  describe('Layout.validateFilePath', () => {

    it('is invalid filePath', () => {
      try {
        Layout.validateFilePath();
      } catch (e) {
        expect(e.code).to.equal('INVALID_FILEPATH');
      }
    });

    it("filePath isn't a ejs file", () => {
      try {
        Layout.validateFilePath('file.html');
      } catch (e) {
        expect(e.code).to.equal('FILEPATH_IS_NOT_EJS');
      }
    });

  });

  describe('Layout.prototype.render', () => {

    it('basic', () => {

      const layout = new Layout();

      const filepathBase = '01-render';
      const fileapthEjs  = path.resolve(__dirname, 'views', filepathBase + '.ejs');
      const fileapthHTml = path.resolve(__dirname, 'views', filepathBase + '.html');
      const result       = layout.render(fileapthEjs, {}, {});
      const resultMustBe = fs.readFileSync(fileapthHTml, 'utf8');
      expect(result).to.equal(resultMustBe);

    });

    it("file doesn't exists", () => {

      const layout = new Layout();

      const filepathBase = 'no-exiting-file';
      const fileapthEjs  = path.resolve(__dirname, 'views', filepathBase + '.ejs');

      try {
        layout.render(fileapthEjs, {}, {});
        assert(false, 'a error must be throwed');
      } catch (err) {
        expect(err.code).to.equal('ENOENT');
      }

    });

  });

  describe('Layout.prototype.parent', () => {

    it('basic', () => {

      const layout = new Layout();

      const filepathBase = '02-parent';
      const fileapthEjs  = path.resolve(__dirname, 'views', filepathBase + '.ejs');
      const fileapthHTml = path.resolve(__dirname, 'views', filepathBase + '.html');
      const result       = layout.render(fileapthEjs, { layout }, {});
      const resultMustBe = fs.readFileSync(fileapthHTml, 'utf8');

      expect(result).to.equal(resultMustBe);

    });

  });

  describe('Layout.prototype.include', () => {

    it('basic', () => {

      const layout = new Layout();

      const filepathBase = '03-include';
      const fileapthEjs  = path.resolve(__dirname, 'views', filepathBase + '.ejs');
      const fileapthHTml = path.resolve(__dirname, 'views', filepathBase + '.html');
      const result       = layout.render(fileapthEjs, { layout }, {});
      const resultMustBe = fs.readFileSync(fileapthHTml, 'utf8');

      expect(result).to.equal(resultMustBe);

    });

  });

  describe('engine setup ok', () => {

    let forceTransformReturn = true;
    const app = express();
    let api, server;

    app.set('views', path.resolve(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.engine('ejs', Layout.engine({}, (locals, layout) => {
      if (forceTransformReturn) return locals;
    }));

    before((done) => {
      server = app.listen((err) => {
        api = supertestp('http://localhost:'+ server.address().port);
        done(err);
      });
    });

    it('response with a rendered view', (done) => {

      const fileapthEjs = '04-engine';
      const fileapthHTml = path.resolve(__dirname, 'views', fileapthEjs + '.html');
      const resultMustBe = fs.readFileSync(fileapthHTml, 'utf8');

      app.get('/', function (req, res) {
        res.render(fileapthEjs);
      });

      api.get('/')
      .expect('Content-Type', /text\/html/)
      .expect(200, resultMustBe, done);

    });

    it('return ok when transform return undefined', (done) => {

      forceTransformReturn = false;
      const fileapthEjs = '04-engine';
      const fileapthHTml = path.resolve(__dirname, 'views', fileapthEjs + '.html');
      const resultMustBe = fs.readFileSync(fileapthHTml, 'utf8');

      app.get('/', function (req, res) {
        res.render(fileapthEjs);
        forceTransformReturn = true;
      });

      api.get('/')
      .expect('Content-Type', /text\/html/)
      .expect(200, resultMustBe, done);

    });

    it('error rendering', (done) => {

      const fileapthEjs = '05-error';

      app.get('/error', function (req, res) {
        res.render(path.resolve(__dirname, 'views', fileapthEjs), () => {
          res.status(500).send('error');
        });
      });

      api.get('/error')
      .expect(500, done);

    });

    after(() => {
      server.close();
    });

  });

  describe('engine setup without globalsLocals', () => {

    it('engine setup first param can be a transform', () => {
      const app = express();
      app.set('view engine', 'ejs');
      app.engine('ejs', Layout.engine((locals, layout) => locals));
    });

  });

  describe('engine setup error', () => {

    it('error globalsLocals musb be a object', () => {

      const app = express();
      app.set('view engine', 'ejs');

      try {
        app.engine('ejs', Layout.engine('this is not a object'));
        assert(false, 'a error must be throwed');
      } catch (err) {
        expect(err.code).to.equal('INVALID_GLOBAL_LOCALS');
      }

    });

    it('error transform musb be a function', () => {

      const app = express();
      app.set('view engine', 'ejs');

      try {
        app.engine('ejs', Layout.engine({}, {}));
        assert(false, 'a error must be throwed');
      } catch (err) {
        expect(err.code).to.equal('INVALID_TRANSFORM_LOCALS_FUNCTION');
      }

    });

  });

});