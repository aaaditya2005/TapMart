const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');
const cloudinary = require('../config/cloudinary');

const formatRupees = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const createReceiptPdf = (order, user, filePath) => new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 50 });
    const output = fs.createWriteStream(filePath);
    output.on('finish', resolve);
    output.on('error', reject);
    document.on('error', reject);
    document.pipe(output);

    document.fontSize(22).text('TapMart', { bold: true });
    document.fontSize(11).text('Payment receipt');
    document.moveDown();
    const transactionId = order.razorpayPaymentId || `COD-${order._id}`;
    const receiptId = order.receiptId || `TM-REC-${order._id}`;
    document.fontSize(10).text(`Receipt ID: ${receiptId}`);
    document.text(`Transaction ID: ${transactionId}`);
    document.text(`Receipt for order: ${order._id}`);
    document.text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
    document.text(`Customer: ${user.name || 'TapMart customer'}`);
    document.text(`Email: ${user.email || ''}`);
    document.moveDown();
    document.fontSize(13).text('Items', { underline: true });
    document.moveDown(0.5);

    for (const item of order.orderItems) {
        document.fontSize(10).text(`${item.name} x ${item.qty}    ${formatRupees(item.price * item.qty)}`);
    }

    document.moveDown();
    document.text(`Subtotal: ${formatRupees(order.subtotal)}`);
    document.text(`Tax: ${formatRupees(order.taxPrice)}`);
    document.text(`Delivery: ${formatRupees(order.shippingPrice)}`);
    document.fontSize(12).text(`Total paid: ${formatRupees(order.totalPrice)}`, { bold: true });
    document.moveDown();
    document.fontSize(10).text(`Payment method: ${order.paymentMethod}`);
    document.text(`Payment status: ${order.paymentStatus}`);
    document.text(`Delivery address: ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`);
    document.moveDown();
    document.text('Thank you for shopping with TapMart.');
    document.end();
});

const uploadReceipt = async (order, user) => {
    const filePath = path.join(os.tmpdir(), `tapmart-receipt-${order._id}.pdf`);
    try {
        await createReceiptPdf(order, user, filePath);
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'raw',
            folder: 'tapmart/receipts',
            public_id: `receipt_${order._id}`,
            format: 'pdf',
            overwrite: true
        });
        return cloudinary.utils.private_download_url(result.public_id, 'pdf', {
            resource_type: 'raw',
            type: 'upload',
            attachment: false
        });
    } finally {
        await fs.promises.rm(filePath, { force: true });
    }
};

module.exports = uploadReceipt;
