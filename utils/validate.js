export const str = (v) => (typeof v === "string" ? v.trim() : "");
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const phoneRx = /^(?:\+?88)?01[3-9]\d{8}$/;
export const isUrl = (s) => /^https?:\/\/\S+$/i.test(s);

export function parseTuition(b = {}) {
  const d = {
    title: str(b.title),
    subject: str(b.subject),
    classLevel: str(b.classLevel),
    mode: str(b.mode),
    location: str(b.location),
    monthlyFee: Number(b.monthlyFee),
    daysPerWeek: Number(b.daysPerWeek),
    description: str(b.description),
    bannerImage: str(b.bannerImage),
  };
  if (d.title.length < 5) return { error: "Title must be at least 5 characters" };
  if (!d.subject) return { error: "Subject is required" };
  if (!d.classLevel) return { error: "Class level is required" };
  if (!["Online", "Offline"].includes(d.mode)) return { error: "Mode must be Online or Offline" };
  if (!d.location) return { error: "Location is required" };
  if (!Number.isFinite(d.monthlyFee) || d.monthlyFee < 100 || d.monthlyFee > 100000)
    return { error: "Monthly fee must be between 100 and 100000" };
  if (!Number.isInteger(d.daysPerWeek) || d.daysPerWeek < 1 || d.daysPerWeek > 7)
    return { error: "Days per week must be 1 to 7" };
  if (d.description.length < 30) return { error: "Description must be at least 30 characters" };
  if (d.bannerImage && !isUrl(d.bannerImage)) return { error: "Banner image must be a valid URL" };
  return { data: d };
}