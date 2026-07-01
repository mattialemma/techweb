// File: HiddenControlEditor.tsx
// Scopo: Modifica stringhe di controllo positive o negative nascoste nella creazione sfida.
// Livello: Componente UI funzionalita
// Esporta: HiddenControlEditor
// Dipende da: Input/Button condivisi e limiti di validazione

import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { Button, Input } from "@shared/ui";

type HiddenControlEditorProps = {
  error?: string;
  kind: "negative" | "positive";
  onAdd: () => void;
  onChange: (position: number, value: string) => void;
  onRemove: (position: number) => void;
  values: string[];
};

type HiddenControlTone = HiddenControlEditorProps["kind"];

const hiddenControlView: Record<HiddenControlTone, { label: string; placeholder: string; tone: string }> = {
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

function ControlInputRow({
  canRemove,
  draftValue,
  onChange,
  onRemove,
  placeholder,
  position,
}: {
  canRemove: boolean;
  draftValue: string;
  onChange: HiddenControlEditorProps["onChange"];
  onRemove: HiddenControlEditorProps["onRemove"];
  placeholder: string;
  position: number;
}) {
  return (
    <div className="flex gap-2">
      <Input
        value={draftValue}
        maxLength={VALIDATION_LIMITS.control}
        placeholder={placeholder}
        onChange={(event) => onChange(position, event.target.value)}
      />
      <Button type="button" variant="ghost" disabled={!canRemove} onClick={() => onRemove(position)}>
        X
      </Button>
    </div>
  );
}

export function HiddenControlEditor({
  error,
  kind,
  onAdd,
  onChange,
  onRemove,
  values: controlValues,
}: HiddenControlEditorProps) {
  const copy = hiddenControlView[kind];
  const canAppendControl = controlValues.length < VALIDATION_LIMITS.maxControlsPerKind;
  const canRemoveControl = controlValues.length > 1;

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
          disabled={!canAppendControl}
          onClick={onAdd}
        >
          Aggiungi
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {controlValues.map((controlValue, position) => (
          <ControlInputRow
            key={`${kind}-${position}`}
            canRemove={canRemoveControl}
            draftValue={controlValue}
            onChange={onChange}
            onRemove={onRemove}
            placeholder={copy.placeholder}
            position={position}
          />
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
