import { db } from './utils/database';
import { User, UserRole } from './models/User';
import { Auction, AuctionStatus } from './models/Auction';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed the database with sample data for testing
 */
export function seedDatabase() {
  console.log('Seeding database with sample data...');

  // Create sample users
  const seller = db.createUser({
    id: 'seller-1',
    email: 'seller@example.com',
    name: 'John Seller',
    role: UserRole.SELLER,
    createdAt: new Date(),
  });

  const buyer1 = db.createUser({
    id: 'buyer-1',
    email: 'buyer1@example.com',
    name: 'Alice Buyer',
    role: UserRole.BUYER,
    createdAt: new Date(),
  });

  const buyer2 = db.createUser({
    id: 'buyer-2',
    email: 'buyer2@example.com',
    name: 'Bob Buyer',
    role: UserRole.BUYER,
    createdAt: new Date(),
  });

  const buyer3 = db.createUser({
    id: 'buyer-3',
    email: 'buyer3@example.com',
    name: 'Charlie Buyer',
    role: UserRole.BUYER,
    createdAt: new Date(),
  });

  console.log(`✓ Created ${4} users`);

  // Create sample auctions
  const now = new Date();
  
  // Active auction 1
  const auction1 = db.createAuction({
    id: 'test-auction-1',
    sellerId: seller.id,
    title: 'Vintage MacBook Pro 2015',
    description: 'Fully functional MacBook Pro in excellent condition. Perfect for students!',
    startingBid: 100,
    currentBid: 100,
    minBidIncrement: 10,
    status: AuctionStatus.ACTIVE,
    startTime: new Date(now.getTime() - 3600000), // Started 1 hour ago
    endTime: new Date(now.getTime() + 86400000), // Ends in 24 hours
    createdAt: now,
    updatedAt: now,
  });

  // Active auction 2
  const auction2 = db.createAuction({
    id: 'test-auction-2',
    sellerId: seller.id,
    title: 'Textbooks: Computer Science Bundle',
    description: 'Collection of CS textbooks including algorithms, data structures, and more.',
    startingBid: 50,
    currentBid: 50,
    minBidIncrement: 5,
    status: AuctionStatus.ACTIVE,
    startTime: new Date(now.getTime() - 1800000), // Started 30 minutes ago
    endTime: new Date(now.getTime() + 43200000), // Ends in 12 hours
    createdAt: now,
    updatedAt: now,
  });

  // Active auction 3
  const auction3 = db.createAuction({
    id: 'test-auction-3',
    sellerId: seller.id,
    title: 'Bicycle - Mountain Bike',
    description: 'Great condition mountain bike, perfect for campus commuting.',
    startingBid: 200,
    currentBid: 200,
    minBidIncrement: 20,
    status: AuctionStatus.ACTIVE,
    startTime: new Date(now.getTime() - 7200000), // Started 2 hours ago
    endTime: new Date(now.getTime() + 172800000), // Ends in 48 hours
    createdAt: now,
    updatedAt: now,
  });

  console.log(`✓ Created ${3} auctions`);

  console.log('\n📊 Sample Data Summary:');
  console.log('Users:');
  console.log(`  - Seller: ${seller.name} (${seller.id})`);
  console.log(`  - Buyer 1: ${buyer1.name} (${buyer1.id})`);
  console.log(`  - Buyer 2: ${buyer2.name} (${buyer2.id})`);
  console.log(`  - Buyer 3: ${buyer3.name} (${buyer3.id})`);
  console.log('\nAuctions:');
  console.log(`  - ${auction1.title} (${auction1.id})`);
  console.log(`    Starting bid: $${auction1.startingBid}, Min increment: $${auction1.minBidIncrement}`);
  console.log(`  - ${auction2.title} (${auction2.id})`);
  console.log(`    Starting bid: $${auction2.startingBid}, Min increment: $${auction2.minBidIncrement}`);
  console.log(`  - ${auction3.title} (${auction3.id})`);
  console.log(`    Starting bid: $${auction3.startingBid}, Min increment: $${auction3.minBidIncrement}`);
  console.log('\n✅ Database seeded successfully!\n');
}
