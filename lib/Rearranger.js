'use strict';

var Transform = require('stream').Transform;

function Rearranger(options)
{
        options = options || {};
        Transform.call(this, options);
        this._writableState.objectMode = true;
        this._readableState.objectMode = !!options.objectMode;
        this._lastSequenceID = (options.sequenceStart || 0) - 1;
        this._instanceID = options.instanceID === void 123 ? 0xbabebabe : options.instanceID;
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
                callback();
                return;
        }

        var payload;
        var instanceID;
        var sequenceID;

        if (encoding === 'buffer' || Buffer.isBuffer(data))
        {
                instanceID = data.readUInt32BE(0);
                sequenceID = data.readUInt32BE(4);
                payload = data.slice(8);
        }
        else if (typeof data === 'string')
        {
                instanceID = new Buffer(data.substring(0,  8), 'hex').readUInt32BE(0);

                if (instanceID !== this._instanceID)
                {
                        // do this one early because .substring is expensive
                        callback();
                        return;
                }

                sequenceID = new Buffer(data.substring(8, 16), 'hex').readUInt32BE(0);
                payload = data.substring(16);
        }
        else // json object in objectMode (unserialized)
        {
                if (!Array.isArray(data) || data.length !== 3)
                {
                        this.emit('invalid-object', data);
                        // do not abort, the user might want to simple ignore these kinds of messages
                        callback();
                        return;
                }

                instanceID = data[0];
                sequenceID = data[1];
                payload = data[2];
        }

        if (instanceID !== this._instanceID)
        {
                callback();
                return;
        }

        if (sequenceID === this.nextSequenceID)
        {
                this._lastSequenceID = this.nextSequenceID;
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

        while ( (payload = this._outOfOrderData[this.nextSequenceID]) )
        {
                delete this._outOfOrderData[this.nextSequenceID];
                this._lastSequenceID = this.nextSequenceID;
                this.push(payload);
        }

        callback();
};

Object.defineProperty(Rearranger.prototype, 'lastSequenceID', {
        get: function()
        {
                return this._lastSequenceID;
        }
});

Object.defineProperty(Rearranger.prototype, 'nextSequenceID', {
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

Object.defineProperty(Rearranger.prototype, 'instanceID', {
        get: function()
        {
                return this._instanceID;
        }
});