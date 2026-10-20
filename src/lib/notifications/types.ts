export type DeliveryResult =
  | { status: "sent"; providerId?: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };
