'use strict';

var Sequencify = require('../lib/Sequencify');

module.exports = {
        setUp: function (callback)
        {
                callback();
        },
        tearDown: function (callback)
        {
                callback();
        },
        'binary': function(test)
        {
                var stream = new Sequencify();
                var count = 0;

                stream.on('data', function(buf)
                {
                        ++count;

                        if (count === 1)
                        {
                                test.strictEqual(buf.toString('hex'), '00000000' + '00010203040506070809');
                        }
                        else if (count === 2)
                        {
                                test.strictEqual(buf.toString('hex'), '00000001' + '0a0b0c0d0e0f10111213');
                        }
                        else if (count === 3)
                        {
                                test.strictEqual(buf.toString('hex'), '00000002' + '1415161718191a1b1c1d');
                        }
                        else if (count === 4)
                        {
                                test.strictEqual(buf.toString('hex'), '00000003' + '1e1f');
                        }
                        else
                        {
                                test.ok(false);
                        }
                });

                stream.on('end', function()
                {
                        test.strictEqual(count, 4);
                        test.strictEqual(stream.lastSequenceID, 3);
                        test.done();
                });

                stream.write(new Buffer('00010203040506070809', 'hex'));
                stream.write(new Buffer('0a0b0c0d0e0f10111213', 'hex'));
                stream.write(new Buffer('1415161718191a1b1c1d', 'hex'));
                stream.write(new Buffer('1e1f', 'hex'));
                stream.end();
        },
        'string': function(test)
        {
                var stream = new Sequencify({encoding: 'utf8', 'decodeStrings': false});
                var count = 0;

                stream.on('data', function(str)
                {
                        ++count;

                        if (count === 1)
                        {
                                test.strictEqual(str, '00000000' + 'foo bar def abc');
                        }
                        else if (count === 2)
                        {
                                test.strictEqual(str, '00000001' + 'qwertyuiop');
                        }
                        else if (count === 3)
                        {
                                test.strictEqual(str, '00000002' + 'Fusce gravida dictum iaculis. Integer sit amet felis quam. Praesent tempor dolor et metus pharetra, et condimentum ex maximus');
                        }
                        else
                        {
                                test.ok(false);
                        }
                });

                stream.on('end', function()
                {
                        test.strictEqual(count, 3);
                        test.strictEqual(stream.lastSequenceID, 2);
                        test.done();
                });

                stream.write('foo bar def abc', 'utf8');
                stream.write('qwertyuiop', 'utf8');
                stream.write('Fusce gravida dictum iaculis. Integer sit amet felis quam. Praesent tempor dolor et metus pharetra, et condimentum ex maximus', 'utf8');
                stream.end();
        },
        'sequenceStart': function(test)
        {
                var stream = new Sequencify({sequenceStart: 0x12345, highWaterMark : 10});
                var count = 0;

                stream.on('data', function(buf)
                {
                        ++count;

                        if (count === 1)
                        {
                                test.strictEqual(buf.toString('hex'), '00012345' + '00010203040506070809');
                        }
                        else if (count === 2)
                        {
                                test.strictEqual(buf.toString('hex'), '00012346' + '0a0b0c0d0e0f10111213');
                        }
                        else if (count === 3)
                        {
                                test.strictEqual(buf.toString('hex'), '00012347' + '1415161718191a1b1c1d');
                        }
                        else if (count === 4)
                        {
                                test.strictEqual(buf.toString('hex'), '00012348' + '1e1f');
                        }
                        else
                        {
                                test.ok(false);
                        }
                });

                stream.on('end', function()
                {
                        test.strictEqual(count, 4);
                        test.strictEqual(stream.lastSequenceID, 0x12348);
                        test.done();
                });

                stream.write(new Buffer('00010203040506070809', 'hex'));
                stream.write(new Buffer('0a0b0c0d0e0f10111213', 'hex'));
                stream.write(new Buffer('1415161718191a1b1c1d', 'hex'));
                stream.write(new Buffer('1e1f', 'hex'));
                stream.end();
        },
        'id wrap around': function(test)
        {
                var stream = new Sequencify({sequenceStart: 0xFFFFFFFE, highWaterMark : 10});
                var count = 0;

                stream.on('data', function(buf)
                {
                        ++count;

                        if (count === 1)
                        {
                                test.strictEqual(buf.toString('hex'), 'fffffffe' + '00010203040506070809');
                        }
                        else if (count === 2)
                        {
                                test.strictEqual(buf.toString('hex'), 'ffffffff' + '0a0b0c0d0e0f10111213');
                        }
                        else if (count === 3)
                        {
                                test.strictEqual(buf.toString('hex'), '00000000' + '1415161718191a1b1c1d');
                        }
                        else if (count === 4)
                        {
                                test.strictEqual(buf.toString('hex'), '00000001' + '1e1f');
                        }
                        else
                        {
                                test.ok(false);
                        }
                });

                stream.on('end', function()
                {
                        test.strictEqual(count, 4);
                        test.strictEqual(stream.lastSequenceID, 1);
                        test.done();
                });

                stream.write(new Buffer('00010203040506070809', 'hex'));
                stream.write(new Buffer('0a0b0c0d0e0f10111213', 'hex'));
                stream.write(new Buffer('1415161718191a1b1c1d', 'hex'));
                stream.write(new Buffer('1e1f', 'hex'));
                stream.end();
        }
};