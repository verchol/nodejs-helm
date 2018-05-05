const assert      = require('assert');
const fs          = require('fs');
const path        = require('path');
const _           = require('lodash');
const prettyJson  = require('prettyjson');
const googleProtoFilesDir = require('google-proto-files')('..');

let main = async ()=>{

let deployYaml = await readDeploy('./deploy/demo/templates/deployment.yaml');
let helpersFile =  await readDeploy('./deploy/demo/templates/_helpers.tpl');
let valuesYaml = await readDeploy('./deploy/demo/values.yaml');

assert(metadata);
let chart = {};
let chartMeta = {
   apiVersion: "v1",
   description: "A Helm chart for Kubernetes",
   name: "demo23",
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
_.set(chart, "templates" , [chartTemplate, helpers]);
_.set(chart, "values"   , {
  raw:  "replicaCount: 1\nimage:\n  repository: nginx\n  tag: stable\n  pullPolicy: IfNotPresent\nservice:\n  name: nginx\n  type: ClusterIP\n  externalPort: 80\n  internalPort: 80\ningress:\n  enabled: false\n  hosts:\n    - chart-example.local\nresources: {}\n",
  values: {}
});


//_.set(chart, "files"   , [{"type_url": "templates/deploy.yaml", value: deployYaml}]);

let call = client.installRelease({chart , dry_run: true, name : "bbbb5"}, metadata, (err, data)=>{
  console.log(err);
  done(err);
})
call.on('status', (data)=>{
  console.log(`on OLEG ${JSON.stringify(data)}`)
});
}
