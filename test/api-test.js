var assert = require('assert');
var async = require('async');
var net = require('net');
var { Client } = require('..');

describe('NAT-UPNP/Client', function() {
  var c;

  beforeEach(function() {
    c = new Client();
  });

  afterEach(function() {
    c.close();
  });

  it('should add port mapping/unmapping', async () => {
    var public = ~~(Math.random() * 65536);
    await c.portMapping({
      public: public,
      private: ~~(Math.random() * 65536),
      ttl: 0
    })

    await c.portUnmapping({ public: public });
  });

  it('should find port after mapping', async () => {
    const public = ~~(Math.random() * 65536);
    const private = ~~(Math.random() * 65536);
    await c.portMapping({
      public,
      private,
      description: 'node:nat:upnp:search-test',
      ttl: 0
    });
    const list = await c.getMappings({ local: true, description: /search-test/ });
    assert(list.length > 0);

    for (const item of list) {
      await c.portUnmapping(item);
    }
  });

  it('should get external ip address', async () => {
    const ip = await c.externalIp();
    assert(net.isIP(ip));
  });
});
