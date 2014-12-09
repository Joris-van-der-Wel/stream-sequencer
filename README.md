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
### Sequencify
```javascript
var Sequencify = require('stream-sequencer').Sequencify;
var stream = new Sequencify();
stream.pipe(destinationStream);
stream.write(new Buffer('AAAA', 'hex'));
stream.write(new Buffer('BBBB', 'hex'));
stream.write(new Buffer('CCCC', 'hex'));
stream.end();

// A 32 bit sequence number which increases by 1, starting at 0,
// is prepended to your data
// So in this example, `destinationStream` will receive (in object mode):
// 0x00000000AAAA
// 0x00000001BBBB
// 0x00000002CCCC
```

### Rearranger
To rearrange such messages in the proper order using the sequence numbers you can use:
```javascript
var Rearranger = require('stream-sequencer').Rearranger;
var stream = new Rearranger();
stream.pipe(destinationStream);
stream.write(new Buffer('00000001BBBB', 'hex'));
stream.write(new Buffer('00000000AAAA', 'hex'));
stream.write(new Buffer('00000002CCCC', 'hex'));
stream.end();

// In this example, `destinationStream` will receive (not in object mode):
// 0xAAAABBBBCCCC
```

### Duplex
There is a also a `Duplex` stream (which wraps a different `Duplex` stream) that uses `Sequencify` when you write something and `Rearranger` when reading.
```javascript
var DuplexSequencer = require('stream-sequencer').DuplexSequencer;
var stream = new DuplexSequencer(mySocketStream, {
    encoding: 'utf8',
    decodeStrings: false
});
stream.write('Hi!', 'utf8');
stream.on('data', function(chunk)
{
    console.info('Received something', chunk);
});
```

This module was originally intended for usage with primus & engine.io to make sure the XMLHTTPRequest fallback does not mess up my data.
Note that if you would like to use this with something like UDP, you will also need to implement retransmissions.