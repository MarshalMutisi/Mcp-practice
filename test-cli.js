import { spawn } from "child_process";
import path from "path";

// Path to your server.js
const serverPath = path.join(process.cwd(), "dist", "server.js");

console.log(`Starting MCP server at ${serverPath}...`);

const server = spawn("node", [serverPath]);

// Handle server output
server.stderr.on("data", (data) => {
    console.log(`[Server Log]: ${data.toString().trim()}`);
});

server.stdout.on("data", (data) => {
    console.log(`[Server Response]: ${data.toString()}`);
});

// JSON-RPC message to list resources
const listResourcesRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "resources/list",
    params: {}
};

console.log("Sending 'resources/list' request...");
server.stdin.write(JSON.stringify(listResourcesRequest) + "\n");

// JSON-RPC message to read resource 3
const readResourceRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "resources/read",
    params: {
        uri: "users://3"
    }
};

setTimeout(() => {
    console.log("Sending 'resources/read' request for users://3...");
    server.stdin.write(JSON.stringify(readResourceRequest) + "\n");
}, 1000);

// Exit after 5 seconds
setTimeout(() => {
    console.log("Closing test...");
    server.kill();
    process.exit(0);
}, 5000);
