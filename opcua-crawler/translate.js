const fs = require("fs").promises;
const SERVER_IP = "localhost:5050";
const INPUT_FILENAME = "SERVER.json";
const OUTPUT_FILENAME = "td.jsonld";
const userAccessLevel = false;

let TD = {
  id: "PhysicalServe",
  title: "PhysicalServe",
  "@context": "https://www.w3.org/2019/wot/td/v1",
  "@type": "Thing",
  security: ["nosec_sc"],
  securityDefinitions: {
    nosec_sc: {
      scheme: "nosec",
    },
  },
  properties: {},
  actions: {},
  events: {},
};

function getDataType(value) {
  switch (+value) {
    default:
      return "Double";
    case 0:
      return "Null";
    case 1:
      return "Boolean";
    case 2:
      return "SByte";
    case 3:
      return "Byte";
    case 4:
      return "Int16";
    case 5:
      return "UInt16";
    case 6:
      return "Int32";
    case 7:
      return "UInt32";
    case 8:
      return "Int64";
    case 9:
      return "UInt64";
    case 10:
      return "Float";
    case 11:
      return "Double";
    case 12:
      return "String";
    case 13:
      return "DateTime";
    case 14:
      return "Guid";
    case 15:
      return "ByteString";
    case 16:
      return "XmlElement";
    case 17:
      return "NodeId";
    case 18:
      return "ExpandedNodeId";
    case 19:
      return "StatusCode";
    case 20:
      return "QualifiedName";
    case 21:
      return "LocalizedText";
    case 22:
      return "ExtensionObject";
    case 23:
      return "DataValue";
    case 24:
      return "Variant";
    case 25:
      return "DiagnosticInfo";
  }
}

function getAccessLevel(mask, name) {
  if (!mask) {
    return;
  }
  let currentRead = false;
  let currentWrite = false;
  if (mask & 0x01) {
    currentRead = true;
  }
  if (mask & 0x02) {
    currentWrite = true;
  }
  if (!currentRead && currentWrite) {
    return {
      writeOnly: true,
      readOnly: false,
    };
  }
  if (currentRead && !currentWrite) {
    return {
      writeOnly: false,
      readOnly: true,
    };
  }
  if (currentRead && currentWrite) {
    return {
      writeOnly: false,
      readOnly: false,
    };
  }
  return null;
}

function getOPCDataType(value) {
  switch (+value) {
    default:
      return "Double";
    case 0:
      return {
        type: "null",
      };
    case 1:
      return {
        type: "boolean",
      };
    case 2: //SByte
      return {
        type: "number",
        minimum: -128,
        maximum: 127,
      };
    case 3: //Byte
      return {
        type: "number",
        minimum: 0,
        maximum: 255,
      };
    case 4:
      return {
        //int16
        type: "number",
        minimum: -32768,
        maximum: -32767,
      };
    case 5:
      return {
        //uint16
        type: "number",
        minimum: 0,
        maximum: 65535,
      };
    case 6:
      return {
        //int32
        type: "number",
        minimum: -2147483648,
        maximum: -2147483647,
      };
    case 19: //statusCode
    case 7:
      return {
        //uint32
        type: "number",
        minimum: 0,
        maximum: 4294967295,
      };
    case 8:
      return {
        type: "number",
        minimum: -9223372036854775808,
        maximum: 9223372036854775807,
      };
    case 9:
      return {
        //int64
        type: "number",
        minimum: 0,
        maximum: 18446744073709551615,
      };
    case 10:
      return { type: "number" };
    case 11:
      return { type: "number" };
    case 12:
      return { type: "string" };
    case 13:
      return {
        //datetime (timestamp)
        type: "string",
        format: "date-time",
      };
    case 14:
      return {
        //Guid, 16 byte
        type: "object",
        properties: {
          data1: {
            //uint32
            type: "number",
            minimum: 0,
            maximum: 4294967295,
          },
          data2: {
            //uint16
            type: "number",
            minimum: 0,
            maximum: 65535,
          },
          data3: {
            //uint16
            type: "number",
            minimum: 0,
            maximum: 65535,
          },
          data4: {
            type: "array",
            minItems: 8,
            maxItems: 8,
            items: {
              type: "number",
              minimum: 0,
              maximum: 255,
            },
          },
        },
      };
    case 15:
      return { type: "string" }; //ByteString
    case 16:
      return { type: "string" }; //XmlElement
    case 17:
      return {
        //NodeId
        type: "object",
        properties: {
          namespaceIndex: {
            //uint16
            type: "number",
            minimum: 0,
            maximum: 65535,
          },
          identifierType: {
            type: "number",
            enum: [0, 3, 4, 5],
          },
          identifier: {
            anyOf: [
              //uint32, string, guid, bytestring
              {
                //uint32
                type: "number",
                minimum: 0,
                maximum: 4294967295,
              },
              { type: "string" }, //string or bytestring
              { type: "string", format: "uuid" },
            ],
          },
        },
      };
    case 18:
      return {
        //ExpandedNodeId
        type: "object",
        properties: {
          namespaceIndex: {
            //uint16
            type: "number",
            minimum: 0,
            maximum: 65535,
          },
          identifierType: {
            type: "number",
            enum: [0, 3, 4, 5],
          },
          identifier: {
            anyOf: [
              //uint32, string, guid, bytestring
              {
                //uint32
                type: "number",
                minimum: 0,
                maximum: 4294967295,
              },
              { type: "string" }, //string or bytestring
              { type: "string", format: "uuid" },
            ],
          },
          namespaceUri: { type: "string", format: "uri" },
          serverIndex: {
            type: "number",
            minimum: 0,
            maximum: 4294967295,
          },
        },
      };
    case 20:
      return {
        //QualifiedName
        type: "object",
        properties: {
          name: { type: "string" },
          namespaceIndex: {
            type: "number",
            minimum: 0,
            maximum: 65535,
          },
        },
      };
    case 21:
      return {
        //LocalizedText;
        type: "object",
        properties: {
          locale: { type: "string" },
          text: { type: "string" },
        },
      };
    case 22:
      return "ExtensionObject";
    case 23:
      return "DataValue";
    case 24:
      return { type: "object" }; //Variant
    case 25:
      return "DiagnosticInfo";
  }
}

function makeTD(data) {
  try {
    for (el of data) {
      let obj = {};
      let name = el.browseName.name;
      let nodeId = el.nodeId.split(";");
      let ns = nodeId[0].split("=")[1];
      let id_type = nodeId[1].split("=")[0];
      let id = nodeId[1].split("=")[1];
      let dataType = getDataType(el.dataType);
      obj.title = name;
      obj.description = "Simple Value";
      obj.properties = {};
      //obj.properties["type"] = "object";
      obj.properties["type"] = getOPCDataType(el.dataType);
      obj.properties["opc:dataType"] = dataType;
      obj.forms = [];
      let key_access_level = "accessLevel";
      if (userAccessLevel) {
        key_access_level = "userAccessLevel";
      }

      let accessLevel = getAccessLevel(+el[key_access_level], name);
      if (accessLevel) {
        obj = { ...obj, ...accessLevel };
      }

      let form = {};
      form.href =
        "opc.tcp://" + SERVER_IP + "?ns=" + ns + ";" + id_type + "=" + id;
      form.contentType = "application/json";
      obj.forms.push(form);
      TD.properties[el.nodeId] = obj;
    }
    //console.log(TD);
  } catch (err) {
    console.log(err);
  }
}

(async () => {
  try {
    let data = await fs.readFile(INPUT_FILENAME);
    data = JSON.parse(data);
    //console.log(accessLevelFlagToString(AccessLevelFlag.SemanticChange));
    makeTD(data);
    await fs.writeFile(OUTPUT_FILENAME, JSON.stringify(TD, null, 4));
  } catch (err) {
    console.log(err);
  }
})();
