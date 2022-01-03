var greets = require("../server/protos/greet_pb");
var service = require("../server/protos/greet_grpc_pb");

var calc = require("../server/protos/calculator_pb");
var calcService = require("../server/protos/calculator_grpc_pb");

var blogs = require("../server/protos/blog_pb");
var blogService = require("../server/protos/blog_grpc_pb");

const fs = require("fs");

var grpc = require("grpc");

// Knex requires
const environment = process.env.ENVIRONMENT || "development";
const config = require("./knexfile")[environment];
const knex = require("knex")(config);

// Blog CRUD Start
function listBlog(call, callback) {
  console.log("Received list blog request");
  knex("blogs").then((data) => {
    data.forEach((element) => {
      var blog = new blogs.Blog();
      blog.setId(element.id);
      blog.setAuthor(element.author);
      blog.setTitle(element.title);
      blog.setContent(element.content);

      console.log("Blogs", blog.toString());

      var blogResponse = new blogs.ListBlogResponse();
      blogResponse.setBlog(blog);

      // write to the stream
      call.write(blogResponse);
    });
    call.end(); // we are done writing!
  });
}

function createBlog(call, callback) {
  console.log("Received Create Blog Request");

  var blog = call.request.getBlog();

  console.log("Inserting a Blog...");

  knex("blogs")
    .insert({
      author: blog.getAuthor(),
      title: blog.getTitle(),
      content: blog.getContent(),
    })
    .then(() => {
      var id = blog.getId();
      var addedBlog = new blogs.Blog();

      // set the blog response to be returned
      addedBlog.setId(id);
      addedBlog.setAuthor(blog.getAuthor());
      addedBlog.setTitle(blog.getTitle());
      addedBlog.setContent(blog.getContent());

      var blogResponse = new blogs.CreateBlogResponse();

      blogResponse.setBlog(addedBlog);

      console.log("Inserted Blog with ID: ", blogResponse);

      callback(null, blogResponse);
    });
}

function readBlog(call, callback) {
  console.log("Received Blog request");

  // get id
  var blogId = call.request.getBlogId();

  knex("blogs")
    .where({ id: parseInt(blogId) })
    .then((data) => {
      console.log("Searching for a blog...");

      if (data.length) {
        var blog = new blogs.Blog();

        console.log("Blog found and sending message");

        // set the blog response to be returned
        blog.setId(blogId);
        blog.setAuthor(data[0].author);
        blog.setTitle(data[0].title);
        blog.setContent(data[0].content);

        var blogResponse = new blogs.ReadBlogResponse();
        blogResponse.setBlog(blog);

        callback(null, blogResponse);
      } else {
        console.log("Blog not found");
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Blog Not Found!",
        });
      }
    });
}
// Blog CRUD End

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

  // server.addService(service.GreetServiceService, {
  //   greet: greet,
  //   greetManyTimes: greetManyTimes,
  // });

  // server.addService(calcService.CalculatorServiceService, {
  //   sum: sum,
  //   primeNumberDecomposition: primeNumberDecomposition,
  //   squareRoot: squareRoot,
  // });

  server.addService(blogService.BlogServiceService, {
    listBlog: listBlog,
    createBlog: createBlog,
    readBlog: readBlog,
  });

  server.bind("127.0.0.1:50051", unsafeCreds);
  server.start();

  console.log("Server running on port 127.0.0.1:50051");
}
main();
