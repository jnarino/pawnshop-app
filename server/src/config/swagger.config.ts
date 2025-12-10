import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Pawnshop Express API',
            version: '1.0.0',
            description: 'API documentation for the Pawnshop Express application',
        },
        servers: [
            {
                url: `http://localhost:${env.port}`,
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                LoginRequest: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string' },
                        password: { type: 'string' },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                username: { type: 'string' },
                                role: { type: 'string' },
                            },
                        },
                    },
                },
                AppUser: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        username: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        roleId: { type: 'integer' },
                        isActive: { type: 'boolean' },
                    },
                },
                Customer: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        phoneNumber: { type: 'string' },
                        email: { type: 'string' },
                        streetAddress: { type: 'string' },
                        city: { type: 'string' },
                        stateUs: { type: 'string' },
                        zipCode: { type: 'string' },
                    },
                },
                InventoryItem: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        inventoryNumber: { type: 'string' },
                        serialNumber: { type: 'string' },
                        description: { type: 'string' },
                        categoryId: { type: 'string' },
                        status: { type: 'string' },
                        cost: { type: 'number' },
                        retailPrice: { type: 'number' },
                    },
                },
                InventoryCategory: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                        parentId: { type: 'string', nullable: true },
                        depth: { type: 'integer' },
                    },
                },
                PawnTicket: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        controlNumber: { type: 'string' },
                        transactionType: { type: 'string', enum: ['PAWN', 'PURCHASE'] },
                        customerId: { type: 'string' },
                        amountFinanced: { type: 'number' },
                        transactionDate: { type: 'string', format: 'date-time' },
                        maturityDate: { type: 'string', format: 'date-time' },
                        pawnStatus: { type: 'string' },
                        itemIds: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        paths: {
            '/api/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login user',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginRequest' },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Login successful',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/LoginResponse' },
                                },
                            },
                        },
                    },
                },
            },
            '/api/auth/refresh': {
                post: {
                    tags: ['Auth'],
                    summary: 'Refresh access token',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        refreshToken: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Token refreshed',
                        },
                    },
                },
            },
            '/api/auth/logout': {
                post: {
                    tags: ['Auth'],
                    summary: 'Logout user',
                    security: [], // Logout might not strictly require auth if just clearing client side, but usually does for server invalidation. Assuming public for now based on summary.
                    responses: {
                        200: { description: 'Logged out successfully' },
                    },
                },
            },
            '/api/app-users': {
                get: {
                    tags: ['App Users'],
                    summary: 'List all users',
                    responses: {
                        200: {
                            description: 'List of users',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/AppUser' },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ['App Users'],
                    summary: 'Create new user',
                    description: 'Requires admin or manager role',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AppUser' },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'User created' },
                    },
                },
            },
            '/api/app-users/{id}': {
                put: {
                    tags: ['App Users'],
                    summary: 'Update user',
                    description: 'Requires admin or manager role',
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AppUser' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'User updated' },
                    },
                },
                delete: {
                    tags: ['App Users'],
                    summary: 'Delete user',
                    description: 'Requires admin or manager role',
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: { description: 'User deleted' },
                    },
                },
            },
            '/api/customer': {
                get: {
                    tags: ['Customers'],
                    summary: 'Search customers',
                    parameters: [
                        {
                            in: 'query',
                            name: 'q',
                            schema: { type: 'string' },
                            description: 'Search query',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Search results',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Customer' },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ['Customers'],
                    summary: 'Create customer',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Customer' },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Customer created' },
                    },
                },
            },
            '/api/customer/search': {
                get: {
                    tags: ['Customers'],
                    summary: 'Search customers (grid)',
                    parameters: [
                        {
                            in: 'query',
                            name: 'q',
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Search results',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Customer' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/customer/{id}': {
                get: {
                    tags: ['Customers'],
                    summary: 'Get customer by ID',
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Customer details',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Customer' },
                                },
                            },
                        },
                    },
                },
                put: {
                    tags: ['Customers'],
                    summary: 'Update customer',
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Customer' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Customer updated' },
                    },
                },
                delete: {
                    tags: ['Customers'],
                    summary: 'Delete customer',
                    description: 'Requires admin or manager role',
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: { description: 'Customer deleted' },
                    },
                },
            },
            '/api/inventory-items': {
                post: {
                    tags: ['Inventory Items'],
                    summary: 'Create inventory item',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/InventoryItem' },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Item created' },
                    },
                },
            },
            '/api/inventory-items/{id}': {
                get: {
                    tags: ['Inventory Items'],
                    summary: 'Get item by ID',
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Item details',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/InventoryItem' },
                                },
                            },
                        },
                    },
                },
                put: {
                    tags: ['Inventory Items'],
                    summary: 'Update inventory item',
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/InventoryItem' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Item updated' },
                    },
                },
                delete: {
                    tags: ['Inventory Items'],
                    summary: 'Delete inventory item',
                    description: 'Requires admin or manager role',
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: { description: 'Item deleted' },
                    },
                },
            },
            '/api/inventory-items/by-inventory-number/{inventoryNumber}': {
                get: {
                    tags: ['Inventory Items'],
                    summary: 'Get by inventory number',
                    parameters: [
                        {
                            in: 'path',
                            name: 'inventoryNumber',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Item details',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/InventoryItem' },
                                },
                            },
                        },
                    },
                },
            },
            '/api/inventory-items/by-serial-number/{serialNumber}': {
                get: {
                    tags: ['Inventory Items'],
                    summary: 'Get by serial number',
                    parameters: [
                        {
                            in: 'path',
                            name: 'serialNumber',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Item details',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/InventoryItem' },
                                },
                            },
                        },
                    },
                },
            },
            '/api/category': {
                post: {
                    tags: ['Inventory Categories'],
                    summary: 'Create category',
                    description: 'Requires admin or manager role',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/InventoryCategory' },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Category created' },
                    },
                },
            },
            '/api/category/tree': {
                get: {
                    tags: ['Inventory Categories'],
                    summary: 'Get full category tree',
                    responses: {
                        200: {
                            description: 'Category tree',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/InventoryCategory' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/pawn-ticket': {
                post: {
                    tags: ['Pawn Tickets'],
                    summary: 'Create pawn ticket with items',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/PawnTicket' },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Ticket created' },
                    },
                },
            },
            '/api/pawn-ticket/control/{controlNumber}': {
                get: {
                    tags: ['Pawn Tickets'],
                    summary: 'List by control number',
                    parameters: [
                        {
                            in: 'path',
                            name: 'controlNumber',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Ticket list',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/PawnTicket' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/pawn-ticket/customer/{customerId}': {
                get: {
                    tags: ['Pawn Tickets'],
                    summary: 'List all by customer',
                    parameters: [
                        {
                            in: 'path',
                            name: 'customerId',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Customer tickets',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/PawnTicket' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/pawn-ticket/customer/{customerId}/active': {
                get: {
                    tags: ['Pawn Tickets'],
                    summary: 'List active by customer',
                    parameters: [
                        {
                            in: 'path',
                            name: 'customerId',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Active customer tickets',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/PawnTicket' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/health': {
                get: {
                    tags: ['Health'],
                    summary: 'Health check',
                    security: [],
                    responses: {
                        200: {
                            description: 'Server is healthy',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'ok' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    apis: [], // We are defining paths manually above
};

export const swaggerSpec = swaggerJsdoc(options);
