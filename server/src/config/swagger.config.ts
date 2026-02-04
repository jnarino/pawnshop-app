import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

import fs from 'fs';
import path from 'path';

export const options: swaggerJsdoc.Options = {
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
                PawnTicketCurrentChargesResponseDto: {
                    type: 'object',
                    properties: {
                        pawnTicketId: { type: 'string' },
                        currentCharges: { type: 'number' },
                        pawnAmount: { type: 'number' },
                        periodsBehind: { type: 'number' },
                        redemptionAmount: { type: 'number' }
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
                        }
                    },
                },
                TenderType: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        legacyCode: { type: 'string', nullable: true },
                        active: { type: 'boolean' },
                    },
                },
                PoliceHoldResponseDto: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    controlNumber: { type: 'string' },
                    customerId: { type: 'string' },
                    holdDate: { type: 'string' },
                    agency: { type: 'string' },
                    caseNumber: { type: 'string' },
                    dateOut: { type: 'string', nullable: true },
                    isHold: { type: 'boolean' },
                    isInventory: { type: 'boolean' },
                    comment: { type: 'string', nullable: true },
                    agentLastName: { type: 'string', nullable: true },
                    agentFirstName: { type: 'string', nullable: true },
                    agentMiddleInitial: { type: 'string', nullable: true },
                    badgeNumber: { type: 'string', nullable: true },
                    phoneAreaCode: { type: 'string', nullable: true },
                    phoneNumber: { type: 'string', nullable: true },
                    phoneExtension: { type: 'string', nullable: true },
                    jurisdiction: { type: 'string', nullable: true },
                    legacyHcnId: { type: 'string', nullable: true },
                    updatedBy: { type: 'string', nullable: true },
                    customerName: { type: 'string', nullable: true },
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                inventoryItemId: { type: 'string' },
                                inventoryNumber: { type: 'string', nullable: true },
                                model: { type: 'string', nullable: true },
                                serialNumber: { type: 'string', nullable: true },
                                itemDescription: { type: 'string', nullable: true }
                            }
                        }
                    }
                  }
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

// Logic to load static swagger.json if available (for bundled environments)
let spec;
const staticPath = path.join(__dirname, 'swagger.json');
const staticPathCwd = path.join(process.cwd(), 'swagger.json'); // Check CWD too

if (fs.existsSync(staticPath)) {
    console.log('[Swagger] Loading static spec from:', staticPath);
    spec = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
} else if (fs.existsSync(staticPathCwd)) {
    console.log('[Swagger] Loading static spec from CWD:', staticPathCwd);
    spec = JSON.parse(fs.readFileSync(staticPathCwd, 'utf8'));
} else {
    // Fallback to dynamic generation
    spec = swaggerJsdoc(options);
}

export const swaggerSpec = spec;

export const swaggerUiOptions = {
    swaggerOptions: {
        persistAuthorization: true,
        responseInterceptor: (response: any) => {
            // Check if this is the login response
            if (response.url.endsWith('/api/auth/login') && response.status === 200) {
                try {
                    const body = response.body;
                    if (body.accessToken) {
                        const token = `Bearer ${body.accessToken}`;
                        // Programmatically set the authorization
                        // @ts-ignore
                        window.ui.preauthorizeApiKey("bearerAuth", token);
                        console.log('[Swagger Auto-Auth] Token set automatically');
                    }
                } catch (e) {
                    console.error('[Swagger Auto-Auth] Failed to set token', e);
                }
            }
            return response;
        }
    }
};
