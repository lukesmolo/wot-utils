const { OPCUAServer, DataType, Variant, StatusCodes } = require("node-opcua");
const { readCertificate } = require("node-opcua-crypto");

const auth = null;
//const auth = 'password';
//const auth = 'certificate';

const userManager = {
  isValidUser: function (userName, password) {
    return userName === "root" && password === "root";
  },
};

// Let's create an instance of OPCUAServer

(async () => {
  try {
    const server = new OPCUAServer({
      port: 5050, // the port of the listening socket of the server
      resourcePath: "/opcua/server", // this path will be added to the endpoint resource name
      allowAnonymous: true,
      userManager: auth === "password" ? userManager : null,
    });

    await server.initialize();

    constructAddressSpace(server);

    console.log("initialized");

    await server.start();

    if (auth === "certificate") {
      const clientCertificate = readCertificate(
        "./certificates/client_cert.pem"
      );
      await server.userCertificateManager.trustCertificate(clientCertificate);
    }

    console.log("Server is now listening ... ( press CTRL+C to stop)");
    console.log(
      " the primary server endpoint url is ",
      server.getEndpointUrl()
    );

    process.once("SIGINT", () => {
      server.shutdown(() => {
        console.log("server has been shutdown");
        process.exit(0);
      });
    });
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
})();

function constructAddressSpace(server) {
  const addressSpace = server.engine.addressSpace;
  const namespace = addressSpace.getOwnNamespace();

  // OBJECTS
  const device = namespace.addObject({
    organizedBy: addressSpace.rootFolder.objects,
    nodeId: "s=WotDevice",
    browseName: "WotDevice",
    targetName: {
      namespaceIndex: 1,
      name: "device",
    },
  });

  // VARIABLES
  const incrementVariable = namespace.addVariable({
    componentOf: device,
    nodeId: "s=WotDevice.Increment",
    browseName: "Increment",
    dataType: "Double",
  });
  let variable = 1;
  setInterval(function () {
    variable += 1;
    incrementVariable.setValueFromSource({
      dataType: DataType.Double,
      value: variable,
    });
  }, 1000);

  namespace.addVariable({
    nodeId: "s=RandomValue",
    browseName: "RandomValue",
    dataType: "Double",
    value: {
      get: function () {
        return new Variant({
          dataType: DataType.Double,
          value: Math.random(),
        });
      },
      set: function (variant) {
        //write property
        variable1 = parseFloat(variant.value);
        return StatusCodes.Good;
      },
    },
  });

  const divideMethod = namespace.addMethod(device, {
    //invoke action
    browseName: "Divide",
    nodeId: "s=Divide",
    inputArguments: [
      {
        name: "a",
        description: { text: "specifies the first number" },
        dataType: DataType.Double,
      },
      {
        name: "b",
        description: { text: "specifies the second number" },
        dataType: DataType.Double,
      },
    ],

    outputArguments: [
      {
        name: "result",
        description: { text: "the result of the division operation" },
        dataType: DataType.Double,
      },
    ],
  });

  divideMethod.bindMethod(async (inputArguments, context) => {
    const a = inputArguments[0].value;
    const b = inputArguments[1].value;
    if (b === 0) {
      return { statusCode: StatusCodes.BadInvalidArgument };
    }
    let res = a / b;
    return {
      statusCode: StatusCodes.Good,
      outputArguments: [
        {
          dataType: DataType.Double,
          value: res,
        },
      ],
    };
  });

  const squareMethod = namespace.addMethod(device, {
    //invoke action
    browseName: "Square",
    nodeId: "s=Square",
    inputArguments: [
      {
        name: "value",
        description: { text: "specifies the first number" },
        dataType: DataType.Double,
      },
    ],

    outputArguments: [
      {
        name: "result",
        description: { text: "the result of the square function" },
        dataType: DataType.Double,
      },
    ],
  });

  squareMethod.bindMethod(async (inputArguments, context) => {
    const a = inputArguments[0].value;
    let res = a * a;
    return {
      statusCode: StatusCodes.Good,
      outputArguments: [
        {
          dataType: DataType.Double,
          value: res,
        },
      ],
    };
  });
}
