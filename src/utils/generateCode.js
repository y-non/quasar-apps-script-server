const generateGiftCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 10 })
    .map(() => characters.charAt(Math.floor(Math.random() * characters.length)))
    .join("");
};

export const generateCode = {
  generateGiftCode,
};
