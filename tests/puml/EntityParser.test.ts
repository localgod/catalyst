import { describe, it, expect } from 'vitest';
import { EntityParser } from '../../src/puml/EntityParser.mjs';
import type { EntityDescriptor } from '../../src/puml/EntityDescriptor.interface.mjs';

describe('EntityParser', () => {
  let parser: EntityParser;

  beforeEach(() => {
    parser = new EntityParser();
  });

  it('should create EntityParser instance', () => {
    expect(parser).toBeInstanceOf(EntityParser);
  });

  it('should parse simple system definition', () => {
    const input = 'System(system1, "System 1", "Java", "Main system")';
    const result = parser.parse(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('System');
    expect(result[0].alias).toBe('system1');
    expect(result[0].label).toBe('System 1');
    expect(result[0].technology).toBe('Java');
    expect(result[0].description).toBe('Main system');
  });

  it('should parse system with minimal parameters', () => {
    const input = 'System(system1, "System 1")';
    const result = parser.parse(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('System');
    expect(result[0].alias).toBe('system1');
    expect(result[0].label).toBe('System 1');
    expect(result[0].technology).toBeUndefined();
    expect(result[0].description).toBeUndefined();
  });

  it('should parse container definition', () => {
    const input = 'Container(container1, "Container 1", "Spring Boot", "API container")';
    const result = parser.parse(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('Container');
    expect(result[0].alias).toBe('container1');
    expect(result[0].label).toBe('Container 1');
    expect(result[0].technology).toBe('Spring Boot');
    expect(result[0].description).toBe('API container');
  });

  it('should parse component definition', () => {
    const input = 'Component(comp1, "Component 1", "React", "UI component")';
    const result = parser.parse(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('Component');
    expect(result[0].alias).toBe('comp1');
    expect(result[0].label).toBe('Component 1');
    expect(result[0].technology).toBe('React');
    expect(result[0].description).toBe('UI component');
  });

  it('should parse system with sprite, tags, and link', () => {
    const input = 'System(system1, "System 1", "Java", "Main system", $sprite="server", $tags="tag1", $link="http://example.com")';
    const result = parser.parse(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].sprite).toBe('$sprite=server');
    expect(result[0].tags).toBe('$tags=tag1');
    expect(result[0].link).toBe('$link=http://example.com');
  });

  it('should skip invalid entity types', () => {
    const input = 'InvalidType(invalid1, "Invalid")';
    const result = parser.parse(input);
    
    expect(result).toHaveLength(0);
  });

  it('should skip components (lines starting with specific patterns)', () => {
    const input = `
      @startuml
      !include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml
      title System Context
      System(system1, "System 1")
    `;
    const result = parser.parse(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].alias).toBe('system1');
  });

  it('should handle nested systems with hierarchy', () => {
    const input = `
      System_Boundary(boundary1, "Boundary 1") {
        Container(container1, "Container 1")
        Container(container2, "Container 2")
      }
    `;
    const result = parser.parse(input);
    
    // The parser doesn't recognize System_Boundary as a valid type, so containers are parsed separately
    expect(result).toHaveLength(2);
    expect(result[0].alias).toBe('container1');
    expect(result[1].alias).toBe('container2');
  });

  it('should find object with property and value in hierarchy', () => {
    const data: EntityDescriptor[] = [
      {
        type: 'System',
        alias: 'system1',
        label: 'System 1',
        children: [
          {
            type: 'Container',
            alias: 'container1',
            label: 'Container 1'
          }
        ]
      }
    ];
    
    const result = parser.getObjectWithPropertyAndValueInHierarchy(data, 'alias', 'container1');
    
    expect(result).toBeDefined();
    expect(result!.alias).toBe('container1');
    expect(result!.type).toBe('Container');
  });

  it('should return undefined when object not found in hierarchy', () => {
    const data: EntityDescriptor[] = [
      {
        type: 'System',
        alias: 'system1',
        label: 'System 1'
      }
    ];
    
    const result = parser.getObjectWithPropertyAndValueInHierarchy(data, 'alias', 'nonexistent');
    
    expect(result).toBeUndefined();
  });

  it('should handle multiple systems', () => {
    const input = `
      System(system1, "System 1")
      System(system2, "System 2")
      Container(container1, "Container 1")
    `;
    const result = parser.parse(input);
    
    expect(result).toHaveLength(3);
    expect(result[0].alias).toBe('system1');
    expect(result[1].alias).toBe('system2');
    expect(result[2].alias).toBe('container1');
  });

  it('should handle empty input', () => {
    const result = parser.parse('');
    expect(result).toHaveLength(0);
  });

  it('should handle malformed input gracefully', () => {
    const input = 'System(';
    const result = parser.parse(input);
    expect(result).toHaveLength(0);
  });

  it('should handle system with technology only', () => {
    const input = 'System(system1, "System 1", "Java")';
    const result = parser.parse(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].technology).toBe('Java');
    expect(result[0].description).toBeUndefined();
  });

  it('should handle all valid entity types', () => {
    const input = `
      Person(person1, "Person 1")
      Person_Ext(person2, "Person 2")
      SystemDb(sysdb1, "System DB")
      SystemQueue(sysq1, "System Queue")
      System_Ext(sysext1, "External System")
      SystemDb_Ext(sysdbext1, "External System DB")
      SystemQueue_Ext(sysqext1, "External System Queue")
      ContainerDb(contdb1, "Container DB")
      ContainerQueue(contq1, "Container Queue")
      Container_Ext(context1, "External Container")
      ContainerDb_Ext(contdbext1, "External Container DB")
      ContainerQueue_Ext(contqext1, "External Container Queue")
      ComponentDb(compdb1, "Component DB")
      ComponentQueue(compq1, "Component Queue")
      Component_Ext(compext1, "External Component")
      ComponentDb_Ext(compdbext1, "External Component DB")
      ComponentQueue_Ext(compqext1, "External Component Queue")
    `;
    const result = parser.parse(input);
    
    expect(result).toHaveLength(17);
    expect(result.map(r => r.type)).toContain('Person');
    expect(result.map(r => r.type)).toContain('Person_Ext');
    expect(result.map(r => r.type)).toContain('SystemDb');
    expect(result.map(r => r.type)).toContain('ComponentQueue_Ext');
  });

  it('should skip lines with specific patterns', () => {
    const input = `
      @startuml
      !include something
      title "My Diagram"
      LAYOUT_TOP_DOWN()
      SHOW_LEGEND()
      scale 1.5
      UpdateElementStyle(PERSON, $bgColor="blue")
      UpdateSystemBoundaryStyle($bgColor="red")
      AddRelTag("async", $textColor="blue")
      AddElementTag("external", $bgColor="gray")
      Rel(system1, system2, "Uses", "HTTP")
      System(system1, "System 1")
    `;
    const result = parser.parse(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].alias).toBe('system1');
  });

  it('should handle deeply nested hierarchy', () => {
    const data: EntityDescriptor[] = [
      {
        type: 'System',
        alias: 'system1',
        label: 'System 1',
        children: [
          {
            type: 'Container',
            alias: 'container1',
            label: 'Container 1',
            children: [
              {
                type: 'Component',
                alias: 'component1',
                label: 'Component 1'
              }
            ]
          }
        ]
      }
    ];
    
    const result = parser.getObjectWithPropertyAndValueInHierarchy(data, 'alias', 'component1');
    
    expect(result).toBeDefined();
    expect(result!.alias).toBe('component1');
    expect(result!.type).toBe('Component');
  });

  it('should handle blocks ending with curly braces', () => {
    const input = `
      System_Boundary(boundary1, "Boundary 1") {
        System(system1, "System 1")
      }
      System(system2, "System 2")
    `;
    const result = parser.parse(input);
    
    // System_Boundary is not a valid entity type, so only the systems should be parsed
    expect(result).toHaveLength(2);
    expect(result[0].alias).toBe('system1');
    expect(result[1].alias).toBe('system2');
  });

  it('should handle null parseBlock result', () => {
    const input = 'InvalidType(invalid1, "Invalid")';
    const result = parser.parse(input);
    
    expect(result).toHaveLength(0);
  });

  it('should handle blocks without parent in hierarchy creation', () => {
    const input = `
      System(system1, "System 1")
      Container(container1, "Container 1")
    `;
    const result = parser.parse(input);
    
    expect(result).toHaveLength(2);
    expect(result[0].parent).toBeUndefined();
    expect(result[1].parent).toBeUndefined();
  });

  it('should handle search in empty hierarchy', () => {
    const data: EntityDescriptor[] = [];
    
    const result = parser.getObjectWithPropertyAndValueInHierarchy(data, 'alias', 'nonexistent');
    
    expect(result).toBeUndefined();
  });

  it('should handle search with no children', () => {
    const data: EntityDescriptor[] = [
      {
        type: 'System',
        alias: 'system1',
        label: 'System 1'
      }
    ];
    
    const result = parser.getObjectWithPropertyAndValueInHierarchy(data, 'alias', 'nonexistent');
    
    expect(result).toBeUndefined();
  });
});