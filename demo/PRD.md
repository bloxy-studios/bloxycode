# Todo API - Demo PRD

A simple Todo REST API built with Express.js and TypeScript.

## Tasks

- [ ] Initialize a new Node.js project with TypeScript and install Express, and create a basic src/index.ts file with a hello world Express server on port 3000
- [ ] Create an in-memory todos array and add a GET /todos endpoint that returns all todos as JSON
- [ ] Add a POST /todos endpoint that accepts { title: string } in the body and creates a new todo with auto-generated id and completed: false
- [ ] Add a PATCH /todos/:id endpoint to toggle the completed status of a todo

## Config

```yaml
testCommand: "curl -s http://localhost:3000/todos"
autoCommit: false
maxRetries: 2
```
