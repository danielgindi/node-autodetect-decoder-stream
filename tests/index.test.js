const fs = require('fs');

const iconv = require('iconv-lite');
const streamBuffers = require('stream-buffers');

const AutoDetectDecoderStream = require('../');

describe('Autodetect Detector Stream', () => {
  let stream;
  let result;

  beforeAll(() => {
    iconv.getCodec('ascii'); // Force lazy loading of encoding before tests, otherwise it fails 
  });

  beforeEach(() => {
    stream = new streamBuffers.ReadableStreamBuffer();
    result = '';
  });

  test('Basic ASCII encoding', (done) => {
    const buffer = new Buffer([0x54, 0x65, 0x73, 0x74]);
    stream.pipe(new AutoDetectDecoderStream({ defaultEncoding: 'ascii' }))
      .on('data', (data) => {
        result += data;
      })
      .on('end', () => {
        expect(result).toEqual('Test');
        done();
      });
    stream.put(buffer);
    stream.stop();
  });

  test('No detection fallback to default encoding', (done) => {
    const buffer = new Buffer([0xBF, 0x54, 0x65, 0x73, 0x74]);
    stream.pipe(new AutoDetectDecoderStream({ defaultEncoding: 'utf8', minConfidence: 1 }))
      .on('data', (data) => {
        result += data;
      })
      .on('end', () => {
        expect(result).toEqual('�Test');
        done();
      });
    stream.put(buffer);
    stream.stop();
  });

  test('Empty stream returns empty data', (done) => {
    const buffer = new Buffer([]);
    stream.pipe(new AutoDetectDecoderStream({ defaultEncoding: 'ascii' }))
      .on('data', (data) => {
        result += data;
      })
      .on('end', () => {
        expect(result).toEqual('');
        done();
      });
    stream.put(buffer);
    stream.stop();
  });

  test('Unknown encoding emits error', (done) => {
    const buffer = new Buffer([]);
    stream.pipe(new AutoDetectDecoderStream({ defaultEncoding: 'cp99999' }))
      .on('error', (err) => {
        expect(err).not.toBeNull();
        done();
      });
    stream.put(buffer);
    stream.stop();
  });

  test('Collect callback', (done) => {
    const buffer = new Buffer([0x54, 0x65, 0x73, 0x74]);
    stream.pipe(new AutoDetectDecoderStream({ defaultEncoding: 'ascii' }))
      .collect((err, body) => {
        expect(err).toBeNull();
        expect(body).toEqual('Test');
        done();
      });
    stream.put(buffer);
    stream.stop();
  });

  test('Collect callback with error', (done) => {
    const buffer = new Buffer([]);
    stream.pipe(new AutoDetectDecoderStream({ defaultEncoding: 'cp99999' }))
      .collect((err, body) => {
        expect(err).not.toBeNull();
        expect(body).toBeUndefined();
        done();
      });
    stream.put(buffer);
    stream.stop();
  });
});