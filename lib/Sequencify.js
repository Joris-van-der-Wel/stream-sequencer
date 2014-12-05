'use strict';

var Transform = require('stream').Transform;

function Sequencify(options)
{
        options = options || {};
        Transform.call(this, options);
        this._writableState.objectMode = false;
        this._readableState.objectMode = true;
        this._nextSeq = options.sequenceStart || 0;
}

module.exports = Sequencify;
require('inherits')(Sequencify, Transform);

Sequencify.prototype._transform = function(data, encoding, callback)
{
        var seq = new Buffer(4);
        if (this._nextSeq > 0xffffffff)
        {
                this._nextSeq = 0;
        }
        seq.writeUInt32BE(this._nextSeq++, 0);

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
                return this._nextSeq - 1;
        }
});