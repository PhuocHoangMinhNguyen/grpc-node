const path = require("path");
const protoLoader = require("@grpc/proto-loader");
const grpc = require("grpc");

// grpc service definition for greet
const greetProtoPath = path.join(__dirname, "..", "protos", "greet.proto");
const greetProtoDefinition = protoLoader.loadSync(greetProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const greetPackageDefinition =
  grpc.loadPackageDefinition(greetProtoDefinition).greet;

// grpc service definition for calculator
const calcProtoPath = path.join(__dirname, "..", "protos", "calculator.proto");
const calcProtoDefinition = protoLoader.loadSync(calcProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const calcPackageDefinition =
  grpc.loadPackageDefinition(calcProtoDefinition).calculator;

/*
  Implement the greet RPC method
*/
function greet(call, callback) {
  const firstName = call.request.greeting.first_name;
  const lastName = call.request.greeting.last_name;

  callback(null, { result: "Hello " + firstName + " " + lastName });
}

function sum(call, callback) {
  const first_number = call.request.first_number;
  const second_number = call.request.second_number;
  callback(null, { sum_result: first_number + second_number });
}

function main() {
  const server = new grpc.Server();
  server.addService(greetPackageDefinition.GreetService.service, {
    greet: greet,
  });
  server.addService(calcPackageDefinition.CalculatorService.service, {
    sum: sum,
  });
  server.bind("127.0.0.1:50051", grpc.ServerCredentials.createInsecure());
  server.start();

  console.log("Server running on port 127.0.0.1:50051");
}
main();
