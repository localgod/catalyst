interface EntityDescriptor {
  [key: string]: unknown;
  parent?: string;
  type: string;
  alias: string;
  label: string;
  technology?: string;
  description?: string;
  sprite?: string;
  tags?: string;
  link?: string;
  children?: EntityDescriptor[];
}

export { EntityDescriptor }
