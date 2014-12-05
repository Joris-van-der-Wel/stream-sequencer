stream-sequencer
================
Consumes a stream of binary data and emits Buffer objects with sequence numbers
to ensure proper ordering of messages. Also provides a stream which lets you reassemble
the data in the correct order.

Installing
----------
```bash
npm install stream-sequencer --save
```

Usage
-----
```javascript
var Sequencify = require('../lib/Sequencify');
var stream = new Sequencify();
stream.pipe(destinationStream);
stream.write(new Buffer('AAAA', 'hex');
stream.write(new Buffer('BBBB', 'hex');
stream.write(new Buffer('CCCC', 'hex');
stream.end();

// A 32 bit sequence number which increases by 1, starting at 0 is prepended to your data
// So in this example, `destinationStream` will receive (in object mode):
// 0x00000000AAAA
// 0x00000001BBBB
// 0x00000002CCCC
```

To rearrange such messages in the proper order using the sequence numbers you can use:
```javascript
var Rearranger = require('../lib/Rearranger');
var stream = new Rearranger();
stream.pipe(destinationStream);
stream.write(new Buffer('00000001BBBB', 'hex');
stream.write(new Buffer('00000000AAAA', 'hex');
stream.write(new Buffer('00000002CCCC', 'hex');
stream.end();

// In this example, `destinationStream` will receive (in flowing mode):
// 0xAAAABBBBCCCC
```

This module was originally intended for usage with primus & engine.io to make sure the XMLHTTPRequest fallback does not mess up my data.
Note that if you would like to use this with something like UDP, you will also need to implement retransmissions.