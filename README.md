# Mcp-practice

This repository contains an implementation of a Model Context Protocol (MCP) server and client from scratch.

## Features

- **MCP Server**: Implements a user management system with:
  - Tools: `create-user`, `summarize-user`.
  - Resources: `users://all`, `users://{id}`.
  - Prompts: `create-fake`.
- **MCP Client**: A TypeScript-based interactive CLI that can:
  - List and call server tools.
  - Read server resources.
  - Handle **AI Sampling** requests from the server.

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Build the project**:
   ```bash
   npm run build
   ```
3. **Run the client**:
   ```bash
   npm run client
   ```

## Reference
This project was inspired by the [WebDevSimplified MCP Course](https://github.com/WebDevSimplified/mcp-server-and-client.git).
