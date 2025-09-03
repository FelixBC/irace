import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log('🧹 Limpiando base de datos...');
    
    // Eliminar todas las tablas en orden correcto (respetando foreign keys)
    console.log('🗑️ Eliminando datos de Participation...');
    await prisma.participation.deleteMany();
    
    console.log('🗑️ Eliminando datos de Activity...');
    await prisma.activity.deleteMany();
    
    console.log('🗑️ Eliminando datos de Challenge...');
    await prisma.challenge.deleteMany();
    
    console.log('🗑️ Eliminando datos de Session...');
    await prisma.session.deleteMany();
    
    console.log('🗑️ Eliminando datos de Account...');
    await prisma.account.deleteMany();
    
    console.log('🗑️ Eliminando datos de User...');
    await prisma.user.deleteMany();
    
    console.log('🗑️ Eliminando datos de VerificationToken...');
    await prisma.verificationToken.deleteMany();
    
    console.log('🗑️ Eliminando datos de Avatar...');
    await prisma.avatar.deleteMany();
    
    console.log('✅ Base de datos limpiada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
cleanDatabase()
  .then(() => {
    console.log('🎉 Proceso completado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
