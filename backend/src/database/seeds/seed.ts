import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Note } from '../../modules/notes/entities/note.entity';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'multi_tenant_crm',
    entities: [Organization, User, Customer, Note],
    synchronize: false,
  });

  await dataSource.initialize();

  console.log('🌱 Starting seed...');

  // Create Organizations
  const org1 = dataSource.getRepository(Organization).create({
    name: 'Acme Corporation',
  });
  await dataSource.getRepository(Organization).save(org1);

  const org2 = dataSource.getRepository(Organization).create({
    name: 'TechStart Inc',
  });
  await dataSource.getRepository(Organization).save(org2);

  console.log('✅ Organizations created');

  // Create Users for Org1
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin1 = dataSource.getRepository(User).create({
    name: 'John Admin',
    email: 'admin@acme.com',
    password: hashedPassword,
    role: 'admin',
    organizationId: org1.id,
  });
  await dataSource.getRepository(User).save(admin1);

  const member1 = dataSource.getRepository(User).create({
    name: 'Jane Member',
    email: 'jane@acme.com',
    password: hashedPassword,
    role: 'member',
    organizationId: org1.id,
  });
  await dataSource.getRepository(User).save(member1);

  const member2 = dataSource.getRepository(User).create({
    name: 'Bob Smith',
    email: 'bob@acme.com',
    password: hashedPassword,
    role: 'member',
    organizationId: org1.id,
  });
  await dataSource.getRepository(User).save(member2);

  // Create Users for Org2
  const admin2 = dataSource.getRepository(User).create({
    name: 'Alice Admin',
    email: 'admin@techstart.com',
    password: hashedPassword,
    role: 'admin',
    organizationId: org2.id,
  });
  await dataSource.getRepository(User).save(admin2);

  console.log('✅ Users created');
  console.log('📧 Login credentials:');
  console.log('   Org1 Admin: admin@acme.com / password123');
  console.log('   Org1 Member: jane@acme.com / password123');
  console.log('   Org1 Member: bob@acme.com / password123');
  console.log('   Org2 Admin: admin@techstart.com / password123');

  // Create Customers for Org1
  const customers1: Customer[] = [];
  for (let i = 1; i <= 10; i++) {
    const customer = dataSource.getRepository(Customer).create({
      name: `Customer ${i}`,
      email: `customer${i}@example.com`,
      phone: `555-000${i.toString().padStart(2, '0')}`,
      organizationId: org1.id,
      assignedTo: i <= 3 ? member1.id : i <= 6 ? member2.id : undefined,
    });
    customers1.push(customer);
  }
  await dataSource.getRepository(Customer).save(customers1);

  // Create Customers for Org2
  const customers2: Customer[] = [];
  for (let i = 1; i <= 5; i++) {
    const customer = dataSource.getRepository(Customer).create({
      name: `TechStart Customer ${i}`,
      email: `tech.customer${i}@example.com`,
      phone: `555-100${i}`,
      organizationId: org2.id,
    });
    customers2.push(customer);
  }
  await dataSource.getRepository(Customer).save(customers2);

  console.log('✅ Customers created');

  // Create Notes for some customers
  const notes: Note[] = [];
  for (let i = 0; i < 3; i++) {
    const note = dataSource.getRepository(Note).create({
      content: `This is a note for customer ${i + 1}. Meeting scheduled for next week.`,
      customerId: customers1[i].id,
      organizationId: org1.id,
    });
    notes.push(note);
  }
  await dataSource.getRepository(Note).save(notes);

  console.log('✅ Notes created');
  console.log('🎉 Seed completed successfully!');

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
