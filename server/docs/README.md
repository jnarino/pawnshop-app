# Pawnshop API Documentation Index

## 📚 Complete Documentation Suite

This folder contains comprehensive guides for developing and maintaining the Pawnshop API.

---

## 🎯 Quick Start

**New to the project?** Start here:
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the overall design
2. Use [CHEATSHEET.md](./CHEATSHEET.md) for quick templates
3. Follow [ENDPOINT_CREATION_GUIDE.md](./ENDPOINT_CREATION_GUIDE.md) step-by-step

**Need to add a new endpoint?**
→ [CHEATSHEET.md](./CHEATSHEET.md) has copy-paste templates

**Want to understand Swagger documentation?**
→ [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md) explains everything

---

## 📖 Documentation Files

### 1. [ARCHITECTURE.md](./ARCHITECTURE.md)
**Visual Guide to Project Architecture**

Learn about:
- Complete request flow diagram
- Layer responsibilities and rules
- Dependency direction
- CQRS pattern (Command vs Query)
- Transaction handling
- Testing strategy

**Use when:** You need to understand how the system works

---

### 2. [ENDPOINT_CREATION_GUIDE.md](./ENDPOINT_CREATION_GUIDE.md)
**Complete Step-by-Step Guide**

Detailed walkthrough covering:
- Architecture overview
- 8 steps to create any endpoint
- Domain, Infrastructure, Application, Interface layers
- Complete checklist
- Patterns by endpoint type (Query, Command, etc.)
- Folder structure conventions
- Naming conventions
- Testing patterns
- Best practices

**Use when:** Creating a new endpoint for the first time

---

### 3. [CHEATSHEET.md](./CHEATSHEET.md)
**Quick Reference with Templates**

Contains:
- Ready-to-use code templates for all layers
- File naming conventions
- Common query patterns (list all, get by id, search, etc.)
- Common command patterns (create, update, delete)
- SQL file locations
- Testing template
- Quick checklist

**Use when:** You know the pattern and just need the template

---

### 4. [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md)
**API Documentation with Swagger**

Explains:
- How swagger-jsdoc works
- Setup and configuration
- How to document endpoints
- JSDoc comment syntax
- Schema definitions
- Examples for all HTTP methods
- Migration strategy
- Best practices

**Use when:** Adding API documentation to routes

---

### 5. [SWAGGER_QUICKREF.md](./SWAGGER_QUICKREF.md)
**Swagger Quick Reference**

Quick reference for:
- Template for new endpoints
- Common patterns
- Checklist
- Common mistakes
- Tips and tricks

**Use when:** You need a quick Swagger template

---

## 🎓 Learning Path

### Beginner
1. Start with [ARCHITECTURE.md](./ARCHITECTURE.md) → understand the big picture
2. Follow [ENDPOINT_CREATION_GUIDE.md](./ENDPOINT_CREATION_GUIDE.md) → create your first endpoint
3. Read [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md) → document your endpoint

### Intermediate
1. Use [CHEATSHEET.md](./CHEATSHEET.md) → copy templates for faster development
2. Reference [SWAGGER_QUICKREF.md](./SWAGGER_QUICKREF.md) → quick documentation

### Expert
1. Keep [CHEATSHEET.md](./CHEATSHEET.md) open while coding
2. Contribute to improving these guides!

---

## 🔍 Find What You Need

### I want to...

#### Create a new GET endpoint
→ [CHEATSHEET.md - Query Patterns](./CHEATSHEET.md#common-query-patterns)

#### Create a new POST endpoint
→ [CHEATSHEET.md - Command Patterns](./CHEATSHEET.md#common-command-patterns)

#### Understand the architecture
→ [ARCHITECTURE.md](./ARCHITECTURE.md)

#### See the complete flow
→ [ARCHITECTURE.md - Request Flow](./ARCHITECTURE.md#complete-request-flow-diagram)

#### Get code templates
→ [CHEATSHEET.md](./CHEATSHEET.md)

#### Document an endpoint
→ [SWAGGER_QUICKREF.md](./SWAGGER_QUICKREF.md)

#### Understand layers
→ [ARCHITECTURE.md - Layer Responsibilities](./ARCHITECTURE.md#layer-responsibilities)

#### Know what files to create
→ [ENDPOINT_CREATION_GUIDE.md - Folder Structure](./ENDPOINT_CREATION_GUIDE.md#folder-structure-pattern)

#### Learn naming conventions
→ [ENDPOINT_CREATION_GUIDE.md - Naming Conventions](./ENDPOINT_CREATION_GUIDE.md#naming-conventions)

#### Test my use cases
→ [CHEATSHEET.md - Testing Template](./CHEATSHEET.md#testing-template)

#### Handle transactions
→ [ARCHITECTURE.md - Transaction Handling](./ARCHITECTURE.md#transaction-handling)

---

## 🏗️ Project Structure Overview

```
server/
├── src/
│   ├── domains/              # Business entities & interfaces
│   ├── infrastructure/       # Database, external services
│   ├── application/          # Business logic, DTOs, mappers
│   └── interfaces/           # HTTP controllers, routes
│
├── tests/
│   ├── unit/                 # Use case tests
│   └── integration/          # API tests
│
└── docs/                     # ← You are here!
    ├── README.md             # This file
    ├── ARCHITECTURE.md       # Visual architecture guide
    ├── ENDPOINT_CREATION_GUIDE.md  # Step-by-step tutorial
    ├── CHEATSHEET.md         # Quick templates
    ├── SWAGGER_GUIDE.md      # API documentation guide
    └── SWAGGER_QUICKREF.md   # Swagger quick reference
```

---

## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript
npm test                 # Run tests

# View API Documentation
# Start server, then open: http://localhost:3001/api-docs
```

---

## 📋 Endpoint Creation Checklist

Use this whenever creating a new endpoint:

- [ ] **Domain:** Add method to repository interface
- [ ] **Infrastructure:** Create SQL file
- [ ] **Infrastructure:** Implement repository method
- [ ] **Application:** Create request DTO (with Zod)
- [ ] **Application:** Create response DTO
- [ ] **Application:** Add mapper function
- [ ] **Application:** Create use case
- [ ] **Interface:** Add controller method
- [ ] **Interface:** Add route with Swagger docs
- [ ] **Container:** Wire dependencies
- [ ] **Test:** Verify in Swagger UI

---

## 💡 Pro Tips

1. **Copy, Don't Create From Scratch**
   - Find a similar endpoint
   - Copy and modify
   - Faster and more consistent

2. **Follow the Layers**
   - Always start from Domain (inside)
   - Work your way out to Interface
   - Never skip layers

3. **Keep It Simple**
   - Controllers are thin
   - Use cases have business logic
   - Repositories only access data

4. **Use the Templates**
   - [CHEATSHEET.md](./CHEATSHEET.md) has everything
   - Replace `{Resource}` with your entity name
   - Follow naming conventions

5. **Test As You Go**
   - Build after each layer
   - Test in Swagger UI
   - Write unit tests for use cases

---

## 🔧 Troubleshooting

### Build fails
- Check imports and file paths
- Run `npm run build` to see TypeScript errors
- Verify all interfaces are implemented

### Endpoint not found (404)
- Check route registration in container
- Verify route path matches Swagger docs
- Check middleware order

### Validation errors
- Verify Zod schema matches input
- Check DTO field names
- Review console errors

### SQL errors
- Check SQL file path in `loadSql()`
- Verify parameter count matches
- Test SQL in database directly

---

## 🤝 Contributing

When you discover a better pattern or practice:
1. Update the relevant guide
2. Add examples
3. Share with the team

Keep these guides up-to-date as the project evolves!

---

## 📞 Need Help?

1. **Check the guides** - Answer is probably here
2. **Look at existing code** - Find similar examples
3. **Ask the team** - We're here to help!

---

## 🎯 Remember

**The architecture is designed to be:**
- ✅ Testable
- ✅ Maintainable
- ✅ Flexible
- ✅ Understandable
- ✅ Scalable

**Keep it that way by:**
- Following the layer separation
- Using dependency injection
- Writing tests
- Documenting as you code
- Staying consistent

---

**Happy Coding! 🚀**
