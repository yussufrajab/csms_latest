const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const results = await prisma.employee.findMany({
    where: {
      currentWorkplace: {
        contains: "Mkoa wa Kusini Pemba",
        mode: "insensitive",
      },
      cadre: {
        contains: "Afisa Utumishi",
        mode: "insensitive",
      },
    },
  });

  console.log(results);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });