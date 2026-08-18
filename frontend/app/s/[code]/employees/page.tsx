"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { workspaceApi } from "@/lib/api/workspace";
import { PeopleTable } from "@/components/workspace/PeopleTable";

export default function EmployeesPage() {
  const { code } = useParams<{ code: string }>();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!code) return;
    try {
      setRows(await workspaceApi.employees(code));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { load(); }, [load]);

  return (
    <PeopleTable
      code={code}
      title="Employees"
      subtitle="People on your payroll. Employee IDs are permanent and never reused."
      rows={rows}
      loading={loading}
      error={error}
      onReload={load}
      columns={[
        { key: "employeeCode", label: "Employee ID", mono: true },
        { key: "fullName", label: "Name" },
        { key: "designation", label: "Designation" },
        { key: "department", label: "Department" },
        { key: "employmentType", label: "Type", transform: (v: string) => String(v).replace(/_/g, " ") },
        { key: "joinedAt", label: "Joined", transform: (v: string) => new Date(v).toLocaleDateString("en-IN") },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
