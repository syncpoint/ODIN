
-- query for sample data in WGS84
-- TODO: remove from production

SELECT jsonb_build_object(
         'type', 'FeatureCollection',
         'bbox', ST_Extent(ST_Transform(the_geom, 4326)),
         'features', jsonb_agg(jsonb_build_object(
           'type', 'Feature',
           'title', layer_snapshots.title,
           'geometry', ST_AsGeoJSON(ST_Transform(the_geom, 4326))::jsonb,
           'properties', properties
         ))
       )
FROM   public.oigs
JOIN   public.contxts USING (oig_id)
JOIN   gis.layer_snapshots USING (contxt_id)
WHERE  oig_name_txt = 'SCEN | PLNORD | OVERLAY ORDER NO. 4 (XXX) [CIAVX]';
AND    contxt_name_txt = 'Phase 4A 5BDE';
