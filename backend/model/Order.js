const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
}, { _id: true });

orderItemSchema.virtual('lineTotal').get(function () {
    return this.qty * this.price;
});

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        orderItems: [orderItemSchema],
        shippingAddress: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true }
        },
        paymentMethod: {
            type: String,
            enum: ['cash_on_delivery', 'razorpay'],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        razorpayOrderId: {
            type: String,
            sparse: true
        },
        razorpayPaymentId: {
            type: String,
            sparse: true
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
            default: 0.0
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0.0
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
            default: 0.0
        },
        paidAt: {
            type: Date
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
            index: true
        },
        deliveredAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

orderSchema.pre('validate', function () {
    this.subtotal = this.orderItems.reduce((sum, item) => sum + item.qty * item.price, 0);
    this.totalPrice = this.subtotal + this.taxPrice + this.shippingPrice;

    if (this.paymentStatus === 'paid' && !this.paidAt) {
        this.paidAt = new Date();
    }
    if (this.status === 'delivered' && !this.deliveredAt) {
        this.deliveredAt = new Date();
    }
});

module.exports = mongoose.model('Order', orderSchema);