require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./model/User');
const Product = require('./model/Product');
const Order = require('./model/Order');

const users = [
	{
		name: 'Admin User',
		email: 'admin@tapmart.example',
		password: 'Admin@12345',
		role: 'admin',
		verified: true
	},
	{
		name: 'Demo Customer',
		email: 'customer@tapmart.example',
		password: 'Customer@12345',
		role: 'user',
		verified: true
	}
];

const products = [
	{
		name: 'Wireless Headphones',
		description: 'Comfortable Bluetooth headphones with active noise cancellation.',
		price: 79.99,
		category: 'Electronics',
		imageURL: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
		stock: 25,
		rating: 4.5,
		numReviews: 18
	},
	{
		name: 'Everyday Backpack',
		description: 'Water-resistant backpack with a padded laptop compartment.',
		price: 49.99,
		category: 'Bags',
		imageURL: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
		stock: 40,
		rating: 4.2,
		numReviews: 11
	},
	{
		name: 'Ceramic Coffee Mug',
		description: 'Minimal ceramic mug suitable for hot and cold drinks.',
		price: 14.99,
		category: 'Home',
		imageURL: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80',
		stock: 60,
		rating: 4.7,
		numReviews: 24
	}
];

const seedDatabase = async () => {
	if (!process.env.MONGODB_URI) {
		throw new Error('MONGODB_URI is not set in the environment');
	}

	await mongoose.connect(process.env.MONGODB_URI);

	const savedUsers = {};
	for (const userData of users) {
		const password = await bcrypt.hash(userData.password, 12);
		savedUsers[userData.email] = await User.findOneAndUpdate(
			{ email: userData.email },
			{ ...userData, password },
			{ returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
		);
	}

	const savedProducts = [];
	for (const productData of products) {
		savedProducts.push(await Product.findOneAndUpdate(
			{ name: productData.name },
			productData,
			{ returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
		));
	}

	const customer = savedUsers['customer@tapmart.example'];
	const firstProduct = savedProducts[0];
	const secondProduct = savedProducts[1];
	const existingOrder = await Order.findOne({
		user: customer._id,
		'orderItems.product': firstProduct._id,
		status: 'delivered'
	});

	if (!existingOrder) {
		await Order.create({
			user: customer._id,
			orderItems: [
				{ product: firstProduct._id, name: firstProduct.name, qty: 1, price: firstProduct.price },
				{ product: secondProduct._id, name: secondProduct.name, qty: 1, price: secondProduct.price }
			],
			shippingAddress: {
				address: '42 Market Street',
				city: 'Mumbai',
				postalCode: '400001',
				country: 'India'
			},
			paymentMethod: 'cash_on_delivery',
			paymentStatus: 'paid',
			status: 'delivered'
		});
	}

	console.log('Seed data added successfully.');
	console.log('Admin login: admin@tapmart.example / Admin@12345');
	console.log('Customer login: customer@tapmart.example / Customer@12345');
};

seedDatabase()
	.catch((error) => {
		console.error('Seed failed:', error.message);
		process.exitCode = 1;
	})
	.finally(async () => {
		await mongoose.disconnect();
	});
