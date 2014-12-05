'use strict';

var concat = require('concat-stream');

var Rearranger = require('../lib/Rearranger');

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
                var stream = new Rearranger();

                var concatStream = concat(function(result)
                {
                        test.strictEqual(result.toString('hex'), '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
                        test.strictEqual(stream.lastSequenceID, 3);
                        test.done();
                });

                stream.on('error', function(err)
                {
                        test.ok(false, 'error ' + err);
                });

                stream.pipe(concatStream);

                stream.write(new Buffer('00000002'+'1415161718191a1b1c1d', 'hex')); // 2
                stream.write(new Buffer('00000003'+'1e1f', 'hex')); // 3
                stream.write(new Buffer('00000000'+'00010203040506070809', 'hex')); // 0
                stream.write(new Buffer('00000001'+'0a0b0c0d0e0f10111213', 'hex')); // 1
                stream.end();
        },
        'text': function(test)
        {
                var stream = new Rearranger({encoding: 'utf8', 'decodeStrings': false});

                var concatStream = concat(function(result)
                {
                        test.strictEqual(result, 'foo bar def abcqwertyuiopFusce gravida dictum iaculis. Integer sit amet felis quam. Praesent tempor dolor et metus pharetra, et condimentum ex maximus');
                        test.strictEqual(stream.lastSequenceID, 2);
                        test.done();
                });

                stream.on('error', function(err)
                {
                        test.ok(false, 'error ' + err);
                });

                stream.pipe(concatStream);

                stream.write('00000001' + 'qwertyuiop', 'utf8'); // 1
                stream.write('00000000' + 'foo bar def abc', 'utf8'); // 0
                stream.write('00000002' + 'Fusce gravida dictum iaculis. Integer sit amet felis quam. Praesent tempor dolor et metus pharetra, et condimentum ex maximus', 'utf8'); // 2

                stream.end();
        },
        'queue max': function(test)
        {
                var stream = new Rearranger({queueMax: 1});

                var concatStream = concat(function(result)
                {
                        test.ok(false);
                });

                var count = 0;
                stream.on('error', function(err)
                {
                        ++count;
                        test.strictEqual(count, 1, 'error should occur once');
                        test.done();
                });

                stream.pipe(concatStream);

                stream.write(new Buffer('00000003'+'1e1f', 'hex')); // 3
                stream.write(new Buffer('00000002'+'1415161718191a1b1c1d', 'hex')); // 2
                stream.write(new Buffer('00000001'+'0a0b0c0d0e0f10111213', 'hex')); // 1
                stream.write(new Buffer('00000000'+'00010203040506070809', 'hex')); // 0
                stream.end();
        },
        'wrapping': function(test)
        {
                var stream = new Rearranger({sequenceStart: 0xfffffffe});

                var concatStream = concat(function(result)
                {
                        test.strictEqual(result.toString('hex'), '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
                        test.strictEqual(stream.lastSequenceID, 1);
                        test.done();
                });

                stream.on('error', function(err)
                {
                        test.ok(false, 'error ' + err);
                });

                stream.pipe(concatStream);

                stream.write(new Buffer('00000000'+'1415161718191a1b1c1d', 'hex')); // 2
                stream.write(new Buffer('00000001'+'1e1f', 'hex')); // 3
                stream.write(new Buffer('fffffffe'+'00010203040506070809', 'hex')); // 0
                stream.write(new Buffer('ffffffff'+'0a0b0c0d0e0f10111213', 'hex')); // 1
                stream.end();
        },
};