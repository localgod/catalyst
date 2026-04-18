import type { EntityDescriptor } from './EntityDescriptor.interface.mjs'

class EntityParser {

  private isValidEntityType(type: string): boolean {
    return [
      'Person',
      'Person_Ext',
      'System',
      'SystemDb',
      'SystemQueue',
      'System_Ext',
      'SystemDb_Ext',
      'SystemQueue_Ext',
      'Container',
      'ContainerDb',
      'ContainerQueue',
      'Container_Ext',
      'ContainerDb_Ext',
      'ContainerQueue_Ext',
      'Component',
      'ComponentDb',
      'ComponentQueue',
      'Component_Ext',
      'ComponentDb_Ext',
      'ComponentQueue_Ext',
      // Boundary containers — parsed as stack frames (block ends with '{')
      // and emitted as dashed clusters that enclose their children.
      'System_Boundary',
      'Container_Boundary',
      'Enterprise_Boundary',
      'Boundary',
      // Deployment level (C4_Deployment.puml). Node and Deployment_Node are
      // synonyms; the _L / _R suffixes are layout-direction hints handled by
      // the spec itself, not distinct element types, but we accept them
      // verbatim so the parser doesn't reject them.
      'Node',
      'Node_L',
      'Node_R',
      'Deployment_Node',
      'Deployment_Node_L',
      'Deployment_Node_R',
    ].indexOf(type) !== -1 ? true : false
  }

  private isComponent(str: string): boolean {
    // The regex is a negative lookahead: returns true (skip this line) when the
    // line starts with one of these directives. Keep in sync with C4-PlantUML
    // v2.10.0 procedure surface — anything not enumerated here is assumed to be
    // an entity candidate.
    const skipPrefixes = [
      // Relationships — cover plain, _Back, _Neighbor, short + long directionals,
      // BiRel variants, and RelIndex (dynamic) variants in one negative branch.
      'Rel\\w*',          // Rel, Rel_Back, Rel_U, Rel_Up, Rel_Back_Neighbor, ...
      'BiRel\\w*',
      'RelIndex\\w*',
      // Layout hints — produce no shape.
      'Lay_[UDLR]\\b',
      'Lay_(Up|Down|Left|Right|Distance)\\b',
      'LAYOUT_\\w+',
      // Styling / tags — TODO: honour these; for now skip.
      'Update\\w+Style\\b',
      'Add\\w+Tag\\b',
      'UpdateSkinparamsAndLegendEntry\\b',
      'SET_SKETCH_STYLE\\b',
      // Legend / display.
      'SHOW_LEGEND\\b', 'SHOW_FLOATING_LEGEND\\b', 'SHOW_DYNAMIC_LEGEND\\b',
      'SHOW_PERSON_(OUTLINE|PORTRAIT|SPRITE)\\b',
      'SHOW_FOOT_BOXES\\b', 'SHOW_INDEX\\b', 'SHOW_ELEMENT_DESCRIPTIONS\\b',
      'HIDE_STEREOTYPE\\b',
      // Properties / meta.
      'AddProperty\\b', 'SetPropertyHeader\\b', 'WithoutPropertyHeader\\b',
      'SetDefaultLegendEntries\\b',
      // Misc PlantUML.
      'scale\\b', 'title\\b', 'caption\\b', 'footer\\b', 'header\\b',
      'skinparam\\b', 'legend\\b', 'endlegend\\b', 'note\\b', 'end note\\b',
    ];
    const pattern = new RegExp('^(?!(?:' + skipPrefixes.join('|') + ')|[@!]).*$');
    return str.match(pattern) === null;
  }

  private parseBlock(parent: string, block: string): EntityDescriptor | null {
    // Extract type name + argument list with paren-depth awareness so that
    // descriptions containing `(nested)` text don't confuse a greedy regex.
    const openIdx = block.indexOf('(');
    if (openIdx < 0) {
      return null;
    }
    const typeName = block.slice(0, openIdx).trim();
    let depth = 0;
    let closeIdx = -1;
    for (let i = openIdx; i < block.length; i++) {
      if (block[i] === '(') depth++;
      else if (block[i] === ')') {
        depth--;
        if (depth === 0) {
          closeIdx = i;
          break;
        }
      }
    }
    if (closeIdx < 0) {
      return null;
    }

    if (!this.isValidEntityType(typeName)) {
      return null;
    }

    // Split the argument list on top-level commas only (skip commas inside
    // nested parens that survived the quote-strip step upstream).
    const argsStr = block.slice(openIdx + 1, closeIdx);
    const props: string[] = [];
    let buf = '';
    let nested = 0;
    for (const ch of argsStr) {
      if (ch === '(') nested++;
      else if (ch === ')') nested--;
      if (ch === ',' && nested === 0) {
        props.push(buf.trim());
        buf = '';
      } else {
        buf += ch;
      }
    }
    if (buf.trim().length > 0) props.push(buf.trim());

    if (props.length === 0) {
      return null;
    }

    const result: EntityDescriptor = {
      parent,
      type: typeName,
      alias: props[0],
      label: props[1],
    };

    const t = props.filter(prop => prop.match(/^(?!\$).*/));
    switch (t.length) {
      case 4:
        result.technology = t[2];
        result.description = t[3];
        break;
      case 3:
        result.technology = t[2];
        break;
      default:
        break;
    }

    result.sprite = props.find(prop => prop.startsWith('$s'));
    result.tags = props.find(prop => prop.startsWith('$t'));
    result.link = props.find(prop => prop.startsWith('$l'));

    return result;
  }

  parse(input: string): EntityDescriptor[] {
    // Split input into individual lines, remove unnecessary characters
    const systemBlocks = input.split('\n').map((block) => block.trim().replaceAll('"', ''));

    // Initialize variables
    const result: EntityDescriptor[] = [];
    const stack: string[] = [];

    for (const block of systemBlocks) {
      // Skip components
      if (this.isComponent(block)) {
        continue;
      }

      if (block.endsWith('{')) {
        // Handle blocks starting with '{'
        const parent = stack[stack.length - 1];
        const parsedBlock = this.parseBlock(parent, block);
        if (parsedBlock) {
          result.push(parsedBlock);
          stack.push(parsedBlock.alias);
        }
      } else if (block.startsWith('}')) {
        // Handle blocks starting with '}'
        stack.pop();
      } else {
        // Handle other blocks
        const parent = stack[stack.length - 1];
        const parsedBlock = this.parseBlock(parent, block);
        if (parsedBlock) {
          result.push(parsedBlock);
        }
      }
    }

    return this.createHierarchy(result);
  }

  private createHierarchy(systems: EntityDescriptor[]): EntityDescriptor[] {
    const result: EntityDescriptor[] = [];

    for (const system of systems) {
      if (!system.parent) {
        delete system.parent;
        result.push(system);
      } else {
        const parent = systems.find((s) => s.alias === system.parent);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          delete system.parent;
          parent.children.push(system);
        }
      }
    }
    return result;
  }

  getObjectWithPropertyAndValueInHierarchy(data: EntityDescriptor[], propertyToFind: string, valueToFind: unknown): EntityDescriptor | undefined {
    for (const item of data) {
      if (item[propertyToFind] === valueToFind) {
        return item; // Found the object with the specified property and value in the current item
      }

      if (item.children && item.children.length > 0) {
        const objectInChildren = this.getObjectWithPropertyAndValueInHierarchy(item.children, propertyToFind, valueToFind);
        if (objectInChildren !== undefined) {
          return objectInChildren; // Found the object with the specified property and value in one of the child items
        }
      }
    }

    return undefined; // Property with the specified value not found in this branch of the hierarchy
  }
}

export { EntityParser, EntityDescriptor }
