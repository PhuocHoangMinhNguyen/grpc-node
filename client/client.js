var grpc = require("grpc");
var services = require("../server/protos/dummy_grpc_pb");

function main() {
  console.log("Hello from Client");
  var client = new services.DummyServiceClient(
    "localhose:50051",
    grpc.credentials.createInsecure()
  );

  // we do stuffs
  console.log("client: ", client);
}
main();
