import type { Metadata } from "next";
import { BrandForm } from "./brand-form";

export const metadata: Metadata = { title: "Bring your brand" };

export default function BrandPage() {
  return <BrandForm />;
}
