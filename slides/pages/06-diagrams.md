# PlantUML C4 to draw.io

<div class="grid grid-cols-2 gap-10 pt-4 -mb-6">
<div>
<h3>PlantUML C4 Input (.puml)</h3>
```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

System(ERP, "Enterprise Resource Management", "ERP system")
Container(AX, "Microsoft Dynamics AX", "ERP", "Core system")
Component(AIF, "Application Integration Framework", "API", "Integration layer")

Rel(ERP, AX, "Contains")
Rel(AX, AIF, "Uses")
@enduml
```
</div>

<div>
<h3>draw.io Output</h3>

- **Fast Dagre Layout**: Pure JavaScript layout calculation
- **No External Dependencies**: No Java or PlantUML runtime required  
- **Native draw.io Format**: Fully compatible with draw.io editor
- **Proper C4 Styling**: Maintains C4 visual standards

**Result**: Ready-to-edit draw.io diagram with proper positioning, sizing, and C4 styling.

</div>

</div>
