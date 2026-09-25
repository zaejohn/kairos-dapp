import { GarageEntry } from "@/components/garage-entry";
import { getMidnightNetwork } from "@/lib/midnight/config";

export default function Home() {
  getMidnightNetwork();
  return <GarageEntry initialContractAddress={process.env.NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS ?? ""} />;
}
