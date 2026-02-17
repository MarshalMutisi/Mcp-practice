import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new McpServer(
    {
        name: "test",
        version: "1.0.0",
    }
);
const DATA_FILE = path.join(__dirname, "..", "src", "data", "users.json");

async function createUser(user: {
    name: string;
    email: string;
    address: string;
    phone: string;
}) {
    let users = [];
    try {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        users = JSON.parse(data);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.error(`File not found: ${DATA_FILE}. Initializing directory...`);
            await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
        } else {
            console.error("Error reading users.json:", error);
            throw error;
        }
    }

    const id = users.length > 0 ? Math.max(...users.map((u: any) => u.id)) : 0;
    const nextId = id + 1;
    const newUser = { ...user, id: nextId };
    users.push(newUser);

    await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
    return newUser;
}

server.resource(
    "users",
    "users://all",
    { description: "List all users" },
    async (uri) => {
        try {
            const data = await fs.readFile(DATA_FILE, "utf-8");
            return {
                contents: [{
                    uri: uri.href,
                    text: data,
                    mimeType: "application/json"
                }]
            };
        } catch (error) {
            console.error("Error reading users.json:", error);
            return {
                contents: [{
                    uri: uri.href,
                    text: "[]",
                    mimeType: "application/json"
                }]
            };
        }
    }
);

server.resource(
    "user",
    new ResourceTemplate("users://{id}", { list: undefined }),
    { description: "Get a user by ID" },
    async (uri, { id }) => {
        try {
            const data = await fs.readFile(DATA_FILE, "utf-8");
            const users = JSON.parse(data);
            const user = users.find((u: any) => u.id === Number(id));

            if (!user) {
                throw new Error(`User with ID ${id} not found`);
            }

            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify(user, null, 2),
                    mimeType: "application/json"
                }]
            };
        } catch (error: any) {
            console.error("Error retrieving user:", error);
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify({ error: error.message }, null, 2),
                    mimeType: "application/json"
                }]
            };
        }
    }
);

server.prompt(
    "create-fake",
    "Generate a fake user",
    {},
    async () => {
        return {
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: "Please generate a realistic fake user (name, email, address, and phone number). Once generated, use the 'create-user' tool to save them to the database."
                }
            }]
        };
    }
);

server.tool(
    "create-user",
    "Create a new user in the database",
    {
        name: z.string().describe("The name of the user"),
        email: z.string().describe("The email of the user"),
        address: z.string().describe("The address of the user"),
        phone: z.string().describe("The phone number of the user"),
    },
    async (params) => {
        try {
            const newUser = await createUser(params);
            return {
                content: [{ type: "text", text: `User ${newUser.id} created successfully` }]
            };
        } catch (error) {
            console.error("Error creating user:", error);
            return {
                content: [{ type: "text", text: "Error creating user" }],
                isError: true
            };
        }
    }
);

server.tool(
    "summarize-user",
    "Generate a 1-sentence bio for a user using AI sampling",
    {
        id: z.number().describe("The ID of the user to summarize"),
    },
    async (params) => {
        try {
            const data = await fs.readFile(DATA_FILE, "utf-8");
            const users = JSON.parse(data);
            const user = users.find((u: any) => u.id === params.id);

            if (!user) {
                return {
                    content: [{ type: "text", text: `User with ID ${params.id} not found` }],
                    isError: true
                };
            }

            // Call the AI (Sampling) via the underlying server instance
            const response = await server.server.createMessage({
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Write a short, 1-sentence funny bio for this person based on their info: ${JSON.stringify(user)}. Mention their name.`
                        }
                    }
                ],
                maxTokens: 100,
            });

            const bio = response.content.type === "text" ? response.content.text : "Could not generate bio";

            return {
                content: [{ type: "text", text: `AI Generated Bio: ${bio}` }]
            };
        } catch (error: any) {
            console.error("Error summarizing user:", error);
            return {
                content: [{ type: "text", text: `Error during sampling: ${error.message}` }],
                isError: true
            };
        }
    }
);


async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
