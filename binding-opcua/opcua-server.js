const opcua = require("node-opcua");
const crypto_utils = require("node-opcua-crypto");

var auth = null;
//var auth = 'password';
//var auth = 'certificate';

const userManager = {

	isValidUser: function (userName, password) {
		return ( userName === "root" && password === "root" );
	}
};


// Let's create an instance of OPCUAServer
const server = new opcua.OPCUAServer({
	port: 5050, // the port of the listening socket of the server
	resourcePath: "/opcua/server", // this path will be added to the endpoint resource name
	allowAnonymous: true,
	certificateFile: "./certificates/server_cert.pem",
	privateKeyFile: "./certificates/server_key.pem",
	userManager: auth === "password" ? userManager: null
});


(async () => {
	await server.initialize();
	construct_my_address_space(server);
	console.log("initialized");
	await server.start();
	if(auth === "certificate") {
		const clientCertificate = crypto_utils.readCertificate('./certificates/client_cert.pem');
		await server.userCertificateManager.trustCertificate(clientCertificate);
	}

	console.log("Server is now listening ... ( press CTRL+C to stop)");
	console.log("port ", server.endpoints[0].port);

	const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
	console.log(" the primary server endpoint url is ", endpointUrl);
})();

function construct_my_address_space(server) {

	const addressSpace = server.engine.addressSpace;
	const namespace = addressSpace.getOwnNamespace();


	// OBJECTS
	const device = namespace.addObject({
		organizedBy: addressSpace.rootFolder.objects,
		nodeId: "ns=1;b=9990FFAA", // some opaque NodeId in namespace 4
		browseName: "WotDevice",
		targetName: {
			namespaceIndex: 1,
			name: "device"
		},
	});

	// VARIABLES

	let variable = 1;
	setInterval(function(){  variable += 1; }, 1000);

	namespace.addVariable({
		componentOf: device,
		nodeId: "ns=1;b=9998FFAA", // some opaque NodeId in namespace 4
		browseName: "Increment",
		dataType: "Double",
		value: {
			get: function () {
				return new opcua.Variant({dataType: opcua.DataType.Double, value: variable });
			}
		}
	});


	namespace.addVariable({
		nodeId: "ns=1;b=9999FFAA",
		browseName: "RandomValue",
		dataType: "Double",
		value: {
			get: function () {
				return new opcua.Variant({dataType: opcua.DataType.Double, value: Math.random()});
			},
			set: function (variant) { //write property
				variable1 = parseFloat(variant.value);
				return opcua.StatusCodes.Good;
			}
		}
	});

	const method = namespace.addMethod(device, { //invoke action

		browseName: "DivideFunction",
		nodeId: "ns=1;b=9997FFAA",
		inputArguments:  [
			{
				name:"a",
				description: { text: "specifies the first number" },
				dataType: opcua.DataType.Double
			},{
				name:"b",
				description: { text: "specifies the second number" },
				dataType: opcua.DataType.Double
			}
		],

		outputArguments: [{
			name: "division",
			description:{ text: "the generated barks" },
			dataType: opcua.DataType.Double,
			valueRank: 1
		}]
	});

	method.bindMethod((inputArguments,context,callback) => {

		const a = inputArguments[0].value;
		const b =  inputArguments[1].value;

		let res = a/b;
		const callMethodResult = {
			statusCode: opcua.StatusCodes.Good,
			outputArguments: [{
				dataType: opcua.DataType.Double,
				value: res
			}]
		};
		callback(null,callMethodResult);
	});

	const method1 = namespace.addMethod(device, { //invoke action

		browseName: "SquareFunction",
		nodeId: "ns=1;s=squareFunction",
		inputArguments:  [
			{
				name: "value",
				description: { text: "specifies the first number" },
				dataType: opcua.DataType.Double
			}
		],

		outputArguments: [{
			name: "square",
			description:{ text: "the generated barks" },
			dataType: opcua.DataType.Double,
			valueRank: 1
		}]
	});

	method1.bindMethod((inputArguments,context,callback) => {

		const a = inputArguments[0].value;

		let res = a*a;
		const callMethodResult = {
			statusCode: opcua.StatusCodes.Good,
			outputArguments: [{
				dataType: opcua.DataType.Double,
				value: res
			}]
		};
		callback(null,callMethodResult);
	});

}
