import xlsx from "xlsx";

export const parseExcel = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  // normaliser
  return data.map((row) => ({
    name: row.Nom || row.name || "Invité",
    phone: row.Téléphone || row.phone || "",
    email: row.Email || row.email || "",
    company: row.Entreprise || row.company || "",
  }));
};
