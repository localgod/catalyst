# Requirements

- [Node.js](https://nodejs.org) (only runtime dependency)

## Input Format

Catalyst processes C4 diagrams written in PlantUML syntax (.puml files). While the PlantUML runtime is not required, the input files should follow PlantUML's C4 diagram syntax including:

- `System()`, `Container()`, `Component()` declarations
- `Rel()` relationship definitions  
- Standard PlantUML C4 includes and formatting

## Commandline

Catalyst is a commandline tool to support:

- ***Efficiency***: Lightweight and task-focused, command line tools are efficient
  for quick and repetitive tasks on resource-constrained systems.
- ***Scripting and Automation***: Easily integrated into scripts and automation
  workflows for efficient data processing.
- ***Remote Access***: Command line tools are perfect for remote management and
  headless machines.
- ***No External Dependencies***: Pure JavaScript implementation eliminates Java/Graphviz requirements.
