var greets = require("../server/protos/greet_pb");
var service = require("../server/protos/greet_grpc_pb");

var calc = require("../server/protos/calculator_pb");
var calcService = require("../server/protos/calculator_grpc_pb");

var grpc = require("grpc");

function callGreeting() {
  var client = new service.GreetServiceClient(
    "localhost:50051",
    grpc.credentials.createInsecure()
  );

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
  var client = new service.GreetServiceClient(
    "localhost:50051",
    grpc.credentials.createInsecure()
  );

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
    grpc.credentials.createInsecure()
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
    grpc.credentials.createInsecure()
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

function main() {
  callPrimeNumberDecomposition();
  // callGreetManyTimes();
  // callGreeting();
  // callSum();
}
main();
