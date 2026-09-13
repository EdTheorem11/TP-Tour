import { getAllPartnersAdmin } from "@/lib/data/admin";
import { Field, inputClass } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { createPartner, updatePartner } from "@/lib/actions/admin-content";
import { SPONSOR_LEVEL_LABELS } from "@/lib/types";

export default async function AdminPartnersPage() {
  const partners = await getAllPartnersAdmin();

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Partners</h1>

      <details className="mt-6 max-w-xl">
        <summary className="cursor-pointer text-sm text-tp-gold">+ Add Partner</summary>
        <form action={createPartner} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input name="name" required className={inputClass} /></Field>
          <Field label="Sponsor Level">
            <select name="sponsor_level" className={inputClass}>
              {Object.entries(SPONSOR_LEVEL_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </Field>
          <Field label="Logo URL"><input name="logo_url" className={inputClass} /></Field>
          <Field label="Website"><input name="website" className={inputClass} /></Field>
          <Field label="Display Order"><input type="number" name="display_order" defaultValue={0} className={inputClass} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea name="description" rows={2} className={inputClass} /></Field>
          <div className="sm:col-span-2"><Button type="submit" variant="gold" size="sm">Add Partner</Button></div>
        </form>
      </details>

      <div className="mt-10 space-y-4">
        {partners.map((p) => (
          <details key={p.id} className="border border-white/10 bg-tp-dark p-6">
            <summary className="cursor-pointer font-heading text-lg font-bold uppercase text-tp-offwhite">
              {p.name} <span className="ml-3 text-xs font-normal text-tp-offwhite/40">{SPONSOR_LEVEL_LABELS[p.sponsor_level]}</span>
              {!p.active && (
                <span className="ml-3 text-xs font-normal uppercase tracking-[0.08em] text-red-400">Inactive &mdash; hidden from site</span>
              )}
            </summary>
            <form action={updatePartner.bind(null, p.id)} className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input name="name" defaultValue={p.name} className={inputClass} /></Field>
              <Field label="Sponsor Level">
                <select name="sponsor_level" defaultValue={p.sponsor_level} className={inputClass}>
                  {Object.entries(SPONSOR_LEVEL_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </Field>
              <Field label="Logo URL"><input name="logo_url" defaultValue={p.logo_url ?? ""} className={inputClass} /></Field>
              <Field label="Website"><input name="website" defaultValue={p.website ?? ""} className={inputClass} /></Field>
              <Field label="Display Order"><input type="number" name="display_order" defaultValue={p.display_order} className={inputClass} /></Field>
              <label className="flex items-center gap-2 text-sm text-tp-offwhite/70">
                <input type="checkbox" name="active" defaultChecked={p.active} /> Active
              </label>
              <Field label="Description" className="sm:col-span-2"><textarea name="description" rows={2} defaultValue={p.description ?? ""} className={inputClass} /></Field>
              <div className="sm:col-span-2"><Button type="submit" variant="outline" size="sm">Save</Button></div>
            </form>
          </details>
        ))}
        {partners.length === 0 && <p className="text-tp-offwhite/50">No partners yet.</p>}
      </div>
    </div>
  );
}
