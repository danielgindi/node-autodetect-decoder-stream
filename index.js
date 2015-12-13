"use strict";

var iconv = require('iconv-lite');
var jschardet = require('jschardet');

var util = require('util');
var Stream = require('stream');
var Transform = Stream.Transform;

/**
 * @param {Object?} options
 * @param {String=utf8} options.defaultEncoding - What encoding to fall-back to? (Specify any `iconv-lite` encoding)
 * @param {Number?} options.minConfidence - Minimum confidence to require for detecting encodings. @see {@link https://github.com/aadsm/jschardet|chardet module}
 * @param {Number=128} options.consumeSize - How many bytes to use for detecting the encoding? (Default 128)
 * @param {Boolean=true} options.stripBOM - Should strip BOM for UTF streams?
 * @constructor
 */
var AutoDetectDecoderStream = function (options) {
    options = options || {};

    this._defaultEncoding = options.defaultEncoding || 'utf8';
    this._minConfidence = options.minConfidence;
    this._consumeSize = options.consumeSize || 128;
    this._detectedEncoding = false;
    this._iconvOptions = {
        stripBOM: options.stripBOM == null ? true : options.stripBOM
    };

    this.encoding = 'utf8'; // We output strings.

    Transform.call(this, { encoding: this.encoding });
};

util.inherits(AutoDetectDecoderStream, Transform);

/**
 * @param {Buffer?} chunk
 * @param {function} done
 */
AutoDetectDecoderStream.prototype._consumeBufferForDetection = function (chunk, done) {

    if (chunk) {

        // Concatenate buffers until we get the minimum size we want
        if (this._detectionBuffer) {
            this._detectionBuffer = Buffer.concat([this._detectionBuffer, chunk]);
        } else {
            this._detectionBuffer = chunk;
        }

    }

    // Do we have enough buffer?
    if (this._detectionBuffer.length >= this._consumeSize || !chunk) {

        // Backup and setup jschardet global threshold
        var oldMinConfidence = jschardet.Constants.MINIMUM_THRESHOLD;
        if (this._minConfidence != null) {
            jschardet.Constants.MINIMUM_THRESHOLD = this._minConfidence;
        }

        try {

            // Try to detect encoding
            this._detectedEncoding = jschardet.detect(this._detectionBuffer).encoding;

            if (this._detectedEncoding === 'ascii') {
                //noinspection ExceptionCaughtLocallyJS
                throw new Error('Not enough data, recognized as ASCII. We probably need to use the fallback.');
            }

        } catch (e) {

            // Fallback
            this._detectedEncoding = this._defaultEncoding;

        }

        // Restore jschardet global threshold
        jschardet.Constants.MINIMUM_THRESHOLD = oldMinConfidence;

        this.conv = iconv.getDecoder(this._detectedEncoding, this._iconvOptions);

        var res = this.conv.write(this._detectionBuffer);
        delete this._detectionBuffer;

        if (res && res.length) {
            this.push(res, this.encoding);
        }
    }

    done();

};

AutoDetectDecoderStream.prototype._transform = function(chunk, encoding, done) {
    if (!Buffer.isBuffer(chunk))
        return done(new Error("Iconv decoding stream needs buffers as its input."));
    try {

        if (this._detectedEncoding) {

            var res = this.conv.write(chunk);
            if (res && res.length) {
                this.push(res, this.encoding);
            }
            done();

        } else {

            this._consumeBufferForDetection(chunk, done);

        }
    }
    catch (e) {
        done(e);
    }
};

AutoDetectDecoderStream.prototype._flush = function(done) {
    try {

        if (!this._detectedEncoding) {
            this._consumeBufferForDetection(null, done);
        }

        var res = this.conv.end();
        if (res && res.length) {
            this.push(res, this.encoding);
        }
        done();
    }
    catch (e) {
        done(e);
    }
};

AutoDetectDecoderStream.prototype.collect = function(cb) {
    var res = '';
    this.on('error', cb)
        .on('data', function(chunk) { res += chunk; })
        .on('end', function() {
            cb(null, res);
        });
    return this;
};

module.exports = AutoDetectDecoderStream;
