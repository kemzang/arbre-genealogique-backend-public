import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@family.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  console.log('🌱 Stratégie de peuplement : Vérification du Super Admin...');

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    if (!existingAdmin.isSuperAdmin) {
      console.log(`⚠️ L'utilisateur ${adminEmail} existe déjà mais n'est pas Super Admin. Mise à jour...`);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { isSuperAdmin: true },
      });
      console.log('✅ Utilisateur promu en Super Admin.');
    } else {
      console.log(`ℹ️ Le Super Admin ${adminEmail} existe déjà.`);
    }
  } else {
    console.log(`➕ Création du Super Admin par défaut : ${adminEmail}`);
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        displayName: 'Super Admin',
        isSuperAdmin: true,
        profilePictureUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // Image par défaut
      },
    });
    console.log('✅ Super Admin créé avec succès.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
