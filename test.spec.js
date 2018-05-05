describe('helm release protobuff tests', ()=>{

  debugger;

  const assert = require('assert');
  const fs   = require('fs');
  const path = require('path');
  const _    = require('lodash');
  const prettyJson = require('prettyjson');

  it('test dendencies', ()=>{
    const resolve = require('resolve-protobuf-schema')
    console.log(resolve.sync('./release.proto')) // prints the parsed schema
  })
  it('create protobuf', (done)=>{
    const fs = require('fs');
    const path = require('path');
    const ProtoBuf = require('protocol-buffers')
    let messages = ProtoBuf(
      fs.readFileSync(path.join(__dirname,
      'message.proto')));
      assert(messages);
      console.log(JSON.stringify(messages));
      var buf = messages.Example.encode({
        name: "oleg",

      })
      assert(buf);
      done();
      console.log(JSON.stringify(buf));
  })
  it('realse protobuf', (done)=>{

    const ProtoBuf = require('protocol-buffers')
    let messages = ProtoBuf(
      fs.readFileSync(path.join(__dirname,
      'hapi/release/release.proto')));
      assert(messages);
      console.log(JSON.stringify(messages));
      var obj = messages.Release.decode()
      assert(obj);
      done();
      console.log(JSON.stringify(obj));
  })
  it('deserialize release', (done)=>{

    const  Info = require('./hapi/release/release_pb');
    let Release = Info.Release;
    const concat = require('concat-stream')
    const prettyjson =  require('prettyjson');
    //const gunzip = require('gunzip-maybe');
    const  base64 = require('base64-stream');
    const zlib = require('zlib');
    const gunzip = zlib.createGunzip();
    const decode = base64.decode();
    const {createGunzip} = require('gunzip-stream');
    let buffer;
    //let gz = fs.createWriteStream('./r.test.gz')
    let stream = fs.createReadStream('./r.base64')
    .pipe(decode)
    .pipe(gunzip)
    .pipe(concat((data)=>{

     const separator = "------------------\n";

      let r = Release.deserializeBinary(new Uint8Array(data));
      let release = r.toObject()
      let info = r.getInfo().toObject();
      let version = r.Version;
      console.log(prettyjson.render(release));
      const kefir = require ('kefir');


      var templates = kefir.sequentially(0, _.get(release, "chart.templatesList",[1]))
      templates.onValue((v)=>{
        let fileName =  _.get(v, "name");
        let data  = Buffer.from(_.get(v, "data"), "base64");
        data = Buffer.from(data).toString();
        console.log(`fileName =  ${prettyjson.render(fileName)}`);
        console.log(`data:${data}`);
      })

      let infoStream = kefir.constant(info).map((v)=>{
          console.log(`chart info =  ${prettyjson.render(v)}`);
      })


     kefir.merge([templates, infoStream]).onEnd(done);


    }))

})
  it.only('grpc call', (done)=>{

    var services = require('./hapi/services/tiller_pb.js');
    const googleProtoFilesDir = require('google-proto-files')('..');
    const grpc = require('grpc');
    const {load} = require('protobufjs');

    var tillerPath = path.resolve(__dirname ,'all.proto');
    //var Charts = path.resolve(__dirname ,'./hapi/chart/chart.proto');
    let Services = grpc.load(tillerPath, "proto" ,{include: [googleProtoFilesDir]}).hapi.services;
    var client = new Services.tiller.ReleaseService('localhost:44134',
                                     grpc.credentials.createInsecure());
    //const req = new services.ListReleasesRequest();
    //req.setLimit(64);
    //req.setOffset("");
    //req.setNamespace("kube-system");
    var metadata = new grpc.Metadata();
    metadata.add('x-helm-api-client', 'v2.6.1')
    process.on('uncaughtException', function (err) {
   console.log(err);
 })
    let call = (callback)=>{
    let stream = client.listReleases({offset: "" , limit:64  /*,namespace: "default"*/} ,metadata , function(err, response) {
          //console.log('Greeting:', response.message);
          console.log('1');

      })
      stream.on('data' , (data)=>{
         console.log('---->');
        callback(data);
      })
      stream.on('data' , (data)=>{
         console.log('in on data');
        //callback(data);
      })
      stream.on('error', done);
      stream.on('close', done);
      stream.on('error', done);
      return stream;
    }

   let callback = (data)=>{
     //console.log(`${console.log(data)}`)
    _.forEach (_.get(data, "releases", []) , (r)=>{

        console.log(`${prettyJson.render(_.get(r, "name"))}`);
        console.log(`${prettyJson.render(_.get(r, "info"))}`);
    })
    // call(callback)
     //done();
   }

   stream = call(callback);
  client.GetVersion({},{},(err, version)=>{
    console.log(`version - ${prettyJson.render(version)}`);
  })
    /*var ReleaseService = load([Tiller],(err, root)=>{
      if (err){
      console.log(`err ${err} ${root} `);

      return done(err);
      }
      const ReleaseService = root.lookup("hapi.services.tiller.ReleaseService");

      assert(ReleaseService)
      s =  ReleaseService.create(()=>{
        console.log('rpc callback');
      });
      s.listReleases();
      done();

    })*/

   return;
  //  assert(ReleaseService)

    var release_proto = services.ListReleasesRequest;
    function sayHello(call, callback) {
    callback(null, {message: 'Hello ' + call.request.name});
    }

    var client = new release_proto.ReleaseService('localhost:44134',
                                        grpc.credentials.createInsecure());
    client.ListReleases();
  })
  it('test', ()=>{
    debugger;

    const fs = require('fs');
    const  Info = require('./hapi/release/release_pb');
    let Release = Info.Release;

    Release.deserializeBinary()
    let r = new Release();
    r.setNamespace("default");
    r.setInfo({
      status :  {
        code :  "DEPLOYED"
      }
    });

    let bytes =  r.serializeBinary();
    let bytesBase64 = new Buffer(bytes).toString('base64')
    console.log(bytesBase64);
  //  const data = fs.readFileSync("./protobuf");
    //let base64data = Buffer.from(data, 'base64');
    //Release.deserializeBinary(new Uint8Array(Buffer.from(data)));

    //console.log(JSON.stringify( release));
    assert(bytes);
  })
})
