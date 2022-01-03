var greets = require("../server/protos/greet_pb");
var service = require("../server/protos/greet_grpc_pb");

var calc = require("../server/protos/calculator_pb");
var calcService = require("../server/protos/calculator_grpc_pb");

const fs = require("fs");

var grpc = require("grpc");

// Knex requires
const environment = process.env.ENVIRONMENT || "development";
const config = require("/knexfile")[environment];
const knex = require("knex")(config);

function greet(call, callback) {
  var greeting = new greets.GreetResponse();
  greeting.setResult(
    "Hello " +
      call.request.getGreeting().getFirstName() +
      " " +
      call.request.getGreeting().getLastName()
  );
  callback(null, greeting);
}

function greetManyTimes(call, callback) {
  var firstName = call.request.getGreeting().getFirstName();

  let count = 0,
    intervalID = setInterval(function () {
      var greetManyTimesResponse = new greets.GreetManyTimesResponse();
      greetManyTimesResponse.setResult(firstName);

      // setup streaming
      call.write(greetManyTimesResponse);
      if (++count > 9) {
        clearInterval(intervalID);
        call.end(); // we have send all messages !
      }
    }, 1000);
}

function sum(call, callback) {
  var sumResponse = new calc.SumResponse();
  sumResponse.setSumResult(
    call.request.getFirstNumber() + call.request.getSecondNumber()
  );
  callback(null, sumResponse);
}

function primeNumberDecomposition(call, callback) {
  var number = call.request.getNumber();
  var divisor = 2;

  console.log("Received number: ", number);

  while (number > 1) {
    if (number % divisor === 0) {
      var primeNumberDecompositionResponse =
        new calc.PrimeNumberDecompositionResponse();
      primeNumberDecompositionResponse.setPrimeFactor(divisor);
      number = number / divisor;

      // write the message using call.write()
      call.write(primeNumberDecompositionResponse);
    } else {
      divisor++;
      console.log("Divisor has increased to ", divisor);
    }
  }

  call.end(); // all messages end.
}

function squareRoot(call, callback) {
  var number = call.request.getNumber();

  if (number >= 0) {
    var numberRoot = Math.sqrt(number);
    var response = new calc.SquareRootResponse();
    response.setNumberRoot(numberRoot);

    callback(null, response);
  } else {
    // Error handling
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message:
        "The number being sent is not positive " + " Number sent: " + number,
    });
  }
}

function main() {
  let credentials = grpc.ServerCredentials.createSsl(
    fs.readFileSync("../certs/ca.crt"),
    [
      {
        cert_chain: fs.readFileSync("../certs/server.crt"),
        private_key: fs.readFileSync("../certs/server.key"),
      },
    ],
    true
  );

  let unsafeCreds = grpc.ServerCredentials.createInsecure();

  var server = new grpc.Server();
  server.addService(service.GreetServiceService, {
    greet: greet,
    greetManyTimes: greetManyTimes,
  });

  server.addService(calcService.CalculatorServiceService, {
    sum: sum,
    primeNumberDecomposition: primeNumberDecomposition,
    squareRoot: squareRoot,
  });
  server.bind("127.0.0.1:50051", unsafeCreds);
  server.start();

  console.log("Server running on port 127.0.0.1:50051");
}
main();
