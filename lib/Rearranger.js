'use strict';

var Transform = require('stream').Transform;

function Rearranger(options)
{
        options = options || {};
        Transform.call(this, options);
        this._writableState.objectMode = true;
        this._readableState.objectMode = false;
        this._lastPushedSequenceID = (options.sequenceStart || 0) - 1;
        this._queueMax = options.queueMax || Infinity;
        this._outOfOrderData = Object.create(null);
        this.aborted = false;
}
module.exports = Rearranger;
require('inherits')(Rearranger, Transform);

Rearranger.prototype._transform = function(data, encoding, callback)
{
        if (this.aborted)
        {
                return;
        }

        // todo wrapping sequence id

        var payload;
        var sequenceID;

        if (encoding && encoding !== 'buffer')
        {
                sequenceID = new Buffer(data.substring(0, 8), 'hex').readUInt32BE(0);
                payload = data.substring(8);
        }
        else
        {
                payload = new Buffer(data);
                sequenceID = payload.readUInt32BE(0);
                payload = payload.slice(4);
        }

        if (sequenceID === this._lastPushedSequenceID + 1)
        {
                ++this._lastPushedSequenceID;
                this.push(payload);
        }
        else
        {
                this._outOfOrderData[sequenceID] = payload;

                if (Object.keys(this._outOfOrderData).length > this._queueMax)
                {
                        this.aborted = true;
                        this.emit('error', Error('Queue contains too many items'));
                        callback();
                        return;
                }
        }

        while ( (payload = this._outOfOrderData[this._lastPushedSequenceID + 1]) )
        {
                delete this._outOfOrderData[this._lastPushedSequenceID + 1];
                ++this._lastPushedSequenceID;
                this.push(payload);
        }

        callback();
};

Object.defineProperty(Rearranger.prototype, 'lastSequenceID', {
        get: function()
        {
                return this._lastPushedSequenceID;
        }
});