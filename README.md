# NAT UPnP2 (ES6 Refactored)

Port mapping via UPnP APIs

Based on node-nat-upnp but:
1. Code refactored in ES6. 100% backward compatibility.
2. xml2js has been replaced with fast-xml-parser
3. dgram sockets created with reuseAddr=true.
4. Timeout can assign in options object passed to natUpnp.createClient()
```javascript
natUpnp.createClient({
  timeout: 10*1000
})
```

## Usage

```javascript
const {createClient} = require('nat-upnp-2');

const client = createClient();

client.portMapping({
  public: 12345,
  private: 54321,
  ttl: 10
}, (err) => {
  // Will be called once finished
});

client.portUnmapping({
  public: 12345
});

client.getMappings((err, results) => { });

client.getMappings({ local: true }, (err, results) => { });

client.externalIp((err, ip) => { });
```

### License

This software is licensed under the MIT License.

Copyright Garry Lachman, 2017, Original version by Fedor Indutny, 2012.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.
