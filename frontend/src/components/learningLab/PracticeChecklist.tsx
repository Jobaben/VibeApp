import { CHECKLIST } from './copy';

export default function PracticeChecklist() {
  return (
    <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
      <h3 className="text-lg text-white font-semibold mb-2">{CHECKLIST.sectionTitle}</h3>
      <ol className="space-y-2 text-sm text-gray-300 list-decimal pl-5">
        {CHECKLIST.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </div>
  );
}
