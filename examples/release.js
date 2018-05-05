describe('helm grpc calls examples', ()=>{

  debugger;

  const assert      = require('assert');
  const fs          = require('fs');
  const path        = require('path');
  const _           = require('lodash');
  const prettyJson  = require('prettyjson');
  const googleProtoFilesDir = require('google-proto-files')('..');
  const grpc        = require('grpc');
  const {load}      = require('protobufjs');
  const services    = require('../hapi/services/tiller_pb.js');

  var Services;
  var helmClient, metadata;
  process.on('uncaughtException', function (err) {
      console.log(err);
  })

  beforeEach((done)=>{
    var tillerPath = path.resolve(__dirname,'../hapi/services/tiller.proto');
    //var Charts = path.resolve(__dirname ,'./hapi/chart/chart.proto');
     Services = grpc.load(tillerPath, "proto"
     ,{include: [googleProtoFilesDir]}).hapi.services;
     helmClient = new Services.tiller.ReleaseService('localhost:44134',
                                     grpc.credentials.createInsecure());
      console.log('before each');
      metadata = new grpc.Metadata();
      metadata.add('x-helm-api-client', 'v2.6.1')
      done();
  })
    it.only('install release', (done)=>{
    done();
  })
  it('get version', (done)=>{
    helmClient.GetVersion({},{},(err, version)=>{
      console.log(`version - ${prettyJson.render(version)}`);
      assert(_.get(version, version.sem_ver), "v2.6.1");
      done(err);
  })
 })
 /*
 message Chart {
 	// Contents of the Chartfile.
 	hapi.chart.Metadata metadata = 1;

 	// Templates for this chart.
 	repeated hapi.chart.Template templates = 2;

 	// Charts that this chart depends on.
 	repeated Chart dependencies = 3;

 	// Default config for this template.
 	hapi.chart.Config values = 4;

 	// Miscellaneous files in a chart archive,
 	// e.g. README, LICENSE, etc.
 	repeated google.protobuf.Any files = 5;
 }
 */


  it('install release',async ()=>{
    console.log('installing release');
    let done;
    let promise = new Promise((resolve, reject)=>{
      done = resolve;
    })

    const readDeploy = async (path)=>{
    return new Promise((resolve, reject)=>{
      fs.readFile(path, (err, data) => {
      if (err)  return reject(err)
      resolve(data);
    });
    })
  }
    let deployYaml = await readDeploy('./deploy/demo/templates/deployment.yaml');
    let helpersFile =  await readDeploy('./deploy/demo/templates/_helpers.tpl');
    let valuesYaml = await readDeploy('./deploy/demo/values.yaml');

    assert(metadata);
    let chart = {};
    let chartMeta = {
       apiVersion: "v1",
       description: "A Helm chart for Kubernetes",
       name: "demo",
       "version": "0.1.0"
     }
     let chartTemplate = {
          name : "templates/deployment.yaml",
	        data : new Buffer(deployYaml)
       }
       let helpers = {
            name : "templates/_helpers.tpl",
           data : new Buffer(helpersFile)
         }
      //  c.setTemplatesList(chartTemplate)
        //c.setConf
    let valuesStr = Buffer.from(valuesYaml).toString('utf8');
    console.log(JSON.stringify(valuesStr));
    const Values = require('../hapi/chart/config_pb').Value;
    let v = new Values();
    v.setValue(valuesStr);
    let o = v.toObject();
     let chartConfig = {
       raw:  "replicaCount: 1\nimage:\n  repository: nginx\n  tag: stable\n  pullPolicy: IfNotPresent\nservice:\n  name: nginx\n  type: ClusterIP\n  externalPort: 80\n  internalPort: 80\ningress:\n  enabled: false\n  hosts:\n    - chart-example.local\nresources: {}\n",
       values: {}
     }

    _.set(chart, "metadata" , chartMeta);

    _.set(chart, "templates" , [chartTemplate,  helpers]);
    _.set(chart, "values"   , {
    //  raw:  "replicaCount: 1\nimage:\n  repository: nginx\n  tag: stable\n  pullPolicy: IfNotPresent\nservice:\n  name: nginx\n  type: ClusterIP\n  externalPort: 80\n  internalPort: 80\ningress:\n  enabled: false\n  hosts:\n    - chart-example.local\nresources: {}\n",
      values: {}
    });


    //_.set(chart, "files"   , [{"type_url": "templates/deploy.yaml", value: deployYaml}]);
    let random  = (pattern, max)=>{
      let n =  Math.floor(Math.random(max)*max);
      return pattern + n.toString();
    }
    let call = helmClient.installRelease({chart, values: chartConfig, name : random('release' , 1000), namespace:"oleg"}, metadata, (err, data)=>{
      console.log(err);
      done(err);
    })
    call.on('status', (data)=>{
      console.log(`on OLEG ${JSON.stringify(data)}`)
    });

   return promise;
  })
  it.only('list releases', (done)=>{
    const  Table = require('cli-table');
    const  moment =  require('moment');
    const table = new Table({
    head: ['name', 'namespace', 'status', "lastDeployed"]
  //, colWidths: [100, 200]
    });


    assert(helmClient);
    let ns = process.env.namespace || "";
    let formatChart = (chart)=>{
        let info = chart.info;
        let r = _.pick(chart, ['name', 'namespace'])
      //  console.log(JSON.stringify(r));
        r.status =  info.status.code;
        r.lastDeployed = moment.unix(info.last_deployed.seconds).format();
        table.push(_.values(r))
     }

    let call = (callback)=>{
    let stream = helmClient.listReleases({offset: "" , limit:64  , namespace : ns} ,metadata , function(err, response) {
          //console.log('Greeting:', response.message);
        //  console.log(JSON.stringify(response));


      })

      stream.on('data' , (data)=>{
         console.log('---->');
         callback(data);
         console.log(table.toString());
      })
      stream.on('data' , (data)=>{
         done();
        //callback(data);
      })
      stream.on('error', done);
      stream.on('close', ()=>{
        console.log(table.toString());
        done()
      });
      stream.on('error', done);
      return stream;
    }

   let callback = (data)=>{
     //console.log(`${console.log(data)}`)
    _.forEach (_.get(data, "releases", []) , (r)=>{
        //console.log(`${JSON.stringify(r)}`);
            formatChart(r);
        //console.log(`${prettyJson.render(_.get(r, "name"))}`);
        //console.log(`${prettyJson.render(_.get(r, "info"))}`);
    })
    // call(callback)
     //done();
   }

   stream = call(callback);
   return;


  })

})
