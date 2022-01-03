var greets = require("../server/protos/greet_pb");
var service = require("../server/protos/greet_grpc_pb");

var calc = require("../server/protos/calculator_pb");
var calcService = require("../server/protos/calculator_grpc_pb");

var grpc = require("grpc");

let fs = require("fs");

let credentials = grpc.credentials.createSsl(
  fs.readFileSync("../certs/ca.crt"),
  fs.readFileSync("../certs/client.key"),
  fs.readFileSync("../certs/client.crt")
);

let unsafeCreds = grpc.credentials.createInsecure();

function getRPCDeadline(rpcType) {
  timeAllowed = 5000;

  switch (rpcType) {
    case 1:
      timeAllowed = 1000;
      break;
    case 2:
      timeAllowed = 7000;
      break;
    default:
      console.log("Invalid RPC Type: Using Default Timeout");
  }
  return new Date(Date.now() + timeAllowed);
}

function callGreeting() {
  var client = new service.GreetServiceClient("localhost:50051", credentials);

  // create our request
  var request = new greets.GreetRequest();

  // create a protocol buffer
  var greeting = new greets.Greeting();
  greeting.setFirstName("Jerry");
  greeting.setLastName("Tom");

  request.setGreeting(greeting);

  client.greet(request, (error, response) => {
    if (!error) {
      console.log("Greeting Response: ", response.getResult());
    } else {
      console.error(error);
    }
  });
}

function callGreetManyTimes() {
  var client = new service.GreetServiceClient("localhost:50051", credentials);

  // create request

  var request = new greets.GreetManyTimesRequest();

  var greeting = new greets.Greeting();
  greeting.setFirstName("Paulo");
  greeting.setLastName("Dichone");
  request.setGreeting(greeting);

  var call = client.greetManyTimes(request, () => {});

  call.on("data", (response) => {
    console.log("Client Streaming Response: ", response.getResult());
  });

  call.on("status", (status) => {
    console.log(status.details);
  });

  call.on("error", (error) => {
    console.error(error.details);
  });

  call.on("end", () => {
    console.log("Streaming end.");
  });
}

function callSum() {
  var client = new calcService.CalculatorServiceClient(
    "localhost:50051",
    credentials
  );

  // create our request
  var sumRequest = new calc.SumRequest();

  sumRequest.setFirstNumber(10);
  sumRequest.setSecondNumber(15);

  client.sum(sumRequest, (error, response) => {
    if (!error) {
      console.log(
        sumRequest.getFirstNumber() +
          " + " +
          sumRequest.getSecondNumber() +
          " = " +
          response.getSumResult()
      );
    } else {
      console.error(error);
    }
  });
}

function callPrimeNumberDecomposition() {
  var client = new calcService.CalculatorServiceClient(
    "localhost:50051",
    credentials
  );

  var request = new calc.PrimeNumberDecompositionRequest();

  var number = 567890;

  request.setNumber(number);

  var call = client.primeNumberDecomposition(request, () => {});

  call.on("data", (response) => {
    console.log("Prime Factors Found: ", response.getPrimeFactor());
  });

  call.on("error", (error) => {
    console.error(error);
  });

  call.on("status", (status) => {
    console.log(status);
  });

  call.on("end", () => {
    console.log("Streaming End.");
  });
}

function doErrorCall() {
  var deadline = getRPCDeadline(1);

  var client = new calcService.CalculatorServiceClient(
    "localhost:50051",
    credentials
  );

  var number = 25;
  var squareRootRequest = new calc.SquareRootRequest();
  squareRootRequest.setNumber(number);

  client.squareRoot(
    squareRootRequest,
    { deadline: deadline },
    (error, response) => {
      if (!error) {
        console.log("Square root is", response.getNumberRoot());
      } else {
        console.error(error.message);
      }
    }
  );
}

function main() {
  // callGreeting();
  // callSum();
  // callGreetManyTimes();
  // callPrimeNumberDecomposition();
  doErrorCall();
}
main();
