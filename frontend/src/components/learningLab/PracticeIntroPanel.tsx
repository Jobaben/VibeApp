import { INTRO_STEPS, PAGE_HEADER } from './copy';

export default function PracticeIntroPanel() {
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">{PAGE_HEADER.title}</h2>
        <p className="text-gray-300 mt-2">{PAGE_HEADER.subtitle}</p>
      </div>
      <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {INTRO_STEPS.map((step) => (
          <li
            key={step.title}
            className="rounded-xl bg-gray-900/40 border border-white/10 p-3"
          >
            <p className="text-white font-semibold">{step.title}</p>
            <p className="text-sm text-gray-300 mt-1">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
