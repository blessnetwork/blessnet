# Web Sites

Taking advantage of the IPFS and BLESS Network at the Edge, we can serve fast web sites, apis, and static files to users all around the world. 

We can do it easily and quickly using the BLESSNET CLI. In this tutorial we will dive into creating websites on BLESS Net, modifying routes, serving files, and creating a simple API.

## Using JavaScript to build WASM Edge Sites.

If you recall from `Getting Started` tutorial, you'll recall that the BLESS Work is built with the underpinnings of WASM. Utilizing JavaScript on top. 

## Syntax of a BLESS Server

The BLESS Network currently targets in/out style applications, that are not long running. To make this mental model easier, we've developed a framework around the architecture, that also lends itself to long running processes in the future. You should find this syntax familiar as we've modeled it after popular servers such as Express and Fastify.

### Import and Create a WebServer

Import the WebServer helper from the `SDK`, create a `WebServer` object, then start the server's `run` routine.

```javascript
import WebServer from "@blockless/sdk-ts/dist/lib/web";
const server = new WebServer();
server.start();
```

### Registering your first Route

Using the same template as before, we'll register our first route for the root of our application `/`.

```javascript
import WebServer from "@blockless/sdk-ts/dist/lib/web";

const server = new WebServer();

server.get("/", (req, res) => {
	res.send("Hello World from Root /");
});

server.start();
```

### Serving Multiple Routes

Adding new routes to your application is easy, add a new `server.get` and define the path that should be caught when queried from your application.

```javascript
import WebServer from "@blockless/sdk-ts/dist/lib/web";

const server = new WebServer();

server.get("/", (req, res) => {
	res.send("Hello World from Root /");
});

server.get("/other", (req, res) => {
	res.send("Hello World from Root /");
});

server.start();
```