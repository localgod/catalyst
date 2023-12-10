# Catalyst

<img src="logo.svg" width="100" height="100" alt="Logo">

## Overview

Catalyst is a software tool designed to facilitate the conversion of
[PlantUML](https://plantuml.com/) C4 diagrams into [draw.io](https://draw.io)
C4 diagrams. This project aims to provide a seamless transition between two
popular diagramming standards, enabling users to leverage the strengths of both.

## Requirements

The following dependencies needs to be available on the system:

- [Java](https://openjdk.org)
- [Graphviz](https://graphviz.org)
- [NodeJS](https://nodejs.org)

## Try it out

- Checkout this repo
- Run `npm install` to install dependencies
- Run `npm run dev` to start typescript compiler
- Run `npm run exec` to test catalyst with the provided demo file `diagram.puml`

The output is written to `output.drawio`.

You may try to make changes to `diagram.puml` to see how catalyst behaves or you
may call catalyst directly like this:
`node ./dist/catalyst.mjs -i input.puml -o output.drawio`

## Purpose

### Bridging Standards

PlantUML and draw.io are widely used diagramming tools, each with its unique
strengths. While PlantUML excels in creating diagrams using textual
descriptions, draw.io offers a more visual and intuitive diagramming
experience. This project seeks to bridge the gap between these two standards,
allowing users to harness the power of both tools.

### Supporting C4 Modelling

The primary goal of this project is to support the [C4](https://c4model.com)
modelling standard. C4 (Context, Containers, Components, and Code) is a popular
architectural modeling approach for visualizing and documenting software
architecture. By enabling the conversion of PlantUML diagrams to draw.io,
this tool facilitates the adoption of C4 modelling by providing a smooth
transition from PlantUML's text-based approach to draw.io's graphical capabilities.

## Key Features

- **PlantUML Compatibility:** The converter is designed to recognize and convert
C4 PlantUML diagrams.

- **draw.io Integration:** The resulting draw.io diagrams are seamlessly
integrated with draw.io's native features, allowing users to further enhance and
refine their diagrams.

## Getting Started

1. **Installation:** Clone the repository and follow the installation
instructions in the README file.

2. **Usage:** Refer to the documentation for detailed instructions on how to use
the converter. Examples and usage scenarios are provided to assist you.

3. **Contribute:** We welcome contributions from the community. Feel free to
submit bug reports, feature requests, or pull requests on our GitHub repository.

## Why Convert?

### Flexibility and Collaboration

- **Textual vs. Visual:** PlantUML allows you to describe diagrams using text,
which can be convenient for version control and collaboration. However, draw.io
offers a more visual and interactive approach, making it easier to create
complex diagrams.

- **Team Collaboration:** Converting PlantUML diagrams to draw.io format can
enhance team collaboration. Team members can work on diagrams using the
user-friendly draw.io interface, even if they are not familiar with PlantUML.

### C4 Modelling Adoption

- **C4 Modelling:** C4 is a widely adopted standard for software architecture
modeling. By supporting C4 modelling in draw.io, this converter facilitates the
adoption of this powerful approach.

- **Better Visualization:** draw.io's graphical capabilities enable the creation
of more visually appealing and informative C4 diagrams, enhancing the
communication of architectural concepts.

## License

This project is released under the [MIT License](LICENSE). You are free to use,
modify, and distribute the software as per the terms of the license.

## Feedback and Support

If you have any questions, feedback, or encounter issues with the converter,
please open an issue.
