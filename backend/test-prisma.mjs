import prisma from "./utils/prisma.js";

console.log(
  Object.keys(prisma).filter(k => !k.startsWith("$"))
);

await prisma.$disconnect();
