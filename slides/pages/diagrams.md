---
---

# Diagrams

<div class="grid grid-cols-2 gap-10 pt-4 -mb-6">


```plantuml {scale: 0.7}
@startuml ERP Integration Overview
!includeurl https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

scale 1.0
title Input diagram
System(AX, "Microsoft Dynamics AX", "ERP system") {
    Container(AIF, "Application Integration Framework", "", "")
}

LAYOUT_TOP_DOWN()
SHOW_LEGEND()
@enduml
```

```xml
<svg version="1.1"
     width="300" height="200"
     xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="red" />
  <circle cx="150" cy="100" r="80" fill="green" />
  <text x="150" y="125" font-size="60">SVG</text>
</svg>
```
<arrow v-click="0" x1="300" y1="200" x2="500" y2="200" color="#564" width="3" arrowSize="1" />
</div>
