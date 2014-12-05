'use strict';

var Transform = require('stream').Transform;

function Sequencify(options)
{
        options = options || {};
        Transform.call(this, options);
        this._writableState.objectMode = false;
        this._readableState.objectMode = true;
        this._lastSequenceID = (options.sequenceStart || 0) - 1;
}

module.exports = Sequencify;
require('inherits')(Sequencify, Transform);

Sequencify.prototype._transform = function(data, encoding, callback)
{
        var seq = new Buffer(4);
        seq.writeUInt32BE(this.nextSequenceID, 0);
        this._lastSequenceID = this.nextSequenceID;

        if (encoding && encoding !== 'buffer')
        {
                this.push(seq.toString('hex') + data);
        }
        else
        {
                this.push(Buffer.concat([seq, data]));
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