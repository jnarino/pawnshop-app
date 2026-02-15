import { options } from '../src/config/swagger.config';
import swaggerJsdoc from 'swagger-jsdoc';

const spec = swaggerJsdoc(options);
console.info(JSON.stringify(spec, null, 2));
