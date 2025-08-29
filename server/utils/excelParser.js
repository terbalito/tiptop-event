import xlsx from "xlsx";

export const parseExcel = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  return data.map((row) => ({
    name: row.Nom || row.name || "Invité",
    email: row.Email || row.email || "",
    phone: row.Telephone || row.Téléphone || row.phone || "",
    tableNumber: row.Numero_table || row.table || "",
    code: row.Code_unique || row.code || "",
  }));
};
