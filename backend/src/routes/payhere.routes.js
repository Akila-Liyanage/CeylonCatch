import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Helper to format amount to 2 decimals as required by PayHere
const formatAmount = (amount) => {
    if (typeof amount === 'number') return amount.toFixed(2);
    const n = Number(amount || 0);
    return n.toFixed(2);
};

router.post('/sign', (req, res) => {
    try {
        const merchantId = process.env.PAYHERE_MERCHANT_ID;
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
        const { order_id, amount, currency } = req.body || {};

        if (!merchantId) return res.status(400).json({ error: 'PAYHERE_MERCHANT_ID is not configured on the server' });
        if (!merchantSecret) return res.status(400).json({ error: 'PAYHERE_MERCHANT_SECRET is not configured on the server' });
        if (!order_id || !amount || !currency) {
            return res.status(400).json({ error: 'Missing required fields: order_id, amount, currency' });
        }

        const amountStr = formatAmount(amount);
        const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        const hash = crypto
            .createHash('md5')
            .update(merchantId + order_id + amountStr + currency + hashedSecret)
            .digest('hex')
            .toUpperCase();

        return res.json({ hash, merchant_id: merchantId });
    } catch (err) {
        console.error('PayHere sign error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PayHere notify callback (server-to-server). Ensure this URL is publicly reachable in production.
router.post('/notify', (req, res) => {
    try {
        // TODO: validate the notification with your own order store if needed
        console.log('PayHere notify payload:', req.body);
        res.status(200).send('OK');
    } catch (e) {
        console.error('PayHere notify error:', e);
        res.status(200).send('OK');
    }
});

export default router;


