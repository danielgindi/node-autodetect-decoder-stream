const Iconv = require('iconv-lite');
const StreamBuffers = require('stream-buffers');
const AutoDetectDecoderStream = require('../');
const assert = require('assert');

describe('Autodetect Detector Stream', () => {
    let stream;
    let result;

    before(() => {
        Iconv.getCodec('ascii'); // Force lazy loading of encoding before tests, otherwise it fails
    });

    beforeEach(() => {
        stream = new StreamBuffers.ReadableStreamBuffer();
        result = '';
    });

    it('Basic ASCII encoding', (done) => {
        const buffer = Buffer.from([0x54, 0x65, 0x73, 0x74]);
        stream
            .pipe(new AutoDetectDecoderStream({defaultEncoding: 'ascii'}))
            .on('data', (data) => {
                result += data;
            })
            .on('end', () => {
                assert.strictEqual(result, 'Test');
                done();
            });
        stream.put(buffer);
        stream.stop();
    });

    it('No detection fallback to default encoding', (done) => {
        const buffer = Buffer.from([0xBF, 0x54, 0x65, 0x73, 0x74]);
        stream
            .pipe(new AutoDetectDecoderStream({defaultEncoding: 'utf8', minConfidence: 1}))
            .on('data', (data) => {
                result += data;
            })
            .on('end', () => {
                assert.strictEqual(result, '�Test');
                done();
            });
        stream.put(buffer);
        stream.stop();
    });

    it('Empty stream returns empty data', (done) => {
        const buffer = Buffer.alloc(0);
        stream
            .pipe(new AutoDetectDecoderStream({defaultEncoding: 'ascii'}))
            .on('data', (data) => {
                result += data;
            })
            .on('end', () => {
                assert.strictEqual(result, '');
                done();
            });
        stream.put(buffer);
        stream.stop();
    });

    it('Unknown encoding emits error', (done) => {
        const buffer = Buffer.alloc(0);
        stream
            .pipe(new AutoDetectDecoderStream({defaultEncoding: 'cp99999'}))
            .on('error', (err) => {
                assert.notStrictEqual(err, null);
                done();
            });
        stream.put(buffer);
        stream.stop();
    });

    it('Collect callback', (done) => {
        const buffer = Buffer.from([0x54, 0x65, 0x73, 0x74]);
        stream
            .pipe(new AutoDetectDecoderStream({defaultEncoding: 'ascii'}))
            .collect((err, body) => {
                assert.strictEqual(err, null);
                assert.strictEqual(body, 'Test');
                done();
            });
        stream.put(buffer);
        stream.stop();
    });

    it('Collect callback with error', (done) => {
        const buffer = Buffer.alloc(0);
        stream
            .pipe(new AutoDetectDecoderStream({defaultEncoding: 'cp99999'}))
            .collect((err, body) => {
                assert.notStrictEqual(err, null);
                assert.strictEqual(body, undefined);
                done();
            });
        stream.put(buffer);
        stream.stop();
    });
});