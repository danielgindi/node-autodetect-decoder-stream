"use strict";

const Iconv = require('iconv-lite');
const Jschardet = require('jschardet');
const Stream = require('stream');
const Transform = Stream.Transform;

class AutoDetectDecoderStream extends Transform {
    /**
     * @param {Object?} options
     * @param {string=utf8} options.defaultEncoding - What encoding to fall-back to? (Specify any `iconv-lite` encoding)
     * @param {number?} options.minConfidence - Minimum confidence to require for detecting encodings. @see {@link https://github.com/aadsm/jschardet|chardet module}
     * @param {number=128} options.consumeSize - How many bytes to use for detecting the encoding? (Default 128)
     * @param {boolean=true} options.stripBOM - Should strip BOM for UTF streams?
     * @constructor
     */
    constructor(options) {
        super({encoding: 'utf8'});

        options = options || {};

        this._defaultEncoding = options.defaultEncoding || 'utf8';
        this._minConfidence = options.minConfidence;
        this._consumeSize = options.consumeSize || 128;
        this._detectedEncoding = false;
        this._iconvOptions = {
            stripBOM: options.stripBOM == null ? true : options.stripBOM
        };

        this.encoding = 'utf8'; // We output strings.
    }

    /**
     * @param {Buffer?} chunk
     */
    _consumeBufferForDetection(chunk) {
        if (!this._detectionBuffer) {

            // Initialize buffer on first invocation
            this._detectionBuffer = Buffer.alloc(0);
        }

        if (chunk) {

            // Concatenate buffers until we get the minimum size we want
            this._detectionBuffer = Buffer.concat([this._detectionBuffer, chunk]);
        }

        // Do we have enough buffer?
        if (this._detectionBuffer.length >= this._consumeSize || !chunk) {

            try {

                // Try to detect encoding
                this._detectedEncoding = Jschardet.detect(this._detectionBuffer, {
					minimumThreshold: this._minConfidence
				}).encoding;

                if (!this._detectedEncoding || this._detectedEncoding === 'ascii') {
                    //noinspection ExceptionCaughtLocallyJS
                    throw new Error('Not enough data, recognized as ASCII. We probably need to use the fallback.');
                }

            } catch (e) {

                // Fallback
                this._detectedEncoding = this._defaultEncoding;

            }

            this.conv = Iconv.getDecoder(this._detectedEncoding, this._iconvOptions);

            const res = this.conv.write(this._detectionBuffer);
            delete this._detectionBuffer;

            if (res && res.length > 0) {
                this.push(res, this.encoding);
            }
        }
    }

    // noinspection JSUnusedGlobalSymbols
    _transform(chunk, encoding, done) {
        if (!Buffer.isBuffer(chunk))
            return done(new Error("Iconv decoding stream needs buffers as its input."));

        try {
            if (this._detectedEncoding) {
                const res = this.conv.write(chunk);
                if (res && res.length > 0) {
                    this.push(res, this.encoding);
                }
            } else {
                this._consumeBufferForDetection(chunk);
            }
			done();
        }
        catch (e) {
            done(e);
        }
    }

    // noinspection JSUnusedGlobalSymbols
    _flush(done) {
        try {

            if (!this._detectedEncoding) {
                this._consumeBufferForDetection(null);
				return done();
            }

            const res = this.conv.end();
            if (res && res.length > 0) {
                this.push(res, this.encoding);
            }
            done();
        }
        catch (e) {
            done(e);
        }
    }

    collect(cb) {
        let res = '';
        this.on('error', cb)
            .on('data', function(chunk) { res += chunk; })
            .on('end', function() {
                cb(null, res);
            });
        return this;
    }
}

module.exports = AutoDetectDecoderStream;
