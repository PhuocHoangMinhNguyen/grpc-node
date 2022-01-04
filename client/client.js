var greets = require("../server/protos/greet_pb");
var service = require("../server/protos/greet_grpc_pb");

var calc = require("../server/protos/calculator_pb");
var calcService = require("../server/protos/calculator_grpc_pb");

var blogs = require("../server/protos/blog_pb");
var blogService = require("../server/protos/blog_grpc_pb");

var grpc = require("grpc");

let fs = require("fs");

let credentials = grpc.credentials.createSsl(
  fs.readFileSync("../certs/ca.crt"),
  fs.readFileSync("../certs/client.key"),
  fs.readFileSync("../certs/client.crt")
);

let unsafeCreds = grpc.credentials.createInsecure();

function callListBlogs() {
  var client = new blogService.BlogServiceClient(
    "localhost:50051",
    credentials
  );

  var emptyBlogRequest = new blogs.ListBlogRequest();
  var call = client.listBlog(emptyBlogRequest, () => {});

  call.on("data", (response) => {
    console.log("Client Streaming Response ", response.getBlog().toString());
  });

  call.on("error", (error) => {
    console.error(error);
  });

  call.on("end", () => {
    console.log("End");
  });
}

function callCreateBlog() {
  var client = new blogService.BlogServiceClient(
    "localhost:50051",
    credentials
  );

  var blog = new blogs.Blog();
  blog.setAuthor("Johna");
  blog.setTitle("First blog post");
  blog.setContent("This is great...");

  var blogRequest = new blogs.CreateBlogRequest();
  blogRequest.setBlog(blog);

  client.createBlog(blogRequest, (error, response) => {
    if (!error) {
      console.log("Received create blog response", response.toString());
    } else {
      console.error(error);
    }
  });
}

function callReadBlog() {
  var client = new blogService.BlogServiceClient(
    "localhost:50051",
    credentials
  );

  var readBlogRequest = new blogs.ReadBlogRequest();
  readBlogRequest.setBlogId("5");

  client.readBlog(readBlogRequest, (error, response) => {
    if (!error) {
      console.log("Found a blog", response.toString());
    } else {
      if (error.code === grpc.status.NOT_FOUND) {
        console.error("Not Found");
      } else {
        // Do something else ...
        console.error(error);
      }
    }
  });
}

function callUpdateBlog() {
  var client = new blogService.BlogServiceClient(
    "localhost:50051",
    credentials
  );

  var updateBlogRequest = new blogs.UpdateBlogRequest();

  var newBlog = new blogs.Blog();

  newBlog.setId("2");
  newBlog.setAuthor("Garyyyyyyyy");
  newBlog.setTitle("Hello World");
  newBlog.setContent("this is great, again");

  updateBlogRequest.setBlog(newBlog);

  console.log("Blog...", newBlog.toString());

  client.updateBlog(updateBlogRequest, (error, response) => {
    if (!error) {
    } else {
      if (error.code === grpc.status.NOT_FOUND) {
        console.error("Not Found");
      } else {
        // Do something else ...
        console.error(error);
      }
    }
  });
}

function callDeleteBlog() {
  var client = new blogService.BlogServiceClient(
    "localhost:50051",
    credentials
  );

  var deleteBlogRequest = new blogs.DeleteBlogRequest();

  var blogId = "1";

  deleteBlogRequest.setBlogId(blogId);

  client.deleteBlog(deleteBlogRequest, (error, response) => {
    if (!error) {
      console.log("Deleted blog with id:", response.toString());
    } else {
      if (error.code === grpc.status.NOT_FOUND) {
        console.error("Not Found");
      } else {
        // Do something else ...
        console.error(error);
      }
    }
  });
}

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

function callLongGreeting() {
  //
  var client = new service.GreetServiceClient("localhost:50051", credentials);

  var request = new greets.LongGreetRequest();

  var call = client.longGreet(request, (error, response) => {
    if (!error) {
      console.log("Server Response: ", response.getResult());
    } else {
      console.error(error);
    }
  });

  let count = 0,
    intervalId = setInterval(function () {
      console.log("Sending message " + count);

      var request = new greets.LongGreetRequest();
      var greeting = new greets.Greeting();
      greeting.setFirstName("Paulo");
      greeting.setLastName("Dichone");

      request.setGreet(greeting);

      var requestTwo = new greets.LongGreetRequest();
      var greetingTwo = new greets.Greeting();
      greetingTwo.setFirstName("Stephane");
      greetingTwo.setLastName("Maarek");

      requestTwo.setGreet(greetingTwo);

      call.write(request);
      call.write(requestTwo);

      if (++count > 3) {
        clearInterval(intervalId);
        call.end();
      }
    }, 1000);
}

async function sleep(interval) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), interval);
  });
}

async function callGreetEveryone(call, callback) {
  console.log("Hello I'm a gRPC client");

  var client = new service.GreetServiceClient("localhost:50051", credentials);

  var call = client.greetEveryone(request, (error, response) => {
    console.log("Server Response: ", response);
  });

  call.on("data", (response) => {
    console.log("Hello Client !", response.getResult());
  });

  call.on("error", (error) => {
    console.error(error);
  });

  call.on("end", () => {
    console.log("Client The End");
  });

  for (var i = 0; i < 10; i++) {
    var greeting = new greets.Greeting();
    greeting.setFirstName("Stephane");
    greeting.setLastName("Maarek");

    var request = new greets.GreetEveryoneRequest();
    request.setGreet(greeting);

    call.write(request);

    await sleep(1500);
  }
  call.end();
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

function callComputeAverage() {
  var client = new calcService.CalculatorServiceClient(
    "localhost:50051",
    credentials
  );

  // create our request
  var request = new calc.ComputeAverageRequest();

  var call = client.computeAverage(request, (error, response) => {
    if (!error) {
      console.log(
        "Received a response from the server - Average:",
        response.getAverage()
      );
    } else {
      console.error(error);
    }
  });

  var request = new calc.ComputeAverageRequest();
  // request.setNumber(1);

  for (var i = 0; i < 10000; i++) {
    var request = new calc.ComputeAverageRequest();
    request.setNumber(i);
    call.write(request);
  }

  // var requestTwo = new calc.ComputeAverageRequest();
  // requestTwo.setNumber(2);

  // var requestThree = new calc.ComputeAverageRequest();
  // requestThree.setNumber(3);

  // var requestFour = new calc.ComputeAverageRequest();
  // requestFour.setNumber(4);

  // call.write(request);
  // call.write(requestTwo);
  // call.write(requestThree);
  // call.write(requestFour);

  call.end();
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

async function callBiDiFindMaximum() {
  var client = new calcService.CalculatorServiceClient(
    "localhost:50051",
    credentials
  );

  var call = client.findMaximum(request, (error, response) => {});

  call.on("data", (response) => {
    console.log("Got new Max from Server =>", response.getMaximum());
  });

  call.on("error", (error) => {
    console.error(error);
  });

  call.on("end", () => {
    console.log("Server is completed sending messages");
  });

  // data
  let data = [3, 5, 17, 9, 8, 30, 12];
  for (var i = 0; i < data.length; i++) {
    var request = new calc.FindMaximumRequest();
    console.log("Sending number:", data[i]);

    request.setNumber(data[i]);
    call.write(request);
    await sleep(1000);
  }
  call.end(); // we are done sending messages
  await sleep(1000);
}

function main() {
  // callGreeting();
  // callGreetManyTimes();
  // callLongGreeting();
  // callGreetEveryone();
  // callSum();
  // callPrimeNumberDecomposition();
  // callComputeAverage();
  // doErrorCall();
  callBiDiFindMaximum();
  // callListBlogs();
  // callCreateBlog();
  // callReadBlog();
  // callUpdateBlog();
  // callDeleteBlog();
}
main();
