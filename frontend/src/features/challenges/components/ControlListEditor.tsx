// FILE: ControlListEditor.tsx
// Purpose: Edits the hidden positive or negative control strings used when creating a challenge.
// Layer: Feature UI component
// Exports: ControlListEditor
// Depends on: shared Input/Button and validation limits

import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { Button, Input } from "@shared/ui";

type ControlListEditorProps = {
  error?: string;
  kind: "negative" | "positive";
  onAdd: () => void;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  values: string[];
};

const controlCopy = {
  positive: {
    label: "Stringhe che devono passare",
    placeholder: "AB123",
    tone: "border-lime-300/20 bg-lime-300/5",
  },
  negative: {
    label: "Stringhe che devono fallire",
    placeholder: "ab123",
    tone: "border-rose-300/20 bg-rose-300/5",
  },
};

export function ControlListEditor({ error, kind, onAdd, onChange, onRemove, values }: ControlListEditorProps) {
  const copy = controlCopy[kind];

  return (
    <div className={`rounded-lg border p-4 ${copy.tone}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-black">{copy.label}</h2>
          <p className="mt-1 text-sm text-zinc-400">Da 1 a 10 controlli nascosti.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={values.length >= VALIDATION_LIMITS.maxControlsPerKind}
          onClick={onAdd}
        >
          Aggiungi
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {values.map((control, index) => (
          <div key={`${kind}-${index}`} className="flex gap-2">
            <Input
              value={control}
              maxLength={VALIDATION_LIMITS.control}
              placeholder={copy.placeholder}
              onChange={(event) => onChange(index, event.target.value)}
            />
            <Button type="button" variant="ghost" disabled={values.length === 1} onClick={() => onRemove(index)}>
              X
            </Button>
          </div>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
