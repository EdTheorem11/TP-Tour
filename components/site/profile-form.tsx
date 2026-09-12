"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateMyProfile, submitMyHandicapChange } from "@/lib/actions/profile";
import { INDUSTRY_OPTIONS, type MemberProfile } from "@/lib/types";

const inputClass =
  "w-full border border-white/15 bg-tp-black px-4 py-3 text-sm text-tp-offwhite placeholder:text-tp-offwhite/30 focus:border-tp-gold focus:outline-none";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/60";

export function ProfileForm({ profile }: { profile: MemberProfile }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [mobile, setMobile] = useState(profile.mobile ?? "");
  const [company, setCompany] = useState(profile.company ?? "");
  const [jobTitle, setJobTitle] = useState(profile.job_title ?? "");
  const [industry, setIndustry] = useState(profile.industry ?? "");
  const [homeGolfClub, setHomeGolfClub] = useState(profile.home_golf_club ?? "");
  const [homeCourse, setHomeCourse] = useState(profile.home_course ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");
  const [showCompany, setShowCompany] = useState(profile.show_company_publicly);
  const [showJobTitle, setShowJobTitle] = useState(profile.show_job_title_publicly);

  const [newHandicap, setNewHandicap] = useState("");
  const [handicapReason, setHandicapReason] = useState("");
  const [handicapMessage, setHandicapMessage] = useState<string | null>(null);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const result = await updateMyProfile({
      mobile,
      company,
      jobTitle,
      industry,
      homeGolfClub,
      homeCourse,
      linkedinUrl,
      showCompanyPublicly: showCompany,
      showJobTitlePublicly: showJobTitle,
    });
    setSaving(false);
    setMessage(result.error ?? "Profile updated.");
    router.refresh();
  };

  const onSubmitHandicap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandicap) return;
    const result = await submitMyHandicapChange(parseFloat(newHandicap), handicapReason);
    setHandicapMessage(result.error ?? "Handicap change submitted.");
    if (!result.error) {
      setNewHandicap("");
      setHandicapReason("");
      router.refresh();
    }
  };

  return (
    <div className="space-y-14">
      <form onSubmit={onSaveProfile} className="space-y-6">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Profile</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Mobile</label>
            <input className={inputClass} value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>LinkedIn URL</label>
            <input className={inputClass} value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Job Title</label>
            <input className={inputClass} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Industry</label>
            <select className={inputClass} value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">Select industry</option>
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Golf Club</label>
            <input className={inputClass} value={homeGolfClub} onChange={(e) => setHomeGolfClub(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Home Course</label>
            <input className={inputClass} value={homeCourse} onChange={(e) => setHomeCourse(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-5">
          <p className={labelClass}>Directory Visibility</p>
          <label className="flex items-center gap-3 text-sm text-tp-offwhite/70">
            <input type="checkbox" checked={showCompany} onChange={(e) => setShowCompany(e.target.checked)} />
            Show my company to other members
          </label>
          <label className="flex items-center gap-3 text-sm text-tp-offwhite/70">
            <input type="checkbox" checked={showJobTitle} onChange={(e) => setShowJobTitle(e.target.checked)} />
            Show my job title to other members
          </label>
        </div>

        {message && <p className="text-sm text-tp-gold">{message}</p>}
        <Button type="submit" variant="gold" disabled={saving}>
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      </form>

      <form onSubmit={onSubmitHandicap} className="space-y-5 border-t border-white/10 pt-10">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Handicap</h2>
        <p className="text-sm text-tp-offwhite/50">
          Current handicap: <span className="text-tp-offwhite">{profile.current_handicap ?? "—"}</span>. Submitted
          changes may require admin approval.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>New Handicap Index</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={newHandicap}
              onChange={(e) => setNewHandicap(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Reason (optional)</label>
            <input className={inputClass} value={handicapReason} onChange={(e) => setHandicapReason(e.target.value)} />
          </div>
        </div>
        {handicapMessage && <p className="text-sm text-tp-gold">{handicapMessage}</p>}
        <Button type="submit" variant="outline">
          Submit Handicap Change
        </Button>
      </form>
    </div>
  );
}
