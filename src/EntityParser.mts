import { EntityType } from './EntityType.enum.mjs'
import { EntityDescriptor } from './EntityDescriptor.interface.mjs'

class EntityParser {

  private isComponent(str: string): boolean {
    return str.match(/^(?!Rel\b|UpdateElementStyle\b|UpdateSystemBoundaryStyle\b|AddRelTag\b|AddElementTag\b|scale\b|title\b|LAYOUT_TOP_DOWN\b|SHOW_LEGEND\b|[@!]).*$/) === null;
  }

  private parseBlock(parent: string, block: string): EntityDescriptor | null {
    const matchNode = /^(.*)\((.*)\)/;
    const props = block.match(matchNode)?.[2].split(',').map((prop) => prop.trim());

    if (!props) {
      // Handle invalid input here.
      return null;
    }

    const result: EntityDescriptor = {
      parent,
      type: block.match(matchNode)![1] as EntityType,
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

  getObjectWithPropertyAndValueInHierarchy(data: EntityDescriptor[], propertyToFind: string, valueToFind: any): EntityDescriptor | undefined {
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

export { EntityParser }