/*
 ############################################################################
 ############################### GPL III ####################################
 ############################################################################
 *                         Copyright 2017 CRS4                                 *
 *    This file is part of CRS4 Microservice Core - Upload (CMC-Upload).      *
 *                                                                            *
 *     CMC-Upload is free software: you can redistribute it and/or modify     *
 *     it under the terms of the GNU General Public License as published by   *
 *       the Free Software Foundation, either version 3 of the License, or    *
 *                    (at your option) any later version.                     *
 *                                                                            *
 *     CMC-Upload is distributed in the hope that it will be useful,          *
 *      but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *       MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the        *
 *               GNU General Public License for more details.                 *
 *                                                                            *
 *     You should have received a copy of the GNU General Public License      *
 *    along with CMC-Upload.  If not, see <http://www.gnu.org/licenses/>.    *
 * ############################################################################
 */


const supertest = require('supertest');
const should = require('should');
const fs = require("fs");
const port = process.env.PORT || 3000;
const baseUrl = "http://localhost:" + port + "/";
const request = supertest.agent(baseUrl);

process.env.NODE_ENV='test'; //WARNING testing in test mode, no token check

const init = require('../lib/init');

describe('--- Testing Upload ---', () => {
  const config = require('../config/default.json');
  const maxFileSize = config.test ? config.test.sizeLimit : config.production.sizeLimit;

  let testFile1     = { path: 'fake1', data: new Buffer(maxFileSize - 10), size: maxFileSize - 10,  label:'F1'};
  let testFile2     = { path: 'fake2', data: new Buffer(maxFileSize - 100), size: maxFileSize - 100, label:'F2'};
  let testOversize  = { path: 'fake3', data: new Buffer(maxFileSize + 10), size: maxFileSize + 10,  label:'Oversize'};
  let new_img = null;
  let fakeuidpar = "?fakeuid=a1a1a1a1a1a1a1a1a1a1a1a1"

  before((done) => {
    init.start(() => {done()});
  });

  after((done) => {
    init.stop(() => {done()});
  });

  describe('GET /', () => {
    it('respond with json Object containing ms name and version ', (done) => {
      request
        .get('')
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("ms");
            res.body.should.have.property("version");
            done();
          }
        });
    });
  });


  describe('POST /file/', () => {
    it('respond with json Object containing the id of the stored resource', (done) => {
      request
        .post( 'file' + fakeuidpar)
        .attach(testFile1.label, testFile1.data, testFile1.path)
        .attach(testFile2.label, testFile2.data, testFile2.path)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err ,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("filecode");
            new_img = res.body.filecode;
            res.body.should.have.property("failed");
            res.body.failed.length.should.be.equal(0);
            res.body.size.should.be.equal(testFile1.size + testFile2.size);
            done();
          }
        });
    });
    it('respond with 400 badRequest, filesize limit exceeded', (done) => {
      request.post('file' + fakeuidpar)
        .attach(testOversize.label, testOversize.data, testOversize.path)
        .expect(400)
        .end((err ,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property('message');
            res.body.message.should.match(/limit/);
            done();
          }
        });
    });
  });

  describe('GET /file/:id', () => {
    it('download one of the previously uploaded test file and check its size with the original', (done) => {
      request
        .get('file/' + new_img + '?tag=' + testFile1.label) 
        .expect(200)
        .end((err, res) => {
          if(err) done(err);
          else { 
            res.header.should.have.property('content-length');
            parseInt(res.header['content-length']).should.be.equal(testFile1.size);
            done();
          }
        });
    });
    it('respond with not found error (404)', (done) => {
      request
        .get('file/aaaaaaaaaaaaaaaaaaaaaaaa/?tag=' + testFile1.label) 
        .expect(404)
        .end((err,res) => {
          if(err) done(err);
          else done();
        });
    });
  });

  describe('DELETE /file/:id', () => {
    it('delete test files with not being the owner', (done) => {
      request
        .delete('file/' + new_img + "?fakeuid=a2a2a2a2a2a2a2a2a2a2a2a2")
        .expect(401)
        .end((err,res) => {
          if(err) done(err);
          else done();
        });
    });
    it('delete test files', (done) => {
      request
        .delete('file/' + new_img + fakeuidpar)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else done();
        });
    });
    it('respond with badRequest error (400) malformed resource id', (done) => {
      request
        .delete('file/fakeid' + fakeuidpar)
        .expect(400)
        .end((err,res) => {
          if(err) done(err);
          else done();
        });
    });
    it('respond with not found error (404)', (done) => {
      request
        .delete('file/aaaaaaaaaaaaaaaaaaaaaaaa' + fakeuidpar)
        .expect(404)
        .end((err,res) => {
          if(err) done(err);
          else done();
        });
    });
  });

});
