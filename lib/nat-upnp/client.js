const { Ssdp, Device } = require('../nat-upnp');
const async = require('async');

module.exports = class Client {
  get defaults() {
    return {
      timeout: 20*1000
    }
  }
  constructor(userOptions = {}) {
    this._options = Object.assign(this.defaults, userOptions);
    this._ssdp = new Ssdp();
    this.timeout = this._options.timeout;
  }
  normalizeOptions(options) {
    const toObject = (addr) => {
      if (typeof addr === 'number') return { port: addr };
      if (typeof addr === 'string' && !isNaN(addr)) return { port: Number(addr) };
      if (typeof addr === 'object') return addr;

      return {};
    }

    return {
      remote: toObject(options.public),
      internal: toObject(options.private)
    };
  }
  async portMapping(options) {
    const {gateway, address} = await this.findGateway();
    const ports = this.normalizeOptions(options);
    let ttl = 60 * 30;
    if (typeof options.ttl === 'number') { ttl = options.ttl; }
    if (typeof options.ttl === 'string' && !isNaN(options.ttl)) { ttl = Number(options.ttl); }

    return await gateway.run('AddPortMapping', [
      [ 'NewRemoteHost', ports.remote.host ],
      [ 'NewExternalPort', ports.remote.port ],
      [ 'NewProtocol', options.protocol ?
          options.protocol.toUpperCase() : 'TCP' ],
      [ 'NewInternalPort', ports.internal.port ],
      [ 'NewInternalClient', ports.internal.host || address ],
      [ 'NewEnabled', 1 ],
      [ 'NewPortMappingDescription', options.description || 'node:nat:upnp' ],
      [ 'NewLeaseDuration', ttl ]
    ]);
  }
  async portUnmapping(options) {
    const {gateway} = await this.findGateway();
    const ports = this.normalizeOptions(options);

    return await gateway.run('DeletePortMapping', [
      [ 'NewRemoteHost', ports.remote.host ],
      [ 'NewExternalPort', ports.remote.port ],
      [ 'NewProtocol', options.protocol ?
          options.protocol.toUpperCase() : 'TCP' ]
    ]);
  }
  async getMappings(options = {}) {
    const {gateway, address} = await this.findGateway();
    let i = 0;
    let results = [];

    while (true) {
      try {
        var data = await gateway.run('GetGenericPortMappingEntry', [
          [ 'NewPortMappingIndex', i++ ]
        ]);
      } catch (error) {
        // If we got an error on index 0, ignore it in case this router starts indicies on 1
        if (i !== 1) {
          break;
        }
      }

      let key;
      Object.keys(data).some((k) => {
        if (!/:GetGenericPortMappingEntryResponse/.test(k)) return false;

        key = k;
        return true;
      });
      if (!key) {
        break;
      }
      data = data[key];

      var result = {
        public: {
          host: typeof data.NewRemoteHost === 'string' &&
                data.NewRemoteHost || '',
          port: parseInt(data.NewExternalPort, 10)
        },
        private: {
          host: data.NewInternalClient,
          port: parseInt(data.NewInternalPort, 10)
        },
        protocol: data.NewProtocol.toLowerCase(),
        enabled: data.NewEnabled === 1,
        description: data.NewPortMappingDescription,
        ttl: parseInt(data.NewLeaseDuration, 10)
      };
      result.local = result.private.host === address;

      results.push(result);
    }

    if (options.local) {
      results = results.filter((item) => item.local);
    }

    if (options.description) {
      results = results.filter((item) => {
        if (typeof item.description !== 'string')
          return;

        if (options.description instanceof RegExp) {
          return item.description.match(options.description) !== null;
        } else {
          return item.description.includes(options.description);
        }
      });
    }

    return results;
  }
  async externalIp() {
    const {gateway} = await this.findGateway();
    const data = await gateway.run('GetExternalIPAddress');
    let key;

    Object.keys(data).some((k) => {
      if (!/:GetExternalIPAddressResponse$/.test(k)) return false;

      key = k;
      return true;
    });

    if ( ! key) return reject(Error('Incorrect response'));
    return data[key].NewExternalIPAddress;
  }
  async findGateway() {
    return await new Promise((resolve, reject) => {
      let timeout;
      let timeouted = false;
      const p = this._ssdp.search(
        'urn:schemas-upnp-org:device:InternetGatewayDevice:1'
      );

      timeout = setTimeout(() => {
        timeouted = true;
        p.emit('end');
        return reject(new Error('timeout'));
      }, this._timeout);

      p.on('device', (info, address) => {
        if (timeouted) return;
        p.emit('end');
        clearTimeout(timeout);

        // Create gateway
        resolve({gateway: new Device(info.location), address});
      });
    });
  }
  close() {
    this._ssdp.close();
  }
  set timeout(val) {
    this._timeout = val;
  }
  get timeout() {
    return this._timeout;
  }
}
