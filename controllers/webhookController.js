// controllers/webhookController.js

exports.crossmintWebhook = (req, res) => {
    if (req.method === "POST") {
        console.log(`[webhook] Successfully received event: ${JSON.stringify(req.body)}`);
        // Handle the event (e.g., update database, send notifications, etc.)
    }
    res.status(200).json({ message: 'Event received' });
};
