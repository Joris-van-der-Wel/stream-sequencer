'use strict';

var Transform = require('stream').Transform;

function Sequencify(options)
{
        options = options || {};
        Transform.call(this, options);
        this._writableState.objectMode = !!options.objectMode;
        this._readableState.objectMode = true;
        this._lastSequenceID = (options.sequenceStart || 0) - 1;
}

module.exports = Sequencify;
require('inherits')(Sequencify, Transform);

Sequencify.prototype._transform = function(data, encoding, callback)
{
        var seq = this.nextSequenceID;
        var seqBuf;
        this._lastSequenceID = this.nextSequenceID;

        if (encoding === 'buffer' || Buffer.isBuffer(data))
        {
                seqBuf = new Buffer(4);
                seqBuf.writeUInt32BE(seq, 0);

                this.push(Buffer.concat([seqBuf, data]));
        }
        else if (typeof data === 'string')
        {
                seqBuf = new Buffer(4);
                seqBuf.writeUInt32BE(seq, 0);

                this.push(seqBuf.toString('hex') + data);
        }
        else // json object in objectMode (unserialized)
        {
                this.push([seq, data]);
        }

        callback();
};

Object.defineProperty(Sequencify.prototype, 'lastSequenceID', {
        get: function()
        {
                return this._lastSequenceID;
        }
});
Object.defineProperty(Sequencify.prototype, 'nextSequenceID', {
        get: function()
        {
                var next = this._lastSequenceID;
                ++next;

                if (next > 0xffffffff)
                {
                        next = 0;
                }

                return next;
        }
});