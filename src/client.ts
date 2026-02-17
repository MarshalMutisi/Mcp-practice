import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CreateMessageRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the server script
const serverPath = path.join(__dirname, "server.js");

async function main() {
    const transport = new StdioClientTransport({
        command: "node",
        args: [serverPath],
    });

    const client = new Client(
        {
            name: "example-client",
            version: "1.0.0",
        },
        {
            capabilities: {
                sampling: {}, // Enable sampling capability
            },
        }
    );

    // Set up the sampling handler
    // This allows the server to ask the client to generate a message (e.g., using an LLM)
    client.setRequestHandler(CreateMessageRequestSchema, async (request) => {
        console.error("\n[Client] Received sampling request from server:");
        console.error(JSON.stringify(request.params, null, 2));

        // In a real application, you would pass this to an LLM like Gemini or GPT-4.
        // For this example, we'll provide a mock response.
        return {
            role: "assistant",
            content: {
                type: "text",
                text: "This is a mock AI response from the client's sampling handler. The person is very interesting!",
            },
        };
    });

    await client.connect(transport);
    console.log("Connected to MCP server");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const showMenu = () => {
        console.log("\n--- MCP Client Menu ---");
        console.log("1. List Tools");
        console.log("2. Create User");
        console.log("3. Summarize User (Sampling)");
        console.log("4. List Resources");
        console.log("5. Read Resource (users://all)");
        console.log("0. Exit");
        rl.question("Choose an option: ", handleInput);
    };

    const handleInput = async (input: string) => {
        switch (input) {
            case "1":
                const tools = await client.listTools();
                console.log("\nAvailable Tools:", JSON.stringify(tools, null, 2));
                break;
            case "2":
                rl.question("Name: ", (name) => {
                    rl.question("Email: ", (email) => {
                        rl.question("Address: ", (address) => {
                            rl.question("Phone: ", async (phone) => {
                                const result = await client.callTool({
                                    name: "create-user",
                                    arguments: { name, email, address, phone },
                                });
                                console.log("\nResult:", JSON.stringify(result, null, 2));
                                showMenu();
                            });
                        });
                    });
                });
                return; // Return early as readline is async
            case "3":
                rl.question("User ID to summarize: ", async (id) => {
                    const result = await client.callTool({
                        name: "summarize-user",
                        arguments: { id: parseInt(id) },
                    });
                    console.log("\nResult:", JSON.stringify(result, null, 2));
                    showMenu();
                });
                return;
            case "4":
                const resources = await client.listResources();
                console.log("\nAvailable Resources:", JSON.stringify(resources, null, 2));
                break;
            case "5":
                const resourceData = await client.readResource({ uri: "users://all" });
                console.log("\nResource Data:", JSON.stringify(resourceData, null, 2));
                break;
            case "0":
                console.log("Exiting...");
                await client.close();
                rl.close();
                process.exit(0);
            default:
                console.log("Invalid option");
        }
        showMenu();
    };

    showMenu();
}

main().catch((error) => {
    console.error("Fatal error in client:", error);
    process.exit(1);
});
