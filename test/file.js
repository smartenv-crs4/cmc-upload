const supertest = require('supertest');
const should = require('should');
const fs = require("fs");
const port = process.env.PORT || 3000;
const baseUrl = "http://localhost:" + port;
const prefix = '/api/v1/';
const request = supertest.agent(baseUrl);

process.env.NODE_ENV='test'; //WARNING testing in test mode, no token check

const init = require('../lib/init');

describe('--- Testing Upload ---', () => {
  let testFile1 = { path: './test/resources/logo_crs4.png', size:0, label:'F1'};
  let testFile2 = { path: './test/resources/logo_crs4_big.png', size:0, label:'F2'};
  let new_img = null;

  before((done) => {
    testFile1.size = fs.statSync(testFile1.path).size;
    testFile2.size = fs.statSync(testFile2.path).size;
    init.start(() => {done()});
  });


  after((done) => {
    init.stop(() => {done()});
  });


  describe('POST /file/', () => {
    it('respond with json Object containing the id of the stored resource', (done) => {
      request
        .post( prefix + 'file')
        .attach(testFile1.label, testFile1.path)
        .attach(testFile2.label, testFile2.path)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err ,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("filecode");
            new_img = res.body.filecode;
            res.body.should.have.property("failed");
            res.body.failed.length.should.be.equal(0);
            done();
          }
        });
    });
  });



  describe('GET /file/:id', () => {
    it('download one of the previously uploaded test images and check its size with the original', (done) => {
      request
        .get(prefix + 'file/' + new_img + '?tag=' + testFile1.label) 
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
        .get(prefix + 'file/aaaaaaaaaaaaaaaaaaaaaaaa/?tag=' + testFile1.label) 
        .expect(404)
        .end((err,res) => {
          if(err) done(err);
          else done();
        });
    });
  });

  describe('DELETE /file/:id', () => {
    it('delete test images', (done) => {
      request
        .delete(prefix + 'file/' + new_img)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else done();
        });
    });
    it('respond with badRequest error (400) malformed resource id', (done) => {
      request
        .delete(prefix + 'file/fakeid')
        .expect(400)
        .end((err,res) => {
          if(err) done(err);
          else done();
        });
    });
    it('respond with not found error (404)', (done) => {
      request
        .delete(prefix + 'file/aaaaaaaaaaaaaaaaaaaaaaaa')
        .expect(404)
        .end((err,res) => {
          if(err) done(err);
          else done();
        });
    });
  });

});
