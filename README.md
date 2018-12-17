# autodetect-decoder-stream

[![npm Version](https://badge.fury.io/js/autodetect-decoder-stream.png)](https://npmjs.org/package/autodetect-decoder-stream)

An `iconv-lite` stream that autodetects the encoding and fallbacks to a specified fallback encoding.


Usage example:

```javascript
const AutoDetectDecoderStream = require('autodetect-decoder-stream');

let stream = fs.createReadStream('1.csv').pipe(new AutoDetectDecoderStream({ defaultEncoding: '1255' }));

stream
    .on('data', data => {
      console.log(data);
    })
    .on('end', () => {
      console.log('Done reading.');
    });

```

Other options that could be passed:

Option | Explanation | Default
---- | ------------ | ------
  `defaultEncoding` | The fallback encoding, if nothing was detected. If "ASCII" is found, it also assumes that there was not enough data to go on, and falls back. | `'utf8'`
  `minConfidence` | Minimum confidence to require for detecting encodings. See [jschardet](https://github.com/aadsm/jschardet) | Depends on `jschardet` (Currently 0.2)
  `consumeSize` | How much data to use for detecting the encoding? - in bytes. | `128` bytes
  `stripBOM` | Should strip the BOM for UTF streams? | `true`


## Contributing

If you have anything to contribute, or functionality that you lack - you are more than welcome to participate in this!
If anyone wishes to contribute unit tests - that also would be great :-)

## Me
* Hi! I am Daniel Cohen Gindi. Or in short- Daniel.
* danielgindi@gmail.com is my email address.
* That's all you need to know.

## Help

If you want to buy me a beer, you are very welcome to
[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=G6CELS3E997ZE)
 Thanks :-)

## License

All the code here is under MIT license. Which means you could do virtually anything with the code.
I will appreciate it very much if you keep an attribution where appropriate.

    The MIT License (MIT)

    Copyright (c) 2013 Daniel Cohen Gindi (danielgindi@gmail.com)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
