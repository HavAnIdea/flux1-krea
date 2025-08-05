import DynamicPricing from "@/components/blocks/pricing/DynamicPricing";

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <DynamicPricing 
        title="Choose Your Plan"
        description="Start for free, upgrade when you need more power"
      />
    </div>
  );
}