import bpy

old_name = "Head"
new_name = "DEF-head"

for action in bpy.data.actions:
    for fcurve in action.fcurves:
        if old_name in fcurve.data_path:
            fcurve.data_path = fcurve.data_path.replace(old_name, new_name)

