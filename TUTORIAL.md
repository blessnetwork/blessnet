# Blessnet in the Node / NPM ecosystem

Blessnet is a powerful tool designed to streamline your development workflow for dApps. By leveraging the capabilities of Node.js, Blessnet provides a seamless experience for managing your projects, dependencies, and runtime environments. 

This guide will walk you through the process of setting up Blessnet, installing necessary components, and creating your first project.

This is a basic tutorial, show casing the smallest building blocks of the BLESS VM Stack.


## Install NVM

Node Version Manager (NVM) is a tool that allows you to manage multiple versions of Node.js on your machine. To install NVM, follow these steps:

1. **Download and install NVM**:
    You can install NVM using the following cURL command:
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    ```

2. **Load NVM**:
    After installation, you need to load NVM. Add the following lines to your shell profile (`~/.bashrc`, `~/.zshrc`, `~/.profile`, or `~/.bash_profile`):
    ```bash
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
    ```

3. **Restart your terminal**:
    Close and reopen your terminal or run:
    ```bash
    source ~/.bashrc
    ```

4. **Verify installation**:
    To verify that NVM has been installed correctly, run:
    ```bash
    nvm --version
    ```

Once NVM is installed, you can use it to install and manage different versions of Node.js.


## Install Node/NPM and set as default
To ensure you have Node.js version 18.18 installed and set as the default version using NVM, follow these steps:

1. **Install Node.js 18.18**:
    Use NVM to install Node.js version 18.18 by running:
    ```bash
    nvm install 18.18.0
    ```

2. **Set Node.js 18.18 as the default version**:
    After installing, set Node.js 18.18 as the default version:
    ```bash
    nvm alias default 18.18.0
    ```

3. **Verify the default Node.js version**:
    To ensure that Node.js 18.18 is set as the default version, run:
    ```bash
    node -v
    ```
    This should output `v18.18.0`.

By following these steps, you will have Node.js version 18.18 installed and set as the default version on your machine.

## Install BLESS Net

Blessnet will need to install a few extra componments to help with development. Namely the `Bless Secure Runtime`. You can complete this step by running the blessnet CLI for the first time. The CLI will ask if it is ok to install.

```bash
npx blessnet
```

The results should resemble:

```bash
➜ npx blessnet
Need to install the following packages:
blessnet@1.0.15
Ok to proceed? (y) y
BLESS environment not found. Do you want to install it? (yes/no): y
✔ Installation successful.
BLESS environment installed successfully.
You can now use the `blessnet` command.
```

You now have the `blessnet` environment installed! 

## Making your first project

Making your first project is very easy! Simply run

```bash
npx blessnet init
```

Follow the prompts to finalize a project structure and `cd` into your project directory.

## How does the project look

After initializing your project, the structure should look like this:

```text
.
├── bls.toml              # Project configuration file
├── index.ts              # Entry point of the application
├── package.json          # JavaScript packages and scripts
├── tsconfig.base.json    # Base TypeScript configuration
├── tsconfig.debug.json   # TypeScript configuration for debugging
└── tsconfig.release.json # TypeScript configuration for release
```

- `bls.toml`: This file contains the configuration settings for your Blessnet project.
- `index.ts`: This is the main entry point of your application where the execution begins.
- `package.json`: This file manages the dependencies and scripts for your project.
- `tsconfig.base.json`, `tsconfig.debug.json`, `tsconfig.release.json`: These files contain the TypeScript configurations for different environments.

This is a vanilla TypeScript project, providing a clean and organized structure to start building your dApp with Blessnet.

## WASM, The Bless Network and Javy

We need to take a moment to discuss how a project works on the Bless Network. The Bless Network operates agnostically of the underlying architecture. A large portion of BLESS runs inside Chrome Extensions, other portions of the network operate on x86, amd64, and even arm64 processors.

### To achieve this, The Bless Network leverages WASM. 

WebAssembly (WASM) is a binary instruction format for a stack-based virtual machine. It is designed to be a portable compilation target for programming languages, enabling deployment on the web for client and server applications. WASM allows code to run at near-native speed across different platforms, making it an ideal choice for the diverse environments in which the Bless Network operates.

Now that you know a little bit about how the Bless Network leverages WASM to run your software on all different types of distributed servers, let's discuss how we use JavaScript to make writing dApps easier!

Javy is a portable JavaScript Engine that compiles JavaScript to WASM, making it easier to write WASM applications compared to using languages like Rust, Go, or C++. With Javy, you can leverage a significant portion of the npm ecosystem, allowing you to use familiar JavaScript libraries and tools in your dApp development. 

This reduces the learning curve and accelerates the development process, enabling you to focus on building features rather than dealing with the complexities of lower-level languages.


## Back to the scheduled programming

### Previewing your app

In the BLESS Network, the simplest way to get output of a program, is to return  to `stdout`, you may know this as `console.log` in javascript.

Looking at `index.ts` well simply see

```javascript
console.log('hello world')
```

If want to build this program and execute it on the Bless VM stack, we can use the preview command!

```bash
npx bless preview
```

We'll see the output like below

```bash
➜ npx blessnet preview 
Build file not found, running build...

> myfoo@1.0.0 build:debug
> mkdir -p ./build/ && bls-sdk-ts build ./index.ts -o ./build -f debug.wasm

✔ JS build successfully.
✔ WASM build successfully.
✔ Cleanup successful.
hello world!
```
### As a web server return

One of the common things, is writing functions that will return to the user as a website. We'll cover how you can deploy to a public cloud a little bit later, but to preview your handy work in the web browser you can simply run the `preview serve` command!

```bash
npx bless preview serve
```

The output of the command will look like

```bash
➜ npx blessnet preview serve
Server listening at http://localhost:3000
```

Visit the URL in your web browser to get access to the output served through the `Dev Ingress`.

### Returning other data types

While returning text is useful, sometimes there is a need to return either well structured data, or even HTML back to the user when using the Ingress is needed. 

This change this, simply run the manage command.

```bash
npx blessnet manage type json
```

Now instead of text, the ingress will plan on sending JSON as the return type to the client.

### Update the project to send some simple JSON

Now back to that `index.ts` file that was originally sending out text. We'll simply change it out for a simple JSON object.

```js
console.log('{"msg":"hello world"}')
```

Now we'll run the preview server

```bash
npx blessnet preview serve
```

And we'll visit the URL provided in the output. You'll see now the type sent is JSON, along with your new data.

You can return `html` as well as `raw` p2p responses from the BLESS Network.

`html`, `raw`, `json`, and `text` are available return types. Unsure? just type `npx blessnet manage type`

## Go Live! Publish to the Interwebs!

Now that you've made the project, you've learned how to return some simple data types we'll publish this to the information distributed super highway. 

We're going to take that `WASM` file and we'll package it with a manifest to upload to IPFS through a `BLESS Network` gateway. This means we're picking up the tab to store this assembly. Slow down though cowboy, it's limited to 10mb and the gateway will inspect the contents. 

To publish simply run 

```bash
npx blessnet deploy
```

If successful you'll see an output like so

```bash
➜ npx blessnet deploy 
⠋ Deploying project ...
> myfoo@1.0.0 build:release
> mkdir -p ./build/ && bls-sdk-ts build ./index.ts -o ./build -f release.wasm

✔ JS build successfully.
✔ WASM build successfully.
✔ Cleanup successful.
✔ Deployment successful.

Deployment Results:

CID: bafybeidi54boha3czm3at2u7dc7cjyj5cjqppkffasdsweehjxjowjkt5gq

Deployment URL: https://brown-narwhal-christy-owjkasewgq.bls.dev

!!! WARNING: !!!

Backup and don't share the ** bless-deploy.key ** file in the project root
This is the 'password' to update the deployment URL to a new version of 
the project when it is redeployed.
```

Take note of your friendly url, you can share this around to execute this function and send the return type back to the user as a publically accessible trigger.

We've returned you to published CID for IPFS as well, so you can verify the contents of the package.

### I see this big red text, and bless-deploy.key

`Bless Network` is permissionless, decentralized, and out of anyone's control. The community is free to stand up it's own nodes, and translation ingress'. As such, you should keep track of the `bls-deploy.key`, as this file will allow you to update the function that was deployed on `IPFS` to the existing `Ingress Name`. 

## Some other items of reguard

Now that you've finished the tutorial and you are ready to go build, let's take a step back to recap what you've learned, and finalize some other topics we introduced at the start of the tutorial.

### Summary of What We Learned

In this tutorial, we covered the following key points:

1. **Installing NVM**: We learned how to install and configure Node Version Manager (NVM) to manage multiple versions of Node.js on your machine.
2. **Installing Node.js and NPM**: We installed Node.js version 18.18 and set it as the default version using NVM.
3. **Installing Blessnet**: We installed Blessnet and its dependencies, including the Bless Secure Runtime, using the Blessnet CLI.
4. **Creating a Project**: We created a new Blessnet project and explored its structure, including key configuration files.
5. **Understanding WASM and Javy**: We discussed how the Bless Network leverages WebAssembly (WASM) and Javy to run applications across different platforms.
6. **Previewing and Serving the App**: We learned how to preview and serve our application using the Blessnet CLI, including returning different data types like JSON and HTML.
7. **Deploying to the Web**: We deployed our project to the web using IPFS through a Bless Network gateway, making it publicly accessible.

By following this tutorial, you now have a solid foundation for developing and deploying dApps using Blessnet.

### What is IPFS, CIDs and how does the Ingress work with them?

At the end of the tutorial, you heard that we bundle and upload things to IPFS, we've recieved a CID, and we know that there is a friendly URL that we call the "Ingress".

IPFS (Interplanitary File System) is a peer-to-peer network for storing and sharing data in a distributed file system. It allows users to host and access files in a decentralized manner, meaning there is no central server. Instead, files are distributed across multiple nodes.

CIDs (Content Identifiers) are unique identifiers used in IPFS to reference files. Unlike traditional URLs, which point to a location, CIDs point to the content itself. This means that even if the file is moved to a different location, its CID remains the same as long as the content is unchanged.

The ingress is a simple peice of open source software, that calls into a `BLESS Network` RPC, and executes a FaaS (Function as a Service) program, and then returns the response to a user on the traditional Web.
