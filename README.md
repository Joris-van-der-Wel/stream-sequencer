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
// This instanceID is also the default:
var stream = new Sequencify({instanceID: 0xbabebabe});
stream.pipe(destinationStream);
stream.write(new Buffer('AAAA', 'hex'));
stream.write(new Buffer('BBBB', 'hex'));
stream.write(new Buffer('CCCC', 'hex'));
stream.end();

// First, the given instanceID is prepended as a 32 bit unsigned integer.
// Right after that you will get a 32 bit sequence number which increases by 1, starting at 0.
// So in this example, `destinationStream` will receive (in object mode):
// 0xBABEBABE00000000AAAA
// 0xBABEBABE00000001BBBB
// 0xBABEBABE00000002CCCC
```

### Rearranger
To rearrange such messages in the proper order using the sequence numbers you can use:
```javascript
var Rearranger = require('stream-sequencer').Rearranger;
var stream = new Rearranger({instanceID: 0xbabebabe});
stream.pipe(destinationStream);
stream.write(new Buffer('BABEBABE00000001BBBB', 'hex'));
stream.write(new Buffer('BABEBABE00000000AAAA', 'hex'));
stream.write(new Buffer('BABEBABE00000002CCCC', 'hex'));
stream.end();

// In this example, `destinationStream` will receive (not in object mode):
// 0xAAAABBBBCCCC

// Any message with an incorrect instance ID is silently ignored:
stream.write(new Buffer('8BADF00D00000000DDDD', 'hex'));
```

### Duplex
There is a also a `Duplex` stream (which wraps a different `Duplex` stream) that uses `Sequencify` when you write something and `Rearranger` when reading.
```javascript
var DuplexSequencer = require('stream-sequencer').DuplexSequencer;
var stream = new DuplexSequencer(mySocketStream, {
    encoding: 'utf8',
    decodeStrings: false,
    instanceID: 0xbabebabe
});
stream.write('Hi!', 'utf8');
stream.on('data', function(chunk)
{
    console.info('Received something', chunk);
});
```

### Object Mode
If you enable objectMode, you can pass any kind of object, which will be wrapped in an array. This is useful if you interact with a library which automatically performs serialization (json, ejson, etc).
Instead, strings and Buffers will have the sequence number prepended to their data, (irrespective of objectMode).

```javascript
var Sequencify = require('stream-sequencer').Sequencify;
var stream = new Sequencify({objectMode: true, instanceID: 0xbabebabe});
stream.pipe(destinationStream);
stream.write({foo: 'bar'});
stream.write(['a', 'b', 'c']);
stream.write(132456);
stream.write('hello');
stream.write(new Buffer('BABE', 'hex'));
stream.end();

// `destinationStream` will receive (in object mode):
// [0xbabebabe, 0, {foo: 'bar'} ]
// [0xbabebabe, 1, ['a', 'b', 'c'] ]
// [0xbabebabe, 2, 123456 ]
// 'babebabe00000003hello'
// Buffer('babebabe00000004BABE', 'hex')
// You will also need to enable objectMode in the Rearranger
```

---------------------------------------

This module was originally intended for usage with primus & engine.io to make sure the XMLHTTPRequest fallback does not mess up my data.
Note that if you would like to use this with something like UDP, you will also need to implement retransmissions.