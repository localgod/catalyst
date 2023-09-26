import { EntityType } from './EntityType.enum.mjs'

export interface EntityDescriptor {
    parent?: string;
    type: EntityType;
    alias: string;
    label: string;
    technology?: string;
    description?: string;
    sprite?: string;
    tags?: string;
    link?: string;
    children?: EntityDescriptor[];
  }