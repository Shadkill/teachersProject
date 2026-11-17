const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Начало инициализации базы данных (Seeding)...');

  const adminEmail = 'neizvestnyjneizvestnost172@gmail.com';
  const adminPassword = 'rCIMRbxDlMFPMs3BAeFJ'; // Замените на сложный пароль в .env
  const adminName = "Shadkill"

  // 1. Проверяем, есть ли уже админ
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log(`Администратор с почтой ${adminEmail} уже существует. Пропускаем создание.`);
    return;
  }

  // 2. Хешируем пароль (чтобы в БД не лежал открытый текст)
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  // 3. Создаем суперпользователя напрямую в БД
  const newAdmin = await prisma.admin.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name:adminName
      
    }
  });

  console.log(`УСПЕХ: Учётная запись администратора создана!`);
  console.log(`Email: ${newAdmin.email}`);
  console.log(`Пароль: (взят из вашего .env)`);
}

main()
  .catch((e) => {
    console.error('Ошибка при инициализации:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Обязательно закрываем соединение с БД после выполнения скрипта
    await prisma.$disconnect();
  });