import re

with open('FieldMap.tsx', 'r', encoding='latin-1') as f:
    content = f.read()

# Add isValidCoordinate helper
if 'isValidCoordinate' not in content:
    content = content.replace('const MapFitter:', '''function isValidCoordinate(lat: any, lng: any): boolean {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

const MapFitter:''')

# Update MapFitter
content = re.sub(r'wells\.filter\(w=>w\.lat&&w\.lng\)', 'wells.filter(w=>isValidCoordinate(w.lat, w.lng))', content)
content = re.sub(r'\(cands\|\|\[\]\)\.map\(c=>\[c\.lat,c\.lng\] as \[number,number\]\)', '(cands||[]).filter(c=>isValidCoordinate(c.lat, c.lng)).map(c=>[c.lat,c.lng] as [number,number])', content)

# Update CameraController
content = re.sub(r'if \(!center\) return;', 'if (!center || !isValidCoordinate(center.lat, center.lng)) return;', content)

# Map key error in polygons
content = re.sub(r'<Polygon key=\{i\}', '<Polygon key={f.name}', content)

# Log invalid wells at the top of FieldMap
if '[MAP] wells received' not in content:
    content = content.replace('useEffect(()=>{ setSelCand(selectedCandId||null); }, [selectedCandId]);', '''useEffect(()=>{ setSelCand(selectedCandId||null); }, [selectedCandId]);

  useEffect(() => {
    let valid = 0, invalid = 0;
    wells.forEach(w => isValidCoordinate(w.lat, w.lng) ? valid++ : invalid++);
    console.log([MAP] wells received = );
    console.log([MAP] valid wells = );
    if (invalid > 0) console.error([MAP] invalid wells = );
  }, [wells]);''')

# Update fieldPolygons
content = content.replace('if (!w.field_name||!w.lat||!w.lng) return;', '''if (!isValidCoordinate(w.lat, w.lng)) {
        console.error([MAP INVALID COORDINATES] type=Well id= latitude= longitude= object=);
        return;
      }
      if (!w.field_name) return;''')

# Update candidates marker loop
content = content.replace('{(candidates||[]).map(c=>(', '''{(candidates||[]).map(c=>{
          if (!isValidCoordinate(c.lat, c.lng)) {
            console.error([MAP INVALID COORDINATES] type=Candidate id= latitude= longitude=);
            return null;
          }
          return (''')
# Close Candidate map
content = content.replace('</Marker>\n        ))}', '''</Marker>
          );
        })}''')

# Update wells marker loop
content = content.replace('{wells.map(well=>(', '''{wells.map(well=>{
          if (!isValidCoordinate(well.lat, well.lng)) return null;
          return (''')
# Close wells marker
content = content.replace('</Marker>\n        ))}', '''</Marker>
          );
        })}''')

# Fix Polyline arrow loop
content = content.replace('{selCandObj?.supportingWells?.map((sw, idx) => (', '''{selCandObj?.supportingWells?.map((sw, idx) => {
          if (!selCandObj || !isValidCoordinate(selCandObj.lat, selCandObj.lng) || !isValidCoordinate(sw.lat, sw.lng)) {
             console.error([MAP INVALID COORDINATES] type=EvidenceArrow candidateId= swLat= swLng=);
             return null;
          }
          return (''')
content = content.replace('/>\n        ))}', '''/>
          );
        })}''')

with open('FieldMap.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated.")
