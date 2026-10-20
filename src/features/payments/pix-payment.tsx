import QRCode from "qrcode";
import { formatBRL } from "@/lib/format/money";
import { dateFormatters } from "@/lib/format/date";
import { AutoRefresh } from "./auto-refresh";
import { CopyButton } from "./copy-button";

type Props = {
  copyPaste: string;
  amountCents: number;
  expiresAt: string;
  timeZone: string;
  automatic: boolean;
};

/** Bloco de pagamento: QR Code, "copia e cola" e prazo. */
export async function PixPayment({
  copyPaste,
  amountCents,
  expiresAt,
  timeZone,
  automatic,
}: Props) {
  const svg = await QRCode.toString(copyPaste, { type: "svg", margin: 1, width: 240 });
  const f = dateFormatters(timeZone);

  return (
    <div className="rounded-2xl bg-white p-6 ring-2 ring-brand-500">
      {automatic ? <AutoRefresh until={expiresAt} /> : null}
      <h2 className="text-lg font-semibold text-ink-900">Pague {formatBRL(amountCents)} via Pix</h2>
      <p className="mt-1 text-sm text-ink-600">
        Horário reservado até <strong>{f.time(expiresAt)}</strong>.{" "}
        {automatic
          ? "A confirmação aparece aqui automaticamente após o pagamento."
          : "O profissional confirma o agendamento assim que identificar o pagamento."}
      </p>
      <div
        className="mx-auto my-6 size-60 [&>svg]:size-full"
        role="img"
        aria-label="QR Code do Pix"
        // SVG gerado no servidor a partir do código Pix (sem entrada de HTML do usuário).
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mb-2 text-xs font-medium text-ink-500">Pix copia e cola</p>
      <p className="mb-4 rounded-lg bg-ink-50 p-3 font-mono text-xs break-all text-ink-700">
        {copyPaste}
      </p>
      <CopyButton text={copyPaste} />
    </div>
  );
}
