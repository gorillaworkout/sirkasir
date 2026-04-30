const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Makanan' } }),
    prisma.category.create({ data: { name: 'Minuman' } }),
    prisma.category.create({ data: { name: 'Snack' } }),
    prisma.category.create({ data: { name: 'Peralatan' } }),
    prisma.category.create({ data: { name: 'Lainnya' } }),
  ]);

  // Create products
  const products = [
    { name: 'Beras Premium 5kg', sku: 'BRS-001', categoryId: categories[0].id, price: 75000, costPrice: 65000, stock: 50, unit: 'karung', minStock: 10 },
    { name: 'Minyak Goreng 1L', sku: 'MYK-001', categoryId: categories[0].id, price: 18000, costPrice: 15000, stock: 30, unit: 'botol', minStock: 10 },
    { name: 'Gula Pasir 1kg', sku: 'GLA-001', categoryId: categories[0].id, price: 16000, costPrice: 13000, stock: 25, unit: 'kg', minStock: 10 },
    { name: 'Teh Botol Sosro', sku: 'TEH-001', categoryId: categories[1].id, price: 5000, costPrice: 3500, stock: 100, unit: 'botol', minStock: 20 },
    { name: 'Aqua 600ml', sku: 'AQA-001', categoryId: categories[1].id, price: 4000, costPrice: 2500, stock: 200, unit: 'botol', minStock: 50 },
    { name: 'Kopi Kapal Api', sku: 'KPI-001', categoryId: categories[1].id, price: 2000, costPrice: 1500, stock: 80, unit: 'sachet', minStock: 20 },
    { name: 'Chitato Original', sku: 'CHT-001', categoryId: categories[2].id, price: 12000, costPrice: 9000, stock: 40, unit: 'pcs', minStock: 10 },
    { name: 'Indomie Goreng', sku: 'IDM-001', categoryId: categories[2].id, price: 3500, costPrice: 2800, stock: 150, unit: 'pcs', minStock: 30 },
    { name: 'Sapu Lantai', sku: 'SPU-001', categoryId: categories[3].id, price: 25000, costPrice: 18000, stock: 8, unit: 'pcs', minStock: 3 },
    { name: 'Sabun Cuci Piring', sku: 'SBN-001', categoryId: categories[3].id, price: 8000, costPrice: 5500, stock: 2, unit: 'botol', minStock: 5 },
    { name: 'Plastik Kresek', sku: 'PLK-001', categoryId: categories[4].id, price: 5000, costPrice: 3000, stock: 0, unit: 'pak', minStock: 5 },
    { name: 'Tali Rafia', sku: 'TLR-001', categoryId: categories[4].id, price: 10000, costPrice: 7000, stock: 15, unit: 'gulung', minStock: 3 },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log('Seed completed successfully!');
  console.log(`Created ${categories.length} categories`);
  console.log(`Created ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
