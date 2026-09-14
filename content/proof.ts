/** Proof reinforces after the work has landed — it never opens the page. */
export interface ProofPoint {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export const proofPoints: ProofPoint[] = [
  {
    value: '144%',
    label: 'Purchase intent',
    description: 'Uplift for emotion-rich brand videos vs. rational, feature-led ads.',
    icon: '/icons/Upliftinpurchase.png',
  },
  {
    value: '2×',
    label: 'Effectiveness',
    description: '31% profitability vs. 16% for rational ad films.',
    icon: '/icons/Effectiveness.png',
  },
  {
    value: '23%',
    label: 'Lift in sales',
    description: 'After customers discover a brand through a film.',
    icon: '/icons/LiftinSales.png',
  },
  {
    value: '81%',
    label: 'Brand recall',
    description: 'From brand videos, vs. 69% from regular ad films.',
    icon: '/icons/Brandrecall.png',
  },
  {
    value: '82%',
    label: 'Customer loyalty',
    description: 'Higher loyalty after watching a brand film.',
    icon: '/icons/Customerloyalty.png',
  },
  {
    value: '40%',
    label: 'Pricing power',
    description: 'Increase, with consumers willing to pay more.',
    icon: '/icons/PricingPower.png',
  },
];
