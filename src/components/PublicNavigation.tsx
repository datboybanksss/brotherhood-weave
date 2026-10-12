import { Link } from "react-router-dom";
export default function PublicNavigation() {
 return <nav aria-label="Public navigation" className="flex flex-wrap items-center justify-between gap-4 border-b border-stroke-hairline px-6 py-5"><Link to="/entry" className="text-sm font-semibold tracking-[0.2em]">FAMILY TIES.</Link><div className="flex flex-wrap gap-5 text-sm"><Link to="/apply" className="text-brand-royal">Apply</Link><Link to="/login">Log in</Link><Link to="/entry">Go to app</Link></div></nav>;
}
