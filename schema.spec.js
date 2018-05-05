describe('parse protos', ()=>{
  it('parse scheam', ()=>{
    const fs     = require('fs')
    const assert = require('assert');
    const schema = require('protocol-buffers-schema')
    var sch = schema.parse(fs.readFileSync('./hapi/services/tiller.proto'))

    assert(sch);
    console.log(sch)
  })
})
