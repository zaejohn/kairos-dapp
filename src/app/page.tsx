import { KairosApp } from "@/components/kairos-app";
import { getMidnightNetwork } from "@/lib/midnight/config";

export default function Home() {
  getMidnightNetwork();
  return <KairosApp initialContractAddress={process.env.NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS ?? ""} />;
}
