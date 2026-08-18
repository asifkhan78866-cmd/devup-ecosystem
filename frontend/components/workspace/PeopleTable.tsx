"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import PersonDrawer from "@/components/workspace/PersonDrawer";

/**
 * Shared by Employees and Interns. Rows open a drawer with the full record —
 * details, uploaded documents, issued documents — rather than a separate page,
 * so HR keeps their place in the list.
 *
 * Lives here rather than in the Employees page because a route's page.tsx may
 * only export a default component plus Next's own route config fields; exporting
 * this alongside the page failed the production build.
 */
export function PeopleTable({ code, title, subtitle, rows, loading, error, columns, onReload }: any) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1440px] mx-auto">
      <header className="mb-6">
        <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          {title}
        </h1>
        <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">{subtitle}</p>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-[#6b6b6b] text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-white/[0.09] text-center">
          <p className="text-[#6b6b6b] text-sm">
            Nobody here yet. People appear once onboarded, or when added from the Onboarding page.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr>
                {columns.map((c: any) => (
                  <th key={c.key} className="text-left text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r: any) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className="cursor-pointer hover:bg-white/[0.03] transition group"
                >
                  {columns.map((c: any) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3.5 text-xs whitespace-nowrap ${c.mono ? "tabular-nums text-[#c8f135]" : "text-[#a1a1a1]"}`}
                    >
                      {r[c.key] == null ? "—" : c.transform ? c.transform(r[c.key]) : String(r[c.key])}
                    </td>
                  ))}
                  <td className="px-2">
                    <ChevronRight className="w-4 h-4 text-[#3d3d3d] group-hover:text-[#c8f135] transition" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <PersonDrawer
          code={code}
          personId={selected}
          onClose={() => setSelected(null)}
          onChanged={onReload}
        />
      )}
    </div>
  );
}

export default PeopleTable;
