'use strict';

var PassThrough = require('stream').PassThrough;
var concat = require('concat-stream');

var DuplexSequencer = require('../lib/DuplexSequencer');

module.exports = {
        setUp: function (callback)
        {
                callback();
        },
        tearDown: function (callback)
        {
                callback();
        },
        'missing argument': function(test)
        {
                test.throws(function(){ new DuplexSequencer(); }, Error);
                test.done();
        },
        'parentStream': function(test)
        {
                var parentStream = new PassThrough();
                var stream = new DuplexSequencer(parentStream);
                test.ok(stream.parentStream === parentStream);
                test.done();
        },
        'binary': function(test)
        {
                var stream = new DuplexSequencer(new PassThrough());

                var concatStream = concat(function(result)
                {
                        test.strictEqual(result.toString('hex'), '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
                        test.strictEqual(stream.lastSentSequenceID, 3);
                        test.strictEqual(stream.lastReceivedSequenceID, 3);
                        test.done();
                });

                stream.on('error', function(err)
                {
                        test.ok(false, 'error ' + err);
                });

                stream.pipe(concatStream);

                stream.write(new Buffer('00010203040506070809', 'hex'));
                stream.write(new Buffer('0a0b0c0d0e0f10111213', 'hex'));
                stream.write(new Buffer('1415161718191a1b1c1d', 'hex'));
                stream.write(new Buffer('1e1f', 'hex'));
                stream.end();
        },
        'text': function(test)
        {
                var stream = new DuplexSequencer(
                        new PassThrough({encoding: 'utf8', 'decodeStrings': false}),
                        {encoding: 'utf8', 'decodeStrings': false}
                );

                var concatStream = concat(function(result)
                {
                        test.strictEqual(result, 'foo bar def abcqwertyuiopFusce gravida dictum iaculis. Integer sit amet felis quam. Praesent tempor dolor et metus pharetra, et condimentum ex maximus');
                        test.strictEqual(stream.lastSentSequenceID, 2);
                        test.strictEqual(stream.lastReceivedSequenceID, 2);
                        test.done();
                });

                stream.on('error', function(err)
                {
                        test.ok(false, 'error ' + err);
                });

                stream.pipe(concatStream);

                stream.write('foo bar def abc', 'utf8');
                stream.write('qwertyuiop', 'utf8');
                stream.write('Fusce gravida dictum iaculis. Integer sit amet felis quam. Praesent tempor dolor et metus pharetra, et condimentum ex maximus', 'utf8');

                stream.end();
        },
        'object mode': function(test)
        {
                var stream = new DuplexSequencer(
                        new PassThrough({objectMode: true}),
                        {objectMode: true}
                );

                stream.on('error', function(err)
                {
                        test.ok(false, 'error ' + err);
                });

                var count = 0;

                stream.on('data', function(obj)
                {
                        ++count;

                        if (count === 1)
                        {
                                test.deepEqual(obj, {foo: 'bar'});
                        }
                        else if (count === 2)
                        {
                                test.deepEqual(obj, ['a', 'b']);
                        }
                        else if (count === 3)
                        {
                                // special case
                                // This lets you use strings without having to use json in objectMode
                                test.strictEqual(obj, 'some string');
                        }
                        else if (count === 4)
                        {
                                // buffers should stay buffers
                                test.ok(Buffer.isBuffer(obj));
                                test.strictEqual(obj.toString('hex'), '00010203040506070809');
                        }
                        else if (count === 5)
                        {
                                test.strictEqual(obj, false);
                        }
                        else if (count === 6)
                        {
                                test.strictEqual(obj, 12345);
                        }
                        else
                        {
                                test.ok(false);
                        }
                });

                stream.on('end', function()
                {
                        test.strictEqual(count, 6);
                        test.strictEqual(stream.lastSentSequenceID, 5);
                        test.strictEqual(stream.lastReceivedSequenceID, 5);
                        test.done();
                });

                stream.write({foo: 'bar'});
                stream.write(['a', 'b']);
                stream.write('some string');
                stream.write(new Buffer('00010203040506070809', 'hex'));
                stream.write(false);
                stream.write(12345);
                stream.end();
        }
};
