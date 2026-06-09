import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSave } from "@fortawesome/free-solid-svg-icons";
import { type ConfiguracionAi, MODELOS_AI } from "../../lib/api";
import { useUpdateConfiguracionAi } from "../../hooks/useConfiguracionAi";
import { Field } from "../ui/field";
import { ToggleSwitch } from "../ui/toggle-switch";

interface ConfiguracionAiModalProps {
  configAi: ConfiguracionAi;
  leadNombre: string;
  onClose: () => void;
}

export function ConfiguracionAiModal({
  configAi,
  leadNombre,
  onClose,
}: ConfiguracionAiModalProps) {
  const updateConfigAi = useUpdateConfiguracionAi();
  const [modelo, setModelo] = useState(configAi.modelo || MODELOS_AI[0]);
  const [promptCustom, setPromptCustom] = useState(configAi.prompt_custom || "");
  const [notasAi, setNotasAi] = useState(configAi.notas_ai || "");
  const [habilitado, setHabilitado] = useState(!!configAi.habilitado);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const noChanges =
    modelo === (configAi.modelo || MODELOS_AI[0]) &&
    promptCustom === (configAi.prompt_custom || "") &&
    notasAi === (configAi.notas_ai || "") &&
    habilitado === !!configAi.habilitado;

  const handleSave = () => {
    updateConfigAi.mutate(
      {
        documentId: configAi.documentId,
        data: {
          modelo,
          prompt_custom: promptCustom,
          notas_ai: notasAi,
          habilitado,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <h3 className="text-[14.5px] font-semibold text-slate-900">
              Configuración AI
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-500">{leadNombre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
          >
            <FontAwesomeIcon icon={faTimes} className="size-3.5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-2.5 rounded-md border border-slate-200/70 bg-slate-50/50 px-3 py-2.5">
            <ToggleSwitch
              checked={habilitado}
              disabled={updateConfigAi.isPending}
              onChange={() => setHabilitado((v) => !v)}
            />
            <span className="text-[12.5px] text-slate-700">
              {habilitado ? "AI activa" : "AI pausada"}
            </span>
          </div>

          <Field label="Modelo">
            <select
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[13px] text-slate-900 outline-none transition-colors focus:border-slate-900"
              value={modelo}
              disabled={updateConfigAi.isPending}
              onChange={(e) => setModelo(e.target.value)}
            >
              {MODELOS_AI.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Prompt personalizado">
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900"
              placeholder="Instrucciones para este lead…"
              value={promptCustom}
              onChange={(e) => setPromptCustom(e.target.value)}
            />
          </Field>

          <Field label="Notas AI (privadas)">
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900"
              placeholder="Notas internas del asesor…"
              value={notasAi}
              onChange={(e) => setNotasAi(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 cursor-pointer rounded-md px-3.5 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
            disabled={updateConfigAi.isPending}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={updateConfigAi.isPending || noChanges}
          >
            <FontAwesomeIcon icon={faSave} className="size-3.5" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
