require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./config/prisma');

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
		price: 6599,
		category: 'Electronics',
		tags: ['wireless', 'bluetooth', 'headphones', 'noise cancellation', 'audio'],
		imageURL: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
		stock: 25,
	},
	{
		name: 'Everyday Backpack',
		description: 'Water-resistant backpack with a padded laptop compartment.',
		price: 2499,
		category: 'Bags',
		tags: ['backpack', 'laptop bag', 'travel', 'water resistant'],
		imageURL: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
		stock: 40,
	},
	{
		name: 'Ceramic Coffee Mug',
		description: 'Minimal ceramic mug suitable for hot and cold drinks.',
		price: 499,
		category: 'Home',
		tags: ['coffee', 'mug', 'ceramic', 'kitchen', 'drinkware'],
		imageURL: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80',
		stock: 60,
	}
];

const seedDatabase = async () => {
	console.log('Seeding Supabase PostgreSQL database via Prisma...');

	const savedUsers = {};
	for (const userData of users) {
		const password = await bcrypt.hash(userData.password, 12);
		savedUsers[userData.email] = await prisma.user.upsert({
			where: { email: userData.email },
			update: { name: userData.name, password, role: userData.role, verified: userData.verified },
			create: { name: userData.name, email: userData.email, password, role: userData.role, verified: userData.verified }
		});
	}

	const savedProducts = [];
	for (const productData of products) {
		const existingProduct = await prisma.product.findFirst({ where: { name: productData.name } });
		if (existingProduct) {
			savedProducts.push(await prisma.product.update({
				where: { id: existingProduct.id },
				data: productData
			}));
		} else {
			savedProducts.push(await prisma.product.create({
				data: productData
			}));
		}
	}

	const customer = savedUsers['customer@tapmart.example'];
	const firstProduct = savedProducts[0];
	const secondProduct = savedProducts[1];

	const existingOrder = await prisma.order.findFirst({
		where: {
			userId: customer.id,
			status: 'delivered'
		}
	});

	if (!existingOrder) {
		const subtotal = firstProduct.price + secondProduct.price;
		await prisma.order.create({
			data: {
				userId: customer.id,
				paymentMethod: 'cash_on_delivery',
				paymentStatus: 'paid',
				status: 'delivered',
				subtotal,
				taxPrice: 0,
				shippingPrice: 0,
				totalPrice: subtotal,
				shippingAddress: {
					create: {
						address: '42 Market Street',
						city: 'Mumbai',
						postalCode: '400001',
						country: 'India'
					}
				},
				orderItems: {
					create: [
						{ productId: firstProduct.id, name: firstProduct.name, qty: 1, price: firstProduct.price },
						{ productId: secondProduct.id, name: secondProduct.name, qty: 1, price: secondProduct.price }
					]
				}
			}
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
		await prisma.$disconnect();
	});
