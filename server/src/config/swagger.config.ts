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
                CategorySimple: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
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
    },
    // Scan route files for JSDoc annotations
    apis: [
        './src/interfaces/http/route/**/*.ts',
        './src/interfaces/http/controller/**/*.ts',
    ],
};

export const swaggerSpec = swaggerJsdoc(options);
