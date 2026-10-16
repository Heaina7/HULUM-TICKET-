import type { AttendanceRecord, Employee } from "@/types";
import { generateMonthDates } from "@/lib/ethiopian-calendar";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function exportAttendanceCsv(employees: Employee[], records: AttendanceRecord[], month: string) {
  const dates = generateMonthDates(month);
  const byKey = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const key = `${r.employee_name}::${r.eth_date}`;
    byKey.set(key, [...(byKey.get(key) ?? []), r]);
  }

  const header = ["Employee", ...dates.map((d) => d.split(" ")[0])];
  const rows = employees.map((employee) => {
    const cells = dates.map((date) => {
      const dayRecords = byKey.get(`${employee.name}::${date}`) ?? [];
      if (dayRecords.some((r) => r.type === "permission")) return "Excused";
      const checkIn = dayRecords.find((r) => r.type === "in");
      if (checkIn) return checkIn.is_late ? "Late" : "Present";
      return "";
    });
    return [employee.name, ...cells];
  });

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance-${month.replace(/\s+/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
