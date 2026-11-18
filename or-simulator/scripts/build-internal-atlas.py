from pathlib import Path
from math import sin
from bisect import bisect_right
import json
import struct
import sys
import bpy
import bmesh

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if len(args) != 3:
    raise SystemExit('Run Blender with --python scripts/build-internal-atlas.py -- RAW_DIRECTORY assets/anatomy/structure-sources.json assets/anatomy/internal-atlas.glb')
input_dir, catalog, output = map(Path, args)
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)

# Atlas longitudinal landmarks (mm) mapped to the existing patient model in meters.
height_anchors = [(750,.842),(870,1.015),(1040,1.166),(1200,1.326),(1385,1.499),(1464,1.571),(1530,1.637),(1640,1.762)]
height_values = [source for source, _ in height_anchors]
root_y = .95795
root_forward = -.06885

def register(point, key):
    x, y, z = point
    right = max(1, min(bisect_right(height_values,z), len(height_anchors)-1))
    a, b = height_anchors[right-1], height_anchors[right]
    height = a[1] + (b[1]-a[1]) * (z-a[0]) / (b[0]-a[0])
    head = max(0, min((z-1420)/75,1))
    width_scale = .00092 + head * .00002
    forward = (-y-40)*.00073-.027
    forward += head * (0.055+(-y-75)*.00078-forward)
    if key in {'brainstem','pituitary'}:
        height += .021
        forward -= .017
    if key == 'brain':
        height += .018 * max(0, min((1.71-height)/.075,1))
    if key == 'rectum':
        pelvic_tail = max(0, min((824-z)/65,1))
        height += .036 * pelvic_tail
        forward += .023 * pelvic_tail
    if key == 'prostate':
        height += .006
    return (x*width_scale, -(forward-root_forward), height-root_y)

def load_obj(path):
    vertices, faces = [], []
    for line in path.open():
        if line.startswith('v '):
            vertices.append(tuple(map(float,line.split()[1:4])))
        elif line.startswith('f '):
            faces.append(tuple(int(value.split('/')[0])-1 for value in line.split()[1:]))
    return vertices, faces

def load_stl(path):
    data = path.read_bytes()
    count = struct.unpack_from('<I',data,80)[0]
    assert len(data)==84+50*count, path
    vertices, faces, lookup = [], [], {}
    for index in range(count):
        xyz = struct.unpack_from('<9f',data,84+50*index+12)
        face=[]
        for offset in (0,3,6):
            point=xyz[offset:offset+3]
            if point not in lookup:
                lookup[point]=len(vertices)
                vertices.append(point)
            face.append(lookup[point])
        if len(set(face))==3:
            faces.append(tuple(face))
    return vertices,faces

def linear(value):
    value/=255
    return value/12.92 if value<.04045 else ((value+.055)/1.055)**2.4

def paint(obj, rgb):
    base = tuple(linear((rgb >> bit) & 255) for bit in (16,8,0))
    material = bpy.data.materials.new(f'Tissue · {obj.name}')
    material.use_nodes = True
    material.diffuse_color = (*base,1)
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*base,1)
    shader.inputs['Roughness'].default_value = .50 if obj.name in {'liver','gallbladder','heart','smallBowel'} else .64
    shader.inputs['Specular IOR Level'].default_value = .27
    color_attribute = obj.data.color_attributes.new(name='TissueTone', type='BYTE_COLOR', domain='POINT')
    obj.data.color_attributes.active_color = color_attribute
    for vertex,item in zip(obj.data.vertices,color_attribute.data):
        x,y,z = vertex.co
        shade = .91 + .084 * sin(x*103+z*53)*sin(y*78-z*47) + .038*sin((x+y-z)*221)
        item.color = (*(c*shade for c in base),1)
    color = material.node_tree.nodes.new('ShaderNodeVertexColor')
    color.layer_name = 'TissueTone'
    material.node_tree.links.new(color.outputs['Color'],shader.inputs['Base Color'])
    obj.data.materials.append(material)
    for face in obj.data.polygons:
        face.use_smooth=True

limits = {'brain':21000, 'cerebellum':8500, 'brainstem':6500, 'leftLung':13500, 'rightLung':13500,
          'diaphragm':8200, 'heart':14000, 'liver':11500, 'thyroid':6500, 'aorta':5500}

for key,(system,ids,rgb) in json.loads(catalog.read_text()).items():
    vertices, faces=[],[]
    for id in ids:
        if id.startswith('FJ'):
            points, polygons=load_obj(input_dir/(id+'.obj'))
        else:
            points, polygons=load_stl(input_dir/(id+'.stl'))
        assert points and polygons, id
        start=len(vertices)
        vertices.extend(register(point,key) for point in points)
        faces.extend(tuple(start+idx for idx in face) for face in polygons)
    mesh=bpy.data.meshes.new(key)
    mesh.from_pydata(vertices,[],faces)
    mesh.validate(verbose=False)
    raw=bmesh.new()
    raw.from_mesh(mesh)
    bmesh.ops.remove_doubles(raw, verts=list(raw.verts),dist=.000038)
    bmesh.ops.recalc_face_normals(raw,faces=list(raw.faces))
    raw.to_mesh(mesh)
    raw.free()
    obj=bpy.data.objects.new(key,mesh)
    bpy.context.collection.objects.link(obj)
    obj['system']=system
    obj['source_ids']=' + '.join(ids)
    bpy.context.view_layer.objects.active=obj
    target=limits.get(key, 9500)
    if len(mesh.polygons)>target:
        modifier=obj.modifiers.new('Atlas polygon reduction','DECIMATE')
        modifier.ratio=target/len(mesh.polygons)
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    if key in {'appendix','smallBowel','cecum','bladder'}:
        modifier=obj.modifiers.new('Local surface smoothing','SMOOTH')
        modifier.factor=.31
        modifier.iterations=2
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.validate(verbose=False)
    paint(obj,rgb)
    print('BUILT', key, len(obj.data.polygons), flush=True)

bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',export_apply=True,
    export_animations=False, export_extras=True, export_yup=True)
