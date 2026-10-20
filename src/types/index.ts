export * from './user';
export * from './ecommerce';

export interface EcosystemModuleMeta {
  id: string;
  name: string;
  category: 'core' | 'commerce' | 'manufacturing' | 'academy' | 'services';
  description: string;
  status: 'foundation_ready' | 'planned_phase';
}
