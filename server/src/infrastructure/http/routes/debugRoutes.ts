import express from 'express';
import { logger } from '../../log/logger';

const router = express.Router();

router.post('/pawnTicket-debug', (req, res) => {
  logger.info('pawnTicket_debug', { body: req.body });
  
  if (req.body.newInventoryItems) {
    req.body.newInventoryItems.forEach((item: any, i: number) => {
      logger.info(`inventory_item_${i}`, {
        categoryId: item.categoryId,
        categoryIdType: typeof item.categoryId,
        isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.categoryId)
      });
    });
  }
  
  res.json({ received: req.body });
});

export default router;
