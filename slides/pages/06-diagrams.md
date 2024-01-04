# Puml to Diagram

<div class="grid grid-cols-2 gap-10 pt-4 -mb-6">
<div>
<h3>Puml input</h3>
```javascript
System(ERP, "Ernterprise Resource Mananagement", "ERP system") {
    Container(AX, "Microsoft Dynamics AX", "", "") {
      Component(AIF, "Application Integration Framework", "", "")
    }
}
```
</div>

<div>
<h3>Rendered output</h3>

```plantuml {scale: 0.7}
@startuml ERP Integration Overview
!includeurl https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

scale 1.0
title Input diagram
System(ERP, "Ernterprise Resource Mananagement", "ERP system") {
    Container(AX, "Microsoft Dynamics AX", "", "") {
      Component(AIF, "Application Integration Framework", "", "")
    }
}

LAYOUT_TOP_DOWN()
SHOW_LEGEND()
@enduml
```

</div>

</div>
