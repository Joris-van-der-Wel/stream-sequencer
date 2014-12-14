'use strict';

var BunWrapper = require('bun').BunWrapper;
var Rearranger = require('./Rearranger');
var Sequencify = require('./Sequencify');

function DuplexSequencer(stream, options)
{
        if (!stream)
        {
                throw Error('Missing argument stream');
        }

        options = options || {};

        this.parentStream = stream;
        this.rearranger = new Rearranger(options);
        this.sequencify = new Sequencify(options);

        if ('maxListeners' in options)
        {
                this.setMaxListeners(options.maxListeners);
        }

        BunWrapper.call(this, [this.sequencify, this.parentStream, this.rearranger]);
}

module.exports = DuplexSequencer;
require('inherits')(DuplexSequencer, BunWrapper);

Object.defineProperty(DuplexSequencer.prototype, 'lastSentSequenceID', {
        get: function()
        {
                return this.sequencify.lastSequenceID;
        }
});

Object.defineProperty(DuplexSequencer.prototype, 'lastReceivedSequenceID', {
        get: function()
        {
                return this.rearranger.lastSequenceID;
        }
});

DuplexSequencer.prototype.setMaxListeners = function(n)
{
        this.rearranger.setMaxListeners(n);
        this.sequencify.setMaxListeners(n);
        DuplexSequencer.super_.prototype.setMaxListeners.call(this, n);
};
