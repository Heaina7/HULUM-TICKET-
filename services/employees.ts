import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Employee, EmployeeInsert, EmployeeUpdate } from "@/types";

export async function getEmployees(branchId: number): Promise<Employee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("branch_id", branchId)
    .order("active", { ascending: false })
    .order("name");

  if (error) throw new Error(`Failed to load employees: ${error.message}`);
  return data;
}

export async function createEmployee(input: EmployeeInsert) {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateEmployee(id: number, input: EmployeeUpdate) {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}
