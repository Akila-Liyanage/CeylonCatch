import crypto from 'crypto';

// Sign PayHere payment request
export const signPayment = async (req, res) => {
    try {
        const { order_id, amount, currency } = req.body;
        
        // Use PayHere test merchant credentials
        const merchantId = '1219169';
        const merchantSecret = '8aNlV8lP8q';
        
        // PayHere hash algorithm: SHA1(merchant_id + order_id + amount + currency + merchant_secret)
        const hashString = `${merchantId}${order_id}${amount}${currency}${merchantSecret}`;
        const hash = crypto.createHash('sha1').update(hashString).digest('hex').toUpperCase();
        
        res.json({
            merchant_id: merchantId,
            hash: hash
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Handle PayHere notifications
export const handleNotification = async (req, res) => {
    try {
        console.log('PayHere notification received:', req.body);
        res.status(200).send('OK');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
