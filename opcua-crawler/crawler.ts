import { OPCUAClient, NodeCrawler } from "node-opcua";

import { writeFile } from "fs/promises";

const connectionStrategy = {
  //initialDelay: 1000,
  initialDelay: 0,
  maxRetry: 1,
};

/*const options = {
	applicationName: "MyClient",
	connectionStrategy: connectionStrategy,
	securityMode: MessageSecurityMode.None,
	securityPolicy: SecurityPolicy.None,
	endpoint_must_exist: false,
};*/

const options = {
  //securityMode: MessageSecurityMode.SignAndEncrypt,
  //securityPolicy: SecurityPolicy.Basic256Sha256,
  requestedSessionTimeout: 10000,
  applicationName: "NodeOPCUA-Client",
  endpoint_must_exist: false,
  /*certificateFile: "./certificates/client_cert.pem",
	privateKeyFile: "./certificates/client_private_key.pem",
	serverCertificate: crypto_utils.readCertificate("./certificates/server_cert.pem")*/
};

const FILENAME = "SERVER.json";
const client = OPCUAClient.create(options);
let endpointUrl = "opc.tcp://localhost:5050";
//endpointUrl = "opc.tcp://192.168.2.21:4840";

async function main() {
  try {
    // step 1 : connect to
    await client.connect(endpointUrl);
    console.log("connected !");
    const session = await client.createSession();
    console.log("session created !");

    var crawler = new NodeCrawler(session);
    var obj = [];

    crawler.on("browsed", async function (element) {
      if (!element.dataType) {
        return;
      }
      //console.log(AccessLevelFlag.CurrentRead)
      const dataTypeNodeId = element.dataType; //
      try {
        const dataType = await session.getBuiltInDataType(element.nodeId);
        let new_obj: any = {};
        new_obj.nodeId = element.nodeId.toString();
        new_obj.nodeClass = element.nodeClass;
        new_obj.browseName = element.browseName;
        new_obj.displayName = element.displayName;
        new_obj.dataType = dataType;
        new_obj.accessLevel = element.accessLevel;
        new_obj.userAccessLevel = element.userAccessLevel;
        new_obj.valueRank = element.valueRank;
        obj.push(new_obj);
      } catch (err) {
        console.log(err);
      }
      console.log("---!---");
    });

    var nodeId = "ObjectsFolder";
    try {
      crawler.read(nodeId, function (err, obj) {
        if (err) {
          throw err;
        }
      });
    } catch (err) {
      console.log(err);
      console.log(nodeId);
    }

    process.on("SIGINT", async function () {
      await writeFile(FILENAME, JSON.stringify(obj, null, 4));
      process.exit();
    });
    await timeout(100000);
    // close session
    await session.close();

    // disconnect
    await client.disconnect();
    console.log("done !");
  } catch (err) {
    console.log("An error has occured : ", err);
  }
}
async function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
main();
