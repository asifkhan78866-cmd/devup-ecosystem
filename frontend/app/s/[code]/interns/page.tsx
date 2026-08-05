"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { workspaceApi } from "@/lib/api/workspace";
import { PeopleTable } from "../employees/page";

export default function InternsPage() {
  const { code } = useParams<{ code: string }>();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!code) return;
    try {
      setRows(await workspaceApi.interns(code));
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
      title="Interns"
      subtitle="Fixed-duration placements. Interns receive completion certificates rather than experience letters."
      rows={rows}
      loading={loading}
      error={error}
      onReload={load}
      columns={[
        { key: "internCode", label: "Intern ID", mono: true },
        { key: "fullName", label: "Name" },
        { key: "designation", label: "Role" },
        { key: "college", label: "College" },
        { key: "stipend", label: "Stipend" },
        { key: "startDate", label: "Start", transform: (v: string) => new Date(v).toLocaleDateString("en-IN") },
        { key: "endDate", label: "End", transform: (v: string) => new Date(v).toLocaleDateString("en-IN") },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
