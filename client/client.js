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

const greetClient = new greetPackageDefinition.GreetService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

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

const calcClient = new calcPackageDefinition.CalculatorService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

function callGreeting() {
  const request = {
    greeting: {
      first_name: "Jerry",
      last_name: "Tom",
    },
  };
  greetClient.greet(request, (error, response) => {
    if (!error) {
      console.log("Greeting Response: ", response.result);
    } else {
      console.error(error);
    }
  });
}

function callSum() {
  const sumRequest = {
    first_number: 10,
    second_number: 15,
  };

  calcClient.sum(sumRequest, (error, response) => {
    if (!error) {
      console.log(
        sumRequest.first_number +
          " + " +
          sumRequest.second_number +
          " = " +
          response.sum_result
      );
    } else {
      console.error(error);
    }
  });
}

function main() {
  callGreeting();
  callSum();
}
main();
